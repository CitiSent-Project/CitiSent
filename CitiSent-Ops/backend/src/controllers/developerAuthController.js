import { z } from "zod";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";
import { logPlatformAction } from "../services/auditService.js";

const registerDevSchema = z.object({
  email: z.string().trim().email("Valid email is required").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * Bootstrap / First-Time Developer Account Creation.
 * Strictly restricted to emails present in DEVELOPER_ALLOWED_EMAILS.
 */
export async function registerDeveloperAccount(req, res) {
  try {
    const parseResult = registerDevSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation error.",
        details: parseResult.error.issues,
      });
    }

    const { email, password } = parseResult.data;

    // Strict Whitelist Check
    if (
      env.developerAllowedEmails.length > 0 &&
      !env.developerAllowedEmails.includes(email)
    ) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: The email "${email}" is not in the developer whitelist (DEVELOPER_ALLOWED_EMAILS).`,
      });
    }

    // Check if user already exists
    const { data: existingUsersData } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
    const existingUser = (existingUsersData?.users || []).find(
      (u) => u.email?.toLowerCase() === email
    );

    let targetUserId = null;

    if (existingUser) {
      // User exists in Supabase Auth: update their password and grant developer privileges
      const { data: updatedUser, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: {
            ...existingUser.user_metadata,
            app_role: "developer",
            is_developer: true,
          },
        });

      if (updateError || !updatedUser?.user) {
        return res.status(502).json({
          success: false,
          error: "Failed to update existing developer account credentials.",
          details: updateError?.message,
        });
      }
      targetUserId = updatedUser.user.id;
    } else {
      // Create fresh developer user with auto email confirmation
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            app_role: "developer",
            is_developer: true,
          },
        });

      if (createError || !newUser?.user) {
        // Fallback: If create error is email_exists, attempt update
        if (createError?.code === "email_exists" || createError?.status === 422) {
          const { data: retryList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
          const matched = (retryList?.users || []).find((u) => u.email?.toLowerCase() === email);
          if (matched) {
            await supabaseAdmin.auth.admin.updateUserById(matched.id, {
              password,
              email_confirm: true,
              user_metadata: { ...matched.user_metadata, app_role: "developer", is_developer: true },
            });
            targetUserId = matched.id;
          } else {
            return res.status(409).json({
              success: false,
              error: "User already registered. Please use the Sign In tab.",
              details: createError.message,
            });
          }
        } else {
          return res.status(502).json({
            success: false,
            error: "Failed to create developer account in Supabase Auth.",
            details: createError?.message,
          });
        }
      } else {
        targetUserId = newUser.user.id;
      }
    }

    // Upsert developer profile record
    await supabaseAdmin.from("profiles").upsert(
      {
        user_id: targetUserId,
        email,
        username: email.split("@")[0],
        account_type: "developer",
        role: "Platform Developer",
        account_status: "active",
        activation_status: "active",
        city: "Santo Tomas",
        province: "Batangas",
        barangay: "Santo Tomas",
      },
      { onConflict: "user_id" }
    );

    await logPlatformAction({
      actorEmail: email,
      actorIp: req.ip,
      userAgent: req.headers["user-agent"],
      actionType: existingUser ? "DEVELOPER_PASSWORD_SYNCED" : "DEVELOPER_REGISTERED",
      targetEntity: "developer",
      targetId: targetUserId,
      metadata: { email, isExistingAccount: !!existingUser },
    });

    return res.status(200).json({
      success: true,
      message: `Developer account for ${email} initialized successfully! Signing in...`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Unexpected error creating developer account.",
      details: err.message,
    });
  }
}
