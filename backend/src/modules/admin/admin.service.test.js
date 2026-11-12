import test from "node:test";
import assert from "node:assert/strict";
import { adminService } from "./admin.service.js";
import { adminRepository } from "./admin.repository.js";
import { departmentsService } from "../departments/departments.service.js";
import { reportMessagesRepository } from "../reports/messages.repository.js";
import { reportsSentimentClient } from "../reports/reports.sentiment.js";
import { cacheService } from "../../shared/cache/cacheService.js";

test("getAdminNoteSuggestions uses conversation context when it exists", async () => {
  const originals = {
    getReportById: adminRepository.getReportById,
    getConversation: reportMessagesRepository.getConversation,
    getAdminNoteSuggestions: reportsSentimentClient.getAdminNoteSuggestions,
    getJSON: cacheService.getJSON,
    setJSON: cacheService.setJSON,
  };

  try {
    adminRepository.getReportById = async () => ({
      row: {
        id: "report-1", user_id: "citizen-1", status: "pending", issue_type: "Flooding",
        sentiment_label: "High", emotion_level: "Angry", description: "Water is rising near the road.",
      },
    });
    reportMessagesRepository.getConversation = async () => ({
      rows: [
        { id: "message-1", sender_id: "citizen-1", message: "The water is getting worse." },
        { id: "message-2", sender_id: "admin-1", message: "We are reviewing it." },
      ],
    });
    cacheService.getJSON = async () => null;
    cacheService.setJSON = async () => {};
    let payload;
    reportsSentimentClient.getAdminNoteSuggestions = async (input) => {
      payload = input;
      return { suggestedNotes: [{ text: "Review in progress.", rank: 1 }] };
    };

    const result = await adminService.getAdminNoteSuggestions({
      actor: { id: "admin-1" }, accessToken: "token", reportId: "report-1", status: "in_review",
    });

    assert.equal(result.suggestedNotes[0].text, "Review in progress.");
    assert.equal(payload.reportStatus, "in_review");
    assert.equal(payload.detectedEmotion, "Angry");
    assert.deepEqual(payload.conversationContext, [
      { sender: "Citizen", text: "The water is getting worse." },
      { sender: "Admin", text: "We are reviewing it." },
    ]);
  } finally {
    adminRepository.getReportById = originals.getReportById;
    reportMessagesRepository.getConversation = originals.getConversation;
    reportsSentimentClient.getAdminNoteSuggestions = originals.getAdminNoteSuggestions;
    cacheService.getJSON = originals.getJSON;
    cacheService.setJSON = originals.setJSON;
  }
});

test("getAdminNoteSuggestions falls back to the report sentiment without a conversation", async () => {
  const originals = {
    getReportById: adminRepository.getReportById,
    getConversation: reportMessagesRepository.getConversation,
    getAdminNoteSuggestions: reportsSentimentClient.getAdminNoteSuggestions,
    getJSON: cacheService.getJSON,
    setJSON: cacheService.setJSON,
  };

  try {
    adminRepository.getReportById = async () => ({
      row: { id: "report-1", user_id: "citizen-1", status: "pending", emotion_level: "Frustrated" },
    });
    reportMessagesRepository.getConversation = async () => ({ rows: [] });
    cacheService.getJSON = async () => null;
    cacheService.setJSON = async () => {};
    reportsSentimentClient.getAdminNoteSuggestions = async () => {
      throw new Error("Sidecar unavailable");
    };

    const result = await adminService.getAdminNoteSuggestions({
      actor: { id: "admin-1" }, accessToken: "token", reportId: "report-1", status: "pending",
    });

    assert.equal(result.suggestedNotes.length, 4);
    assert.equal(result.triggerEmotion, "Frustrated");
    assert.match(result.reason, /Sidecar unavailable/);
  } finally {
    adminRepository.getReportById = originals.getReportById;
    reportMessagesRepository.getConversation = originals.getConversation;
    reportsSentimentClient.getAdminNoteSuggestions = originals.getAdminNoteSuggestions;
    cacheService.getJSON = originals.getJSON;
    cacheService.setJSON = originals.setJSON;
  }
});

test("adminService.listReports uses Redis cache when present", async () => {
  const originals = {
    listReports: adminRepository.listReports,
    getJSON: cacheService.getJSON,
    setJSON: cacheService.setJSON,
  };

  try {
    const cachedResponse = {
      data: [{ id: "cached-report-1", reportNumber: "REP-001" }],
      pagination: { total: 1, limit: 50, offset: 0 },
    };

    cacheService.getJSON = async (key) => {
      if (key.includes("admin:reports:")) {
        return cachedResponse;
      }
      return null;
    };

    let repoCalled = false;
    adminRepository.listReports = async () => {
      repoCalled = true;
      return { rows: [], count: 0, reporterProfilesByUserId: {} };
    };

    const result = await adminService.listReports({
      actor: { role: "superadmin" },
      accessToken: "token",
      limit: 50,
      offset: 0,
    });

    assert.equal(repoCalled, false);
    assert.deepEqual(result, cachedResponse);
  } finally {
    adminRepository.listReports = originals.listReports;
    cacheService.getJSON = originals.getJSON;
    cacheService.setJSON = originals.setJSON;
  }
});

