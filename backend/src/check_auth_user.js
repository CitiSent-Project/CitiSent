import { createAdminSupabaseClient } from "./config/supabase.js";

async function checkAuthUser() {
  const adminDb = createAdminSupabaseClient();
  
  const { data: profile } = await adminDb
    .from("profiles")
    .select("user_id, email, account_status")
    .eq("account_status", "active")
    .limit(10);

  console.log("Profiles found:", profile?.length);
  
  if (profile && profile.length > 0) {
    for (const p of profile) {
      const { data: authUser, error } = await adminDb.auth.admin.getUserById(p.user_id);
      if (error) {
        console.log(`Error fetching auth user for ${p.email}:`, error.message);
      } else {
        console.log(`Auth user for ${p.email} exists! ID:`, authUser.user.id);
      }
    }
  }

  process.exit(0);
}

checkAuthUser();
