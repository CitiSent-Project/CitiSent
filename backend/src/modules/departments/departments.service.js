import { StatusCodes } from "http-status-codes";
import { randomUUID } from "node:crypto";
import { AppError } from "../../shared/errors/appError.js";
import { departmentsRepository } from "./departments.repository.js";

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_MIME_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isUniqueConflict(error) {
  const code = String(error?.details?.code || error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "23505" ||
    message.includes("duplicate") ||
    message.includes("unique") ||
    message.includes("already exists")
  );
}

function assertDepartmentFound(department) {
  if (!department) {
    throw new AppError("Department not found", StatusCodes.NOT_FOUND);
  }
}

function assertLogoFile(file) {
  if (!file) {
    throw new AppError("Please choose a logo image to upload.", StatusCodes.BAD_REQUEST);
  }

  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new AppError("The uploaded logo file is empty.", StatusCodes.BAD_REQUEST);
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    throw new AppError("Logo image must be 2MB or smaller.", StatusCodes.BAD_REQUEST);
  }

  if (!ALLOWED_LOGO_MIME_TYPES.has(file.mimetype)) {
    throw new AppError(
      "Logo must be a PNG, JPG, or WebP image.",
      StatusCodes.BAD_REQUEST,
    );
  }
}

function buildLogoObjectPath({ agencyId, file }) {
  const extension = ALLOWED_LOGO_MIME_TYPES.get(file.mimetype) || "png";
  return `logos/${agencyId}/${Date.now()}-${randomUUID()}.${extension}`;
}

async function removeLogoObjectBestEffort({ accessToken, logoPath }) {
  try {
    await departmentsRepository.removeLogoObject({ accessToken, path: logoPath });
  } catch {
    // Logo cleanup should not hide the successful catalog change from the user.
  }
}

export const departmentsService = {
  async listDepartments({ accessToken, includeInactive = false } = {}) {
    return departmentsRepository.listDepartments({
      accessToken,
      includeInactive,
    });
  },

  async getActiveDepartmentByValue({ accessToken, value }) {
    const match = await departmentsRepository.findBySlugOrName({
      accessToken,
      value,
      includeInactive: false,
    });

    if (!match) {
      return null;
    }

    return match;
  },

  async createDepartment({ accessToken, payload }) {
    const slug = normalizeSlug(payload.slug);
    const name = String(payload.name || "").trim();
    const description = String(payload.description || "").trim();

    if (!slug) {
      throw new AppError("Department slug is invalid", StatusCodes.BAD_REQUEST);
    }

    if (!name) {
      throw new AppError("Department name is required", StatusCodes.BAD_REQUEST);
    }

    try {
      return await departmentsRepository.createDepartment({
        accessToken,
        payload: {
          slug,
          name,
          description,
        },
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new AppError(
          "A department with the same slug or name already exists.",
          StatusCodes.CONFLICT,
        );
      }

      throw error;
    }
  },

  async updateDepartment({ accessToken, departmentSlug, payload }) {
    const existing = await departmentsRepository.getDepartmentBySlug({
      accessToken,
      slug: departmentSlug,
    });
    assertDepartmentFound(existing);

    try {
      const updated = await departmentsRepository.updateDepartmentBySlug({
        accessToken,
        slug: departmentSlug,
        payload: {
          ...(payload.name !== undefined ? { name: String(payload.name || "").trim() } : {}),
          ...(payload.description !== undefined
            ? { description: String(payload.description || "").trim() }
            : {}),
        },
      });

      assertDepartmentFound(updated);
      return updated;
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new AppError(
          "A department with the same slug or name already exists.",
          StatusCodes.CONFLICT,
        );
      }

      throw error;
    }
  },

  async setDepartmentActive({ accessToken, departmentSlug, isActive }) {
    const existing = await departmentsRepository.getDepartmentBySlug({
      accessToken,
      slug: departmentSlug,
    });
    assertDepartmentFound(existing);

    const updated = await departmentsRepository.setDepartmentActive({
      accessToken,
      slug: departmentSlug,
      isActive,
    });

    assertDepartmentFound(updated);
    return updated;
  },

  async updateDepartmentLogo({ accessToken, departmentSlug, file }) {
    assertLogoFile(file);

    const existing = await departmentsRepository.getDepartmentBySlug({
      accessToken,
      slug: departmentSlug,
    });
    assertDepartmentFound(existing);

    if (!existing.agencyId) {
      throw new AppError(
        "Department is missing its agency identifier.",
        StatusCodes.BAD_GATEWAY,
      );
    }

    const nextLogoPath = buildLogoObjectPath({
      agencyId: existing.agencyId,
      file,
    });

    await departmentsRepository.uploadLogoObject({
      accessToken,
      path: nextLogoPath,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    try {
      const updated = await departmentsRepository.updateDepartmentLogoPath({
        accessToken,
        slug: departmentSlug,
        logoPath: nextLogoPath,
      });

      assertDepartmentFound(updated);

      if (existing.logoPath && existing.logoPath !== nextLogoPath) {
        await removeLogoObjectBestEffort({
          accessToken,
          logoPath: existing.logoPath,
        });
      }

      return updated;
    } catch (error) {
      await removeLogoObjectBestEffort({
        accessToken,
        logoPath: nextLogoPath,
      });
      throw error;
    }
  },

  async deleteDepartmentLogo({ accessToken, departmentSlug }) {
    const existing = await departmentsRepository.getDepartmentBySlug({
      accessToken,
      slug: departmentSlug,
    });
    assertDepartmentFound(existing);

    if (existing.logoPath) {
      await removeLogoObjectBestEffort({
        accessToken,
        logoPath: existing.logoPath,
      });
    }

    const updated = await departmentsRepository.updateDepartmentLogoPath({
      accessToken,
      slug: departmentSlug,
      logoPath: null,
    });

    assertDepartmentFound(updated);
    return updated;
  },

  async deleteDepartment({ accessToken, departmentSlug }) {
    const existing = await departmentsRepository.getDepartmentBySlug({
      accessToken,
      slug: departmentSlug,
    });
    assertDepartmentFound(existing);

    const references = await departmentsRepository.countDepartmentReferences({
      accessToken,
      slug: existing.slug,
      name: existing.name,
    });

    if (references.total > 0) {
      throw new AppError(
        "Department is currently in use. Deactivate it instead of deleting.",
        StatusCodes.CONFLICT,
        references,
      );
    }

    const deleted = await departmentsRepository.deleteDepartmentBySlug({
      accessToken,
      slug: departmentSlug,
    });
    assertDepartmentFound(deleted);

    if (deleted.logoPath) {
      await removeLogoObjectBestEffort({
        accessToken,
        logoPath: deleted.logoPath,
      });
    }

    return deleted;
  },
};