test("adminService.listReports includes resolvedAt on mapped report items", async () => {
  const originals = {
    listReports: adminRepository.listReports,
    listDepartments: departmentsService.listDepartments,
    getJSON: cacheService.getJSON,
    setJSON: cacheService.setJSON,
  };

  try {
    cacheService.getJSON = async () => null;
    cacheService.setJSON = async () => {};
    departmentsService.listDepartments = async () => [];

    adminRepository.listReports = async () => ({
      rows: [
        {
          id: "rep-1",
          report_number: "bfp-0023",
          status: "resolved",
          resolved_at: "2026-09-17T04:38:40.769Z",
          user_id: "u1",
        },
      ],
      count: 1,
      reporterProfilesByUserId: {
        u1: { email: "u1@test.com" },
      },
    });

    const result = await adminService.listReports({
      actor: { role: "superadmin" },
      accessToken: "token",
      limit: 50,
      offset: 0,
    });

    assert.equal(result.data.length, 1);
    assert.equal(result.data[0].resolvedAt, "2026-09-17T04:38:40.769Z");
  } finally {
    adminRepository.listReports = originals.listReports;
    departmentsService.listDepartments = originals.listDepartments;
    cacheService.getJSON = originals.getJSON;
    cacheService.setJSON = originals.setJSON;
  }
});

test("adminService.listFeedback aggregates ratings, satisfaction statistics, and scopes items to resolved reports", async () => {
  const originals = {
    listResolvedReportsAndFeedback: adminRepository.listResolvedReportsAndFeedback,
    listDepartments: departmentsService.listDepartments,
  };

  try {
    departmentsService.listDepartments = async () => [
      { id: "dept-1", slug: "engineering", name: "City Engineering Office" },
    ];

    adminRepository.listResolvedReportsAndFeedback = async () => ({
      resolvedReports: [
        {
          id: "rep-1",
          report_number: "ENG-0001",
          issue_type: "engineering",
          location: "Poblacion I",
          description: "Pothole repair",
          status: "resolved",
          sentiment_label: "High",
          resolved_at: "2026-11-12T10:00:00.000Z",
          created_at: "2026-11-10T08:00:00.000Z",
          user_id: "u1",
        },
        {
          id: "rep-2",
          report_number: "ENG-0002",
          issue_type: "engineering",
          location: "San Vicente",
          description: "Broken streetlight",
          status: "resolved",
          sentiment_label: "Medium",
          resolved_at: "2026-11-12T12:00:00.000Z",
          created_at: "2026-11-11T08:00:00.000Z",
          user_id: "u2",
        },
        {
          id: "rep-3",
          report_number: "ENG-0003",
          issue_type: "engineering",
          location: "Sta. Clara",
          description: "Drainage clog",
          status: "resolved",
          sentiment_label: "Low",
          resolved_at: "2026-11-12T14:00:00.000Z",
          created_at: "2026-11-11T09:00:00.000Z",
          user_id: "u3",
        },
      ],
      feedbackList: [
        {
          id: "fb-1",
          reportId: "rep-1",
          userId: "u1",
          rating: 5,
          isSatisfied: true,
          comment: "Pothole was fixed properly.",
          createdAt: "2026-11-12T11:00:00.000Z",
        },
        {
          id: "fb-2",
          reportId: "rep-2",
          userId: "u2",
          rating: 3,
          isSatisfied: false,
          comment: "Took a little longer than expected.",
          createdAt: "2026-11-12T13:00:00.000Z",
        },
        {
          id: "fb-other-dept",
          reportId: "rep-outside-scope",
          userId: "u99",
          rating: 1,
          isSatisfied: false,
          comment: "Should not appear for this department",
          createdAt: "2026-11-12T15:00:00.000Z",
        },
      ],
      reporterProfilesByUserId: {
        u1: { email: "resident1@test.com", fname: "Juan", lname: "Dela Cruz" },
        u2: { email: "resident2@test.com", fname: "Maria", lname: "Santos" },
      },
    });

    const result = await adminService.listFeedback({
      actor: { role: "Office Admin", departmentId: "engineering" },
      accessToken: "token",
    });

    assert.equal(result.items.length, 2);
    assert.equal(result.stats.totalFeedback, 2);
    assert.equal(result.stats.totalResolvedReports, 3);
    assert.equal(result.stats.averageRating, 4);
    assert.equal(result.stats.satisfiedCount, 1);
    assert.equal(result.stats.unsatisfiedCount, 1);
    assert.equal(result.stats.satisfactionRate, 50);
    assert.equal(result.stats.responseRate, 66.7);
    assert.deepEqual(result.stats.ratingDistribution, { 1: 0, 2: 0, 3: 1, 4: 0, 5: 1 });

    // Filtered query check (rating = 5)
    const filteredResult = await adminService.listFeedback({
      actor: { role: "Office Admin", departmentId: "engineering" },
      accessToken: "token",
      rating: 5,
    });
    assert.equal(filteredResult.items.length, 1);
    assert.equal(filteredResult.items[0].reportNumber, "ENG-0001");
  } finally {
    adminRepository.listResolvedReportsAndFeedback = originals.listResolvedReportsAndFeedback;
    departmentsService.listDepartments = originals.listDepartments;
  }
});


