import { createAdminSupabaseClient } from "./config/supabase.js";

async function checkNativeBan() {
  const adminDb = createAdminSupabaseClient();
  
  const { data: authUser, error } = await adminDb.auth.admin.getUserById("4fcc3e8b-1d1f-45d7-9500-f6a121a8a894");
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("User banned_until:", authUser.user.banned_until);
    console.log("User object:", JSON.stringify(authUser.user, null, 2));
  }

  process.exit(0);
}

checkNativeBan();
