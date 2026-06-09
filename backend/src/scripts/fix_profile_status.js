import { createAdminSupabaseClient } from "../config/supabase.js";

async function fixStatuses() {
  const db = createAdminSupabaseClient();
  if (!db) {
    console.error("Failed to get Admin Supabase Client.");
    process.exit(1);
  }

  console.log("Fetching active bans from banned_users...");
  const { data: bannedRows, error: fetchError } = await db
    .from("banned_users")
    .select("user_id")
    .eq("is_active", true);

  if (fetchError) {
    console.error("Failed to fetch banned users:", fetchError);
    process.exit(1);
  }

  const bannedIds = bannedRows.map((r) => r.user_id);
  console.log(`Found ${bannedIds.length} actively banned users.`);

  if (bannedIds.length > 0) {
    console.log("Updating their profiles to account_status = 'banned'...");
    const { error: banError } = await db
      .from("profiles")
      .update({ account_status: "banned" })
      .in("user_id", bannedIds);

    if (banError) {
      console.error("Failed to sync banned status:", banError);
      process.exit(1);
    }
  }

  console.log("Setting account_status = 'active' for all other profiles (non-banned)...");
  // Set all profiles NOT in the banned list to 'active'
  const { error: activeError } = await db
    .from("profiles")
    .update({ account_status: "active" })
    .neq("account_status", "active") // Only update if it's not already active to save ops
    .not("user_id", "in", `(${bannedIds.length > 0 ? bannedIds.join(',') : 'uuid-does-not-exist'})`);

  if (activeError) {
    console.error("Failed to sync active status:", activeError);
    // Ignore error and continue, maybe the condition is empty
  }

  console.log("✅ Profiles account_status synced with banned_users");
  process.exit(0);
}

fixStatuses();
