import { StatusCodes } from "http-status-codes";
import { createAdminSupabaseClient, createUserSupabaseClient, supabase } from "../../config/supabase.js";
import { AppError } from "../../shared/errors/appError.js";
import { canAccessDepartment, isAdminRole } from "../../shared/auth/roleAccess.js";

const REPORTS_TABLE = "reports";
const REPORT_MESSAGES_TABLE = "report_messages";
const REPORT_MESSAGE_READS_TABLE = "report_message_reads";
const PROFILES_TABLE = "profiles";
const AGENCY_STAFF_USERS_TABLE = "agency_staff_users";
const AGENCIES_TABLE = "agencies";

import { cacheService } from "../../shared/cache/cacheService.js";

function getDb(accessToken) {
  return createAdminSupabaseClient() || createUserSupabaseClient(accessToken) || supabase;
}

function toGatewayError(message, details) {
  return new AppError(message, StatusCodes.BAD_GATEWAY, details);
}

const SENDER_PROFILE_CACHE_TTL_SECONDS = 300;

async function loadSenderProfiles(db, rows = []) {
  const senderIds = Array.from(new Set(rows.map((row) => row.sender_id).filter(Boolean)));

  if (!senderIds.length) {
    return {};
  }

  const profilesMap = {};
  const missingIds = [];

  // Check cache for each sender profile
  await Promise.all(
    senderIds.map(async (senderId) => {
      const cached = await cacheService.getJSON(`profile:sender:${senderId}`);
      if (cached) {
        profilesMap[senderId] = cached;
      } else {
        missingIds.push(senderId);
      }
    }),
  );

  if (!missingIds.length) {
    return profilesMap;
  }

  const { data, error } = await db
    .from(PROFILES_TABLE)
    .select("user_id, email, username, fname, mname, lname, role, account_type")
    .in("user_id", missingIds);

  if (error) {
    throw toGatewayError("Failed to fetch message sender profiles", error);
  }

  for (const profile of data || []) {
    profilesMap[profile.user_id] = profile;
    await cacheService.setJSON(
      `profile:sender:${profile.user_id}`,
      profile,
      SENDER_PROFILE_CACHE_TTL_SECONDS,
    );
  }

  return profilesMap;
}


export const reportMessagesRepository = {
  async getReportById({ reportId, accessToken }) {
    const db = getDb(accessToken);
    const { data, error } = await db.from(REPORTS_TABLE).select("*").eq("id", reportId).maybeSingle();

    if (error) {
      throw toGatewayError("Failed to fetch report", error);
    }

    return data;
  },

  async isParticipantForReport({ reportId, userId, accessToken }) {
    const db = getDb(accessToken);
    const storedReport = await this.getReportById({ reportId, accessToken });

    if (!storedReport) {
      return { report: null, allowed: false };
    }

    if (String(storedReport.user_id || "") === String(userId || "")) {
      const report = await this.resolveReportAgency({ report: storedReport, db });
      return { report, allowed: true, participantType: "citizen" };
    }

    const report = await this.resolveReportAgency({ report: storedReport, db });

    if (!report.agency_id) {
      return { report, allowed: false };
    }

    const { data, error } = await db
      .from(AGENCY_STAFF_USERS_TABLE)
      .select("user_id, agency_id, role")
      .eq("agency_id", report.agency_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to verify report participant", error);
    }

    if (!error && data) {
      return {
        report,
        allowed: true,
        participantType: data.role || "agency_staff",
      };
    }

    // Support existing admin assignments while the mapping table is populated.
    const { data: profile, error: profileError } = await db
      .from(PROFILES_TABLE)
      .select("user_id, department_id, department_label, role, account_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      throw toGatewayError("Failed to verify report participant", profileError);
    }

    const profileAssignedToAgency =
      isAdminRole(profile?.role) &&
      canAccessDepartment({
        role: profile.role,
        actorDepartmentId: profile.department_id,
        actorDepartmentLabel: profile.department_label,
        resourceDepartmentValue: report.issue_type,
      });

    return {
      report,
      allowed: profileAssignedToAgency,
      participantType: profile?.role || "agency_staff",
    };
  },

  async resolveReportAgency({ report, db }) {
    if (report?.agency_id) {
      return report;
    }

    const issueType = String(report?.issue_type || "").trim();
    if (!issueType) {
      return report;
    }

    const cacheKey = `agency:slug:${issueType.toLowerCase()}`;
    const cachedAgencyId = await cacheService.getJSON(cacheKey);
    if (cachedAgencyId) {
      return { ...report, agency_id: cachedAgencyId };
    }

    // Existing reports are assigned by issue_type (the agency slug), not agency_id.
    const { data, error } = await db
      .from(AGENCIES_TABLE)
      .select("id")
      .eq("slug", issueType)
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to resolve report agency", error);
    }

    if (data?.id) {
      await cacheService.setJSON(cacheKey, data.id, 600);
      return { ...report, agency_id: data.id };
    }

    return report;
  },

  async getAgencyParticipants({ agencyId, accessToken, excludeUserId = null }) {
    const db = getDb(accessToken);
    let query = db
      .from(AGENCY_STAFF_USERS_TABLE)
      .select("user_id, agency_id, role")
      .eq("agency_id", agencyId);

    if (excludeUserId) {
      query = query.neq("user_id", excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      throw toGatewayError("Failed to fetch agency participants", error);
    }

    return data || [];
  },

  async getConversation({ reportId, accessToken }) {
    const db = getDb(accessToken);
    const { data, error, count } = await db
      .from(REPORT_MESSAGES_TABLE)
      .select(
        `
          *,
          report_message_reads!left (
            user_id,
            is_read,
            read_at
          )
        `,
        { count: "exact" },
      )
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });

    if (error) {
      throw toGatewayError("Failed to fetch report messages", error);
    }

    const senderProfilesByUserId = await loadSenderProfiles(db, data || []);

    return {
      rows: data || [],
      count: count || 0,
      senderProfilesByUserId,
    };
  },

  async createMessage({ reportId, senderId, message, accessToken }) {
    const db = getDb(accessToken);
    const { data, error } = await db
      .from(REPORT_MESSAGES_TABLE)
      .insert({
        report_id: reportId,
        sender_id: senderId,
        message,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      throw toGatewayError("Failed to create report message", error);
    }

    return data;
  },

  async markMessagesRead({ reportId, readerId, accessToken, messageIds = null }) {
    const db = getDb(accessToken);
    const now = new Date().toISOString();
    let messageQuery = db
      .from(REPORT_MESSAGES_TABLE)
      .select("id")
      .eq("report_id", reportId)
      .neq("sender_id", readerId);

    if (Array.isArray(messageIds) && messageIds.length > 0) {
      messageQuery = messageQuery.in("id", messageIds);
    }

    const { data, error } = await messageQuery;

    if (error) {
      throw toGatewayError("Failed to resolve unread messages", error);
    }

    const unreadMessageIds = (data || []).map((row) => row.id);

    if (!unreadMessageIds.length) {
      return [];
    }

    const { data: readRows, error: readError } = await db
      .from(REPORT_MESSAGE_READS_TABLE)
      .upsert(
        unreadMessageIds.map((messageId) => ({
          message_id: messageId,
          user_id: readerId,
          is_read: true,
          read_at: now,
        })),
        { onConflict: "message_id,user_id" },
      )
      .select("*");

    if (readError) {
      throw toGatewayError("Failed to update message read state", readError);
    }

    return readRows || [];
  },
};
