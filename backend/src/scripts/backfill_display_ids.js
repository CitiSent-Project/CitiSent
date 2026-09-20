/**
 * ==============================================================================
 * CitiSent Backfill Script: Backfill Unique 6-Digit Display IDs for Existing Users
 * ==============================================================================
 * Usage: node src/scripts/backfill_display_ids.js
 *
 * This script identifies all existing profile records in the `profiles` table
 * that do not have a 6-digit `display_id` assigned, generates a cryptographically
 * secure, non-colliding 6-digit number for each, and safely updates them.
 */

import { createAdminSupabaseClient, supabase } from "../config/supabase.js";
import { generate6DigitId, isValid6DigitId } from "../shared/utils/idGenerator.js";
import { logger } from "../config/logger.js";

async function backfillDisplayIds() {
  const db = createAdminSupabaseClient() || supabase;
  console.log("[Backfill] Connecting to Supabase...");

  // 1. Check if display_id column exists
  const { data: columnCheck, error: columnError } = await db
    .from("profiles")
    .select("display_id")
    .limit(1);

  if (columnError) {
    if (columnError.code === "42703" || columnError.message?.includes("display_id")) {
      console.error(
        "\n[Backfill ERROR] Column 'display_id' does not exist in 'profiles' table yet.",
      );
      console.error(
        "Please run the SQL migration script in your Supabase SQL Editor first:",
      );
      console.error("  -> migrations/001_add_display_id_to_profiles.sql\n");
      process.exit(1);
    }
    console.error("[Backfill ERROR] Database query failed:", columnError);
    process.exit(1);
  }

  // 2. Fetch all profiles to ensure full namespace collision prevention
  console.log("[Backfill] Fetching existing profiles from database...");
  const { data: allProfiles, error: fetchError } = await db
    .from("profiles")
    .select("user_id, display_id, email, username");

  if (fetchError) {
    console.error("[Backfill ERROR] Failed to fetch profiles:", fetchError);
    process.exit(1);
  }

  const existingIds = new Set();
  const profilesNeedingId = [];

  for (const profile of allProfiles || []) {
    if (profile.display_id && isValid6DigitId(profile.display_id)) {
      existingIds.add(String(profile.display_id));
    } else {
      profilesNeedingId.push(profile);
    }
  }

  console.log(`[Backfill] Total profiles: ${allProfiles.length}`);
  console.log(`[Backfill] Already have valid 6-digit ID: ${existingIds.size}`);
  console.log(`[Backfill] Profiles needing a 6-digit ID: ${profilesNeedingId.length}`);

  if (profilesNeedingId.length === 0) {
    console.log("[Backfill] All profiles already possess a valid unique 6-digit User ID. Done!");
    process.exit(0);
  }

  // 3. Assign unique IDs to remaining profiles
  let updatedCount = 0;
  let failCount = 0;

  for (const profile of profilesNeedingId) {
    let candidate = generate6DigitId();
    while (existingIds.has(candidate)) {
      candidate = generate6DigitId();
    }
    existingIds.add(candidate);

    const { error: updateError } = await db
      .from("profiles")
      .update({ display_id: candidate })
      .eq("user_id", profile.user_id);

    if (updateError) {
      console.error(
        `[Backfill Failed] User ${profile.user_id} (${profile.email || profile.username}):`,
        updateError.message,
      );
      failCount++;
    } else {
      updatedCount++;
      if (updatedCount % 25 === 0 || updatedCount === profilesNeedingId.length) {
        console.log(
          `[Backfill Progress] Updated ${updatedCount}/${profilesNeedingId.length} profiles...`,
        );
      }
    }
  }

  console.log("\n==================================================");
  console.log(`[Backfill Complete] Successfully assigned: ${updatedCount}`);
  if (failCount > 0) {
    console.log(`[Backfill Complete] Failed assignments: ${failCount}`);
  }
  console.log("==================================================\n");
  process.exit(failCount > 0 ? 1 : 0);
}

backfillDisplayIds().catch((err) => {
  console.error("[Backfill Fatal Error]:", err);
  process.exit(1);
});
