import { env } from "../config/env.js";
import { supabaseAuthVerifier } from "../config/supabase.js";

/**
 * AppSec Guard: Enforces Supabase Bearer Authentication and Developer Email Whitelisting.
 */
export async function requireDeveloperAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Missing Bearer token.",
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Empty token provided.",
      });
    }

    const { data, error } = await supabaseAuthVerifier.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired session. Please sign in again.",
        details: error?.message,
      });
    }

    const user = data.user;
    const email = String(user.email || "").trim().toLowerCase();

    // Whitelist check
    if (
      env.developerAllowedEmails.length > 0 &&
      !env.developerAllowedEmails.includes(email)
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Your email address is not in the developer whitelist.",
      });
    }

    req.developer = {
      id: user.id,
      email: user.email,
      aal: user.app_metadata?.aal || "aal1",
      user,
    };

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Internal security error verifying developer credentials.",
      details: err.message,
    });
  }
}
