import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCOUNT_TYPES,
  USER_ROLES,
  buildActor,
  canAccessDepartment,
  canReviewTransferRequest,
  canSubmitTransferRequest,
  normalizeUserRole,
} from "./roleAccess.js";

test("normalizeUserRole maps legacy administrator values", () => {
  assert.equal(normalizeUserRole("Administrator"), USER_ROLES.SUPERADMIN);
  assert.equal(normalizeUserRole("office admin"), USER_ROLES.OFFICE_ADMIN);
  assert.equal(normalizeUserRole(""), "");
});

test("canAccessDepartment allows superadmins and scopes office admins", () => {
  assert.equal(
    canAccessDepartment({
      role: USER_ROLES.SUPERADMIN,
      actorDepartmentId: "all",
      actorDepartmentLabel: "All Departments",
      resourceDepartmentValue: "bplo",
    }),
    true,
  );

  assert.equal(
    canAccessDepartment({
      role: USER_ROLES.OFFICE_ADMIN,
      actorDepartmentId: "bplo",
      actorDepartmentLabel: "Business Permits and Licensing Office (BPLO)",
      resourceDepartmentValue: "bplo",
    }),
    true,
  );

  assert.equal(
    canAccessDepartment({
      role: USER_ROLES.OFFICE_ADMIN,
      actorDepartmentId: "bplo",
      actorDepartmentLabel: "Business Permits and Licensing Office (BPLO)",
      resourceDepartmentValue: "cto",
    }),
    false,
  );
});

test("transfer permissions match the expected role split", () => {
  assert.equal(canReviewTransferRequest(USER_ROLES.SUPERADMIN), true);
  assert.equal(canReviewTransferRequest(USER_ROLES.OFFICE_ADMIN), false);
  assert.equal(canSubmitTransferRequest(USER_ROLES.OFFICE_ADMIN), true);
  assert.equal(canSubmitTransferRequest(USER_ROLES.SUPERADMIN), false);
});

test("buildActor prefers profile role and profile metadata", () => {
  const actor = buildActor({
    authUser: {
      id: "user-1",
      email: "admin@citisent.gov",
      role: "authenticated",
      user_metadata: {},
      created_at: "2026-03-01T00:00:00.000Z",
      last_sign_in_at: "2026-03-10T00:00:00.000Z",
    },
    profile: {
      user_id: "user-1",
      email: "admin@citisent.gov",
      fname: "City",
      lname: "Admin",
      role: "Office Admin",
      account_type: ACCOUNT_TYPES.ADMIN,
      department_id: "cto",
      department_label: "City Treasury Office",
    },
  });

  assert.equal(actor.id, "user-1");
  assert.equal(actor.fullName, "City Admin");
  assert.equal(actor.role, USER_ROLES.OFFICE_ADMIN);
  assert.equal(actor.accountType, ACCOUNT_TYPES.ADMIN);
  assert.equal(actor.departmentId, "cto");
  assert.equal(actor.departmentLabel, "City Treasury Office");
  assert.equal(actor.hasProfile, true);
});

test("buildActor treats profile mname: null as authoritative and does not resurrect stale user_metadata mname", () => {
  const actor = buildActor({
    authUser: {
      id: "user-2",
      email: "juan@example.com",
      role: "citizen",
      user_metadata: {
        fname: "Juan",
        mname: "Pedro",
        lname: "Dela Cruz",
      },
    },
    profile: {
      user_id: "user-2",
      email: "juan@example.com",
      fname: "Juan",
      mname: null,
      lname: "Dela Cruz",
      role: "citizen",
      account_type: ACCOUNT_TYPES.CITIZEN,
    },
  });

  assert.equal(actor.fname, "Juan");
  assert.equal(actor.mname, null);
  assert.equal(actor.middle_name, null);
  assert.equal(actor.lname, "Dela Cruz");
  assert.equal(actor.fullName, "Juan Dela Cruz");
});

test("buildActor reflects updated middle name from profile", () => {
  const actor = buildActor({
    authUser: {
      id: "user-3",
      email: "juan@example.com",
      role: "citizen",
      user_metadata: {
        fname: "Juan",
        mname: "Pedro",
        lname: "Dela Cruz",
      },
    },
    profile: {
      user_id: "user-3",
      email: "juan@example.com",
      fname: "Juan",
      mname: "Santos",
      lname: "Dela Cruz",
      role: "citizen",
      account_type: ACCOUNT_TYPES.CITIZEN,
    },
  });

  assert.equal(actor.mname, "Santos");
  assert.equal(actor.middle_name, "Santos");
  assert.equal(actor.fullName, "Juan Santos Dela Cruz");
});
