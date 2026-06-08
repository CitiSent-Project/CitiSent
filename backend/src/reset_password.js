import { createAdminSupabaseClient } from "./config/supabase.js";

async function resetPassword() {
  const adminDb = createAdminSupabaseClient();
  
  const userId = "4fcc3e8b-1d1f-45d7-9500-f6a121a8a894"; // irmil@gmail.com
  const { data, error } = await adminDb.auth.admin.updateUserById(userId, {
    password: "Password123!"
  });

  if (error) {
    console.error("Failed to reset password:", error);
  } else {
    console.log("Successfully reset password for irmil@gmail.com to Password123!");
  }

  process.exit(0);
}

resetPassword();
