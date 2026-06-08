import { createAdminSupabaseClient } from "./config/supabase.js";

async function checkActivation() {
  const adminDb = createAdminSupabaseClient();
  
  const { data: profile } = await adminDb
    .from("profiles")
    .select("email, activation_status, account_type")
    .eq("email", "irmil@gmail.com")
    .single();

  console.log("Profile:", profile);
  process.exit(0);
}

checkActivation();
