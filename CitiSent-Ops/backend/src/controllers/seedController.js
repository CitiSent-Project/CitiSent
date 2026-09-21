import { z } from "zod";
import { supabaseAdmin } from "../config/supabase.js";
import { logPlatformAction } from "../services/auditService.js";

const DEFAULT_MUNICIPAL_PRESETS = [
  {
    slug: "engineering",
    name: "City Engineering Office",
    description: "Public works, structural repairs, road maintenance, and urban infrastructure.",
  },
  {
    slug: "health-sanitation",
    name: "City Health & Sanitation Department",
    description: "Public healthcare clinics, sanitary permits, disease surveillance, and hygiene standards.",
  },
  {
    slug: "traffic-transport",
    name: "Traffic & Transport Management Bureau",
    description: "Traffic regulation, public transport franchising, road safety, and traffic signal management.",
  },
  {
    slug: "drrmo",
    name: "Disaster Risk Reduction & Management Office",
    description: "Emergency rescue, disaster preparedness, flood monitoring, and municipal hazard response.",
  },
  {
    slug: "waste-management",
    name: "City Environment & Waste Management Office",
    description: "Garbage collection scheduling, environmental protection, and sanitation monitoring.",
  },
  {
    slug: "social-services",
    name: "City Social Welfare & Development Department",
    description: "Senior citizen assistance, child welfare, crisis intervention, and community programs.",
  },
];

const seedSchema = z.object({
  departments: z.array(
    z.object({
      slug: z.string().trim().min(2).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      name: z.string().trim().min(2).max(160),
      description: z.string().trim().max(600).optional(),
    })
  ).min(1, "At least one department must be selected for seeding."),
});

export async function getDepartmentPresets(req, res) {
  try {
    // Also fetch currently existing agencies from DB to show existing status
    const { data: existingAgencies, error } = await supabaseAdmin
      .from("agencies")
      .select("slug, name, is_active");

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to query existing agencies from database.",
        details: error.message,
      });
    }

    const existingSlugs = new Set((existingAgencies || []).map((a) => a.slug));

    const presetsWithStatus = DEFAULT_MUNICIPAL_PRESETS.map((preset) => ({
      ...preset,
      alreadyExists: existingSlugs.has(preset.slug),
    }));

    return res.json({
      success: true,
      data: {
        presets: presetsWithStatus,
        existingCount: existingAgencies?.length || 0,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Unexpected error retrieving department presets.",
      details: err.message,
    });
  }
}

export async function executeDepartmentSeed(req, res) {
  try {
    const parseResult = seedSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid seeding payload.",
        details: parseResult.error.issues,
      });
    }

    const requestedDepartments = parseResult.data.departments;

    // Fetch existing slugs to ensure idempotency
    const { data: existing } = await supabaseAdmin
      .from("agencies")
      .select("slug");

    const existingSlugs = new Set((existing || []).map((r) => r.slug));
    const toInsert = requestedDepartments.filter((d) => !existingSlugs.has(d.slug));

    let insertedCount = 0;
    if (toInsert.length > 0) {
      const records = toInsert.map((d) => ({
        slug: d.slug,
        name: d.name,
        description: d.description || "",
        is_active: true,
      }));

      const { data, error } = await supabaseAdmin
        .from("agencies")
        .insert(records)
        .select();

      if (error) {
        return res.status(500).json({
          success: false,
          error: "Failed to seed municipal departments.",
          details: error.message,
        });
      }

      insertedCount = data?.length || 0;
    }

    await logPlatformAction({
      actorEmail: req.developer?.email,
      actorIp: req.ip,
      userAgent: req.headers["user-agent"],
      actionType: "DEPARTMENTS_SEEDED",
      targetEntity: "agencies",
      metadata: {
        requestedCount: requestedDepartments.length,
        insertedCount,
        skippedCount: requestedDepartments.length - insertedCount,
        insertedSlugs: toInsert.map((d) => d.slug),
      },
    });

    return res.status(201).json({
      success: true,
      message: `Successfully seeded ${insertedCount} department(s). ${requestedDepartments.length - insertedCount} were already present.`,
      data: {
        insertedCount,
        skippedCount: requestedDepartments.length - insertedCount,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Unexpected error during department seeding.",
      details: err.message,
    });
  }
}
