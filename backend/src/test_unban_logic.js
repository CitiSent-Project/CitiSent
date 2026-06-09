import { authRepository } from "./modules/auth/auth.repository.js";
import { authService } from "./modules/auth/auth.service.js";
import { createAdminSupabaseClient } from "./config/supabase.js";

async function testUnbannedUser() {
  console.log("=== Testing Unbanned User Logic ===");
  
  const adminDb = createAdminSupabaseClient();
  
  // Find a user who is currently NOT banned, but has a record in banned_users (so they were unbanned)
  const { data: unbannedRows } = await adminDb
    .from("banned_users")
    .select("user_id")
    .eq("is_active", false)
    .limit(1);

  if (!unbannedRows || unbannedRows.length === 0) {
    console.log("No unbanned users found in the database.");
    process.exit(0);
  }

  const unbannedUserId = unbannedRows[0].user_id;
  console.log("Found unbanned user_id:", unbannedUserId);

  const { data: profile } = await adminDb
    .from("profiles")
    .select("email, username, phone_number, account_status")
    .eq("user_id", unbannedUserId)
    .single();

  if (!profile) {
    console.log("Unbanned user profile not found!");
    process.exit(1);
  }

  console.log("Profile data:", profile);

  console.log("\nTest 1: authRepository.getProfileByIdentifier");
  const preProfile = await authRepository.getProfileByIdentifier(profile.email);
  console.log("Result getProfileByIdentifier:", preProfile);

  console.log("\nTest 2: checkActiveBanByUserId");
  const isBanned = await authRepository.checkActiveBanByUserId(unbannedUserId);
  console.log("Result isBanned:", isBanned);

  console.log("\nTest 3: simulate resolveLoginEmail");
  try {
    const dedupedCandidates = [profile.email, profile.username, profile.phone_number].filter(Boolean);
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

testUnbannedUser();
