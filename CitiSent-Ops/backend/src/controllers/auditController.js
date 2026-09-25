import { supabaseAdmin } from "../config/supabase.js";

export async function getAuditLogs(req, res) {
  try {
    // Extract query parameters for observability filtering
    const { actionType, startDate, endDate, limit = 100 } = req.query;

    // Start building the query
    let query = supabaseAdmin
      .from("platform_audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply security/observability filters securely via Supabase RPC builder
    // This prevents SQL injection because Supabase handles parameterization safely
    if (actionType) {
      query = query.eq("action_type", actionType);
    }
    
    if (startDate) {
      query = query.gte("created_at", new Date(startDate).toISOString());
    }
    
    if (endDate) {
      // Ensure the end date includes the full day up to the last millisecond
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }

    // Parse and apply limit to prevent massive payload sizes taking down the server
    const parsedLimit = Math.min(parseInt(limit, 10) || 100, 500);
    query = query.limit(parsedLimit);

    // Execute query
    const { data: logs, error } = await query;

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
      metadata: {
        filtersApplied: { actionType, startDate, endDate },
        count: logs?.length || 0
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Unexpected error fetching audit logs.",
      details: err.message,
    });
  }
}
