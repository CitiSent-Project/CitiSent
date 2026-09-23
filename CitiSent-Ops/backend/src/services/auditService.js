import { supabaseAdmin } from "../config/supabase.js";

/**
 * Synchronously writes an immutable audit record to platform_audit_logs.
 */
export async function logPlatformAction({
  actorEmail,
  actorIp = "127.0.0.1",
  userAgent = "CitiSent-Ops",
  actionType,
  targetEntity = null,
  targetId = null,
  metadata = {},
}) {
  try {
    const { error } = await supabaseAdmin.from("platform_audit_logs").insert({
      actor_email: actorEmail || "system",
      actor_ip: actorIp,
      user_agent: userAgent,
      action_type: actionType,
      target_entity: targetEntity,
      target_id: targetId ? String(targetId) : null,
      metadata,
    });

    if (error) {
      console.error("[AuditLog Error] Failed to insert audit log:", error.message);
    }
  } catch (err) {
    console.error("[AuditLog Exception] Unexpected error logging action:", err.message);
  }
}
