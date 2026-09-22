import crypto from "crypto";
import { z } from "zod";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";
import { sendSuperadminInvitationEmail } from "../services/emailService.js";
import { logPlatformAction } from "../services/auditService.js";
import { createSuperadminActivationToken } from "../utils/tokenUtils.js";

const provisionSuperadminSchema = z.object({
  fname: z.string().trim().min(1, "First name is required").max(100),
  mname: z.string().trim().max(100).optional().default(""),
  lname: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Valid email address is required").toLowerCase(),
  phoneNumber: z.string().trim().min(7, "Phone number is required").max(32),
  city: z.string().trim().min(2, "City jurisdiction is required").max(100),
  province: z.string().trim().max(100).optional().default(""),
  barangay: z.string().trim().max(100).optional().default(""),
});

export async function listSuperadmins(req, res) {
  try {
    const { data: superadmins, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        user_id,
        email,
        username,
        fname,
        mname,
        lname,
        phone_number,
        city,
        province,
        barangay,
        role,
        account_status,
        activation_status,
        invitation_sent_at,
        invitation_activated_at,
        created_at,
        display_id
      `)
      .eq("role", "Superadmin")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to query Superadmin directory.",
        details: error.message,
      });
    }

    return res.json({
      success: true,
      data: superadmins || [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Unexpected error fetching Superadmins.",
      details: err.message,
    });
  }
}

export async function provisionSuperadmin(req, res) {
  try {
    const parseResult = provisionSuperadminSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed.",
        details: parseResult.error.issues,
      });
    }

    const payload = parseResult.data;

    // 1. Verify if user profile with this email already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, role")
      .eq("email", payload.email)
      .maybeSingle();

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        error: `An account with email ${payload.email} already exists (Current Role: ${existingProfile.role || "Citizen"}).`,
      });
    }

    const internalInitialPassword = `Tmp!${crypto.randomBytes(16).toString("hex")}#9`;
    const fullName = [payload.fname, payload.mname, payload.lname].filter(Boolean).join(" ");
    const username = `${payload.fname.toLowerCase()}_${payload.lname.toLowerCase()}`.replace(/[^a-z0-9_]/g, "");

    // 2. Create Supabase Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: internalInitialPassword,
      email_confirm: true,
      user_metadata: {
        fname: payload.fname,
        mname: payload.mname,
        lname: payload.lname,
        phone_number: payload.phoneNumber,
        username,
        role: "Superadmin",
        city: payload.city,
      },
    });

    if (authError || !authData?.user) {
      return res.status(502).json({
        success: false,
        error: "Failed to create authentication user in Supabase Auth.",
        details: authError?.message,
      });
    }

    const userId = authData.user.id;

    // 3. Cryptographic token generation (JWT matching CitiSent-Website & backend activation standard)
    const { token, tokenHash } = createSuperadminActivationToken({
      userId,
      email: payload.email,
    });

    // 4. Create Profile Record
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      email: payload.email,
      username,
      fname: payload.fname,
      mname: payload.mname,
      lname: payload.lname,
      phone_number: payload.phoneNumber,
      account_type: "admin",
      role: "Superadmin",
      city: payload.city,
      province: payload.province,
      barangay: payload.barangay,
      activation_status: "pending",
      account_status: "active",
      invitation_token_hash: tokenHash,
      invitation_sent_at: new Date().toISOString(),
      invitation_created_by_user_id: req.developer?.id || null,
    });

    if (profileError) {
      // Rollback auth user creation if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({
        success: false,
        error: "Failed to create Superadmin profile record. Rolled back auth account.",
        details: profileError.message,
      });
    }

    // 5. Generate Setup URL & Dispatch Email
    const setupUrl = `${env.CLIENT_WEB_APP_BASE_URL}/setup-password?token=${token}`;
    
    await sendSuperadminInvitationEmail({
      toEmail: payload.email,
      recipientName: fullName,
      setupUrl,
      jurisdictionCity: payload.city,
    });

    // 6. Audit Logging
    await logPlatformAction({
      actorEmail: req.developer?.email,
      actorIp: req.ip,
      userAgent: req.headers["user-agent"],
      actionType: "SUPERADMIN_PROVISIONED",
      targetEntity: "user",
      targetId: userId,
      metadata: {
        email: payload.email,
        fullName,
        city: payload.city,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Superadmin ${fullName} successfully provisioned. Activation email has been dispatched.`,
      data: {
        userId,
        email: payload.email,
        fullName,
        role: "Superadmin",
        jurisdictionCity: payload.city,
        setupUrl, // Provided for developer manual copy fallback
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Unexpected error during Superadmin provisioning.",
      details: err.message,
    });
  }
}

export async function resendInvite(req, res) {
  try {
    const { id } = req.params;
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, fname, lname, city, activation_status")
      .eq("user_id", id)
      .eq("role", "Superadmin")
      .maybeSingle();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        error: "Superadmin account not found.",
      });
    }

    const { token, tokenHash } = createSuperadminActivationToken({
      userId: id,
      email: profile.email,
    });

    await supabaseAdmin
      .from("profiles")
      .update({
        invitation_token_hash: tokenHash,
        invitation_sent_at: new Date().toISOString(),
      })
      .eq("user_id", id);

    const setupUrl = `${env.CLIENT_WEB_APP_BASE_URL}/setup-password?token=${token}`;
    const fullName = `${profile.fname} ${profile.lname}`.trim();

    await sendSuperadminInvitationEmail({
      toEmail: profile.email,
      recipientName: fullName,
      setupUrl,
      jurisdictionCity: profile.city,
    });

    await logPlatformAction({
      actorEmail: req.developer?.email,
      actorIp: req.ip,
      userAgent: req.headers["user-agent"],
      actionType: "INVITE_RESENT",
      targetEntity: "user",
      targetId: id,
      metadata: { email: profile.email },
    });

    return res.json({
      success: true,
      message: `Invitation re-dispatched to ${profile.email}.`,
      data: {
        userId: id,
        email: profile.email,
        setupUrl,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Unexpected error re-issuing invitation.",
      details: err.message,
    });
  }
}

export async function unlockAccount(req, res) {
  try {
    const { id } = req.params;
    
    // Set account_status to active and unban if in banned_users
    await supabaseAdmin
      .from("profiles")
      .update({ account_status: "active" })
      .eq("user_id", id);

    await supabaseAdmin
      .from("banned_users")
      .update({ is_active: false, unbanned_at: new Date().toISOString() })
      .eq("user_id", id);

    await logPlatformAction({
      actorEmail: req.developer?.email,
      actorIp: req.ip,
      userAgent: req.headers["user-agent"],
      actionType: "ACCOUNT_UNLOCKED",
      targetEntity: "user",
      targetId: id,
    });

    return res.json({
      success: true,
      message: "Account lockouts and restrictions have been successfully cleared.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Unexpected error unlocking account.",
      details: err.message,
    });
  }
}

export async function toggleAccountStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be 'active' or 'suspended'.",
      });
    }

    await supabaseAdmin
      .from("profiles")
      .update({ account_status: status })
      .eq("user_id", id);

    if (status === "suspended") {
      // Invalidate active sessions
      await supabaseAdmin.auth.admin.signOut(id).catch(() => {});
    }

    await logPlatformAction({
      actorEmail: req.developer?.email,
      actorIp: req.ip,
      userAgent: req.headers["user-agent"],
      actionType: status === "suspended" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_ACTIVATED",
      targetEntity: "user",
      targetId: id,
    });

    return res.json({
      success: true,
      message: `Account has been set to ${status}.`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Unexpected error toggling account status.",
      details: err.message,
    });
  }
}
