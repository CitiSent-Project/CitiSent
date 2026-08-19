import test from "node:test";
import assert from "node:assert/strict";

import { departmentsRepository } from "./departments.repository.js";
import { departmentsService } from "./departments.service.js";
import { cacheService } from "../../shared/cache/cacheService.js";

function createDepartment(overrides = {}) {
  return {
    id: "old-department",
    agencyId: "agency-1",
    label: "Old Department",
    slug: "old-department",
    name: "Old Department",
    description: "",
    isActive: false,
    logoPath: null,
    logoUrl: null,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function stubDeleteDependencies(t) {
  const originals = {
    getDepartmentBySlug: departmentsRepository.getDepartmentBySlug,
    findBySlugOrName: departmentsRepository.findBySlugOrName,
    reassignDepartmentReferences: departmentsRepository.reassignDepartmentReferences,
    cleanupDepartmentReferences: departmentsRepository.cleanupDepartmentReferences,
    countDepartmentReferences: departmentsRepository.countDepartmentReferences,
    deleteDepartmentBySlug: departmentsRepository.deleteDepartmentBySlug,
    removeLogoObject: departmentsRepository.removeLogoObject,
    deleteByPrefix: cacheService.deleteByPrefix,
  };

  cacheService.deleteByPrefix = async () => {};

  t.after(() => {
    departmentsRepository.getDepartmentBySlug = originals.getDepartmentBySlug;
    departmentsRepository.findBySlugOrName = originals.findBySlugOrName;
    departmentsRepository.reassignDepartmentReferences =
      originals.reassignDepartmentReferences;
    departmentsRepository.cleanupDepartmentReferences = originals.cleanupDepartmentReferences;
    departmentsRepository.countDepartmentReferences = originals.countDepartmentReferences;
    departmentsRepository.deleteDepartmentBySlug = originals.deleteDepartmentBySlug;
    departmentsRepository.removeLogoObject = originals.removeLogoObject;
    cacheService.deleteByPrefix = originals.deleteByPrefix;
  });
}


test("deleteDepartment cleanup clears inactive department references before deleting", async (t) => {
  stubDeleteDependencies(t);

  const calls = [];
  const existing = createDepartment();

  departmentsRepository.getDepartmentBySlug = async ({ slug }) => {
    assert.equal(slug, "old-department");
    return existing;
  };

  departmentsRepository.cleanupDepartmentReferences = async (payload) => {
    calls.push("cleanup");
    assert.deepEqual(payload, {
      accessToken: "token-123",
      slug: existing.slug,
      name: existing.name,
    });
  };

  departmentsRepository.countDepartmentReferences = async ({ slug, name }) => {
    calls.push("count");
    assert.equal(slug, existing.slug);
    assert.equal(name, existing.name);
    return {
      total: 0,
      breakdown: {
        profiles: 0,
        reports: 0,
        transferRequests: 0,
      },
    };
  };

  departmentsRepository.deleteDepartmentBySlug = async ({ slug }) => {
    calls.push("delete");
    assert.equal(slug, "old-department");
    return existing;
  };

  departmentsRepository.removeLogoObject = async () => {
    calls.push("remove-logo");
  };

  const deleted = await departmentsService.deleteDepartment({
    accessToken: "token-123",
    departmentSlug: "old-department",
    cleanup: true,
  });

  assert.equal(deleted.slug, "old-department");
  assert.deepEqual(calls, ["cleanup", "count", "delete"]);
});

test("deleteDepartment rejects cleanup for active departments", async (t) => {
  stubDeleteDependencies(t);

  departmentsRepository.getDepartmentBySlug = async () =>
    createDepartment({
      isActive: true,
    });

  departmentsRepository.cleanupDepartmentReferences = async () => {
    assert.fail("cleanup should not run for active departments");
  };

  await assert.rejects(
    departmentsService.deleteDepartment({
      accessToken: "token-123",
      departmentSlug: "old-department",
      cleanup: true,
    }),
    (error) => {
      assert.equal(error.statusCode, 409);
      assert.match(error.message, /Deactivate the department before cleaning up/i);
      return true;
    },
  );
});

test("deleteDepartment blocks deletion if cleanup leaves references behind", async (t) => {
  stubDeleteDependencies(t);

  departmentsRepository.getDepartmentBySlug = async () => createDepartment();
  departmentsRepository.cleanupDepartmentReferences = async () => {};
  departmentsRepository.countDepartmentReferences = async () => ({
    total: 1,
    breakdown: {
      profiles: 1,
      reports: 0,
      transferRequests: 0,
    },
  });

  departmentsRepository.deleteDepartmentBySlug = async () => {
    assert.fail("department should not be deleted while references remain");
  };

  await assert.rejects(
    departmentsService.deleteDepartment({
      accessToken: "token-123",
      departmentSlug: "old-department",
      cleanup: true,
    }),
    (error) => {
      assert.equal(error.statusCode, 409);
      assert.match(error.message, /references remain after cleanup/i);
      assert.equal(error.details.breakdown.profiles, 1);
      return true;
    },
  );
});

test("deleteDepartment keeps the existing reassignTo flow unchanged", async (t) => {
  stubDeleteDependencies(t);

  const calls = [];
  const existing = createDepartment();
  const fallback = createDepartment({
    id: "new-department",
    agencyId: "agency-2",
    label: "New Department",
    slug: "new-department",
    name: "New Department",
    isActive: true,
  });

  departmentsRepository.getDepartmentBySlug = async () => existing;
  departmentsRepository.findBySlugOrName = async ({ value, includeInactive }) => {
    calls.push("find-fallback");
    assert.equal(value, "new-department");
    assert.equal(includeInactive, false);
    return fallback;
  };

  departmentsRepository.reassignDepartmentReferences = async (payload) => {
    calls.push("reassign");
    assert.deepEqual(payload, {
      accessToken: "token-123",
      fromSlug: existing.slug,
      fromName: existing.name,
      toSlug: fallback.slug,
      toName: fallback.name,
    });
  };

  departmentsRepository.cleanupDepartmentReferences = async () => {
    assert.fail("cleanup should not run without cleanup=true");
  };

  departmentsRepository.countDepartmentReferences = async () => {
    calls.push("count");
    return {
      total: 0,
      breakdown: {
        profiles: 0,
        reports: 0,
        transferRequests: 0,
      },
    };
  };

  departmentsRepository.deleteDepartmentBySlug = async () => {
    calls.push("delete");
    return existing;
  };

  const deleted = await departmentsService.deleteDepartment({
    accessToken: "token-123",
    departmentSlug: "old-department",
    reassignTo: "new-department",
  });

  assert.equal(deleted.slug, "old-department");
  assert.deepEqual(calls, ["find-fallback", "reassign", "count", "delete"]);
});
