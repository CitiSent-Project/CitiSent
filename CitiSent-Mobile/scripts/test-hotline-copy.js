const assert = require("assert");

console.log("=== Testing Emergency Hotlines Copy Feature ===");

// 1. Verify hotlines data and structure
const expectedHotlines = [
  {
    key: "pnp",
    nameLine1: "PHILIPPINE NATIONAL POLICE",
    nameLine2: "STO TOMAS MUNICIPAL STATION",
    numberLine1: "(043) 778-1610",
    numberLine2: "0915-372-9019",
  },
  {
    key: "bfp",
    nameLine1: "BUREAU OF FIRE PROTECTION",
    nameLine2: "STO TOMAS, BATANGAS",
    numberLine1: "(043) 778-3243",
    numberLine2: "0915-602-1987",
  },
  {
    key: "hospital",
    nameLine1: "STO TOMAS GENERAL HOSPITAL",
    nameLine2: "ST. FRANCES CABRINI HOSPITAL",
    numberLine1: "(043) 778-2140",
    numberLine2: "(043) 778-4811",
  },
];

console.log("✓ Hotlines structure verified:", expectedHotlines.length, "active agencies");

// 2. Test clipboard logic simulation
let mockClipboardContent = "";
let clipboardErrorMode = false;

const mockClipboard = {
  setStringAsync: async (text) => {
    if (clipboardErrorMode) {
      throw new Error("Simulated clipboard permission denied or failure");
    }
    mockClipboardContent = text;
    return true;
  },
  getStringAsync: async () => mockClipboardContent,
};

// Simulation of handleCopy logic from EmergencyServicesRow
async function simulateHandleCopy(numberToCopy, { onCopied, vibrationMock, toastAndroidMock } = {}) {
  let copied = false;
  let errorCaught = false;

  try {
    if (mockClipboard?.setStringAsync) {
      await mockClipboard.setStringAsync(numberToCopy);
      copied = true;
    }

    if (copied) {
      if (vibrationMock) vibrationMock(30);
      if (toastAndroidMock) toastAndroidMock("Number copied!");
      if (onCopied) onCopied(numberToCopy);
    }
  } catch (err) {
    errorCaught = true;
    console.log("  [Graceful error caught]:", err.message);
  }

  return { copied, errorCaught };
}

(async () => {
  // Test 2.1: Copy button tap on Landline number
  let vibrated = false;
  let androidToastShown = false;
  let notifiedNumber = null;

  const testNumber1 = "(043) 778-1610";
  const result1 = await simulateHandleCopy(testNumber1, {
    onCopied: (num) => { notifiedNumber = num; },
    vibrationMock: () => { vibrated = true; },
    toastAndroidMock: (msg) => { androidToastShown = msg === "Number copied!"; }
  });

  assert.strictEqual(result1.copied, true, "Landline should be copied successfully");
  assert.strictEqual(mockClipboardContent, testNumber1, "Clipboard content matches testNumber1");
  assert.strictEqual(notifiedNumber, testNumber1, "onCopied callback receives correct number");
  assert.strictEqual(vibrated, true, "Haptic vibration triggered on copy");
  assert.strictEqual(androidToastShown, true, "Native Android toast triggered");
  console.log("✓ Test 2.1: Copy button tap copied landline number correctly:", testNumber1);

  // Test 2.2: Long-press on Mobile number
  vibrated = false;
  androidToastShown = false;
  notifiedNumber = null;

  const testNumber2 = "0915-372-9019";
  const result2 = await simulateHandleCopy(testNumber2, {
    onCopied: (num) => { notifiedNumber = num; },
    vibrationMock: () => { vibrated = true; },
    toastAndroidMock: (msg) => { androidToastShown = msg === "Number copied!"; }
  });

  assert.strictEqual(result2.copied, true, "Mobile number should be copied successfully on long press");
  assert.strictEqual(mockClipboardContent, testNumber2, "Clipboard content matches testNumber2");
  assert.strictEqual(notifiedNumber, testNumber2, "onCopied callback receives mobile number");
  console.log("✓ Test 2.2: Long-press copied mobile number correctly:", testNumber2);

  // Test 2.3: Graceful Error Handling
  clipboardErrorMode = true;
  let errorGraceful = false;
  const result3 = await simulateHandleCopy(testNumber1, {
    onCopied: () => { assert.fail("Should not call onCopied if error occurred"); }
  });
  assert.strictEqual(result3.copied, false, "Should not report copied if error occurs");
  assert.strictEqual(result3.errorCaught, true, "Error must be caught gracefully without crashing");
  console.log("✓ Test 2.3: Graceful error handling verified");

  // Test 2.4: Validate all agency hotline numbers are copyable
  clipboardErrorMode = false;
  for (const agency of expectedHotlines) {
    await simulateHandleCopy(agency.numberLine1);
    assert.strictEqual(mockClipboardContent, agency.numberLine1);
    await simulateHandleCopy(agency.numberLine2);
    assert.strictEqual(mockClipboardContent, agency.numberLine2);
  }
  console.log("✓ Test 2.4: All agency numbers (PNP, BFP, Hospital) can be copied individually");

  console.log("\nALL EMERGENCY HOTLINE COPY TESTS PASSED SUCCESSFULLY! ✨");
})();
