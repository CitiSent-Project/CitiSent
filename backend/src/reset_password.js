import { createAdminSupabaseClient } from "./config/supabase.js";

async function resetPassword() {
  const adminDb = createAdminSupabaseClient();
  const userId = process.env.RESET_USER_ID;
  const password = process.env.RESET_PASSWORD;

  if (!userId || !password) {
    console.error("Usage: RESET_USER_ID=<uuid> RESET_PASSWORD=<new_password> node src/reset_password.js");
    process.exit(1);
  }

  const { data, error } = await adminDb.auth.admin.updateUserById(userId, {
    password,
  });

  if (error) {
    console.error("Failed to reset password:", error);
    process.exit(1);
  } else {
    console.log(`Successfully reset password for user ${userId}.`);
  }

  process.exit(0);
}

resetPassword();
