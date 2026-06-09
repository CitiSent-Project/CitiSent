import { authRepository } from "./modules/auth/auth.repository.js";
import { authService } from "./modules/auth/auth.service.js";

async function testBanLogic() {
  console.log("=== Testing Ban Logic ===");
  
  // Use the email of the banned user we found in banned_users_rows.sql
  // or a known username. We'll use one from the database if possible.
  // Wait, let's fetch a banned user first.
  const { createAdminSupabaseClient } = await import("./config/supabase.js");
  const adminDb = createAdminSupabaseClient();
  
  const { data: bannedRows } = await adminDb
    .from("banned_users")
    .select("user_id")
    .eq("is_active", true)
    .limit(1);

  if (!bannedRows || bannedRows.length === 0) {
    console.log("No active bans found in the database. Please ban a user first.");
    process.exit(0);
  }

  const bannedUserId = bannedRows[0].user_id;
  console.log("Found banned user_id:", bannedUserId);

  const { data: profile } = await adminDb
    .from("profiles")
    .select("email, username, phone_number, account_status")
    .eq("user_id", bannedUserId)
    .single();

  if (!profile) {
    console.log("Banned user profile not found!");
    process.exit(1);
  }

  console.log("Profile data:", profile);

  // Test 1: getProfileByIdentifier
  console.log("\nTest 1: authRepository.getProfileByIdentifier");
  const preProfile = await authRepository.getProfileByIdentifier(profile.email);
  console.log("Result:", preProfile);

  if (preProfile) {
    // Test 2: checkActiveBanByUserId
    console.log("\nTest 2: authRepository.checkActiveBanByUserId");
    const isBanned = await authRepository.checkActiveBanByUserId(preProfile.user_id);
    console.log("Result isBanned:", isBanned);
  }

  // Test 3: Attempt login via authService directly? (This requires mocking or real credentials, we will just simulate the payload)
  console.log("\nTest 3: simulate resolveLoginEmail");
  try {
    const payload = { identifier: profile.email };
    // This function is not exported, we simulate it
    const dedupedCandidates = [profile.email];
    let profileEmail = "";
    for (const candidate of dedupedCandidates) {
      const p = await authRepository.getProfileByIdentifier(candidate);
      if (p && p.email) {
        profileEmail = p.email;
        break;
      }
    }
    console.log("Simulated profileEmail:", profileEmail);
  } catch (err) {
    console.log("Simulation error:", err);
  }

  process.exit(0);
}

testBanLogic();
