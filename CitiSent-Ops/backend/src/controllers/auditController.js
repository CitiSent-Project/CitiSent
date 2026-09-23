import { supabaseAdmin } from "../config/supabase.js";

export async function getAuditLogs(req, res) {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from("platform_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to query audit logs.",
        details: error.message,
      });
    }

    return res.json({
      success: true,
      data: logs || [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Unexpected error fetching audit logs.",
      details: err.message,
    });
  }
}
