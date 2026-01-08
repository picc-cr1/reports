/* =========================
   UTILITIES
========================= */

// Safely convert input to number (never NaN, never negative)
function num(id) {
  const el = document.getElementById(id);
  const value = el && el.value ? parseInt(el.value, 10) : 0;
  return isNaN(value) || value < 0 ? 0 : value;
}

// Capitalize Each Word
function toTitleCase(str) {
  return str.replace(/\w\S*/g, w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  );
}

// Convert File to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* =========================
   CALCULATIONS
========================= */

// Attendance total (EXCLUDES new converts)
function calculateAttendance() {
  const total =
    num("male") +
    num("female") +
    num("heritage") +
    num("firstTimers");

  document.getElementById("attendanceTotal").value = total;
}

// Offering total
function calculateOffering() {
  const total =
    num("freeWill") +
    num("tithe") +
    num("thanksgiving");

  document.getElementById("offeringTotal").value = total;
}

/* =========================
   SERVICE TYPE HANDLING
========================= */

function toggleCustomService() {
  const serviceType = document.getElementById("serviceType").value;
  const box = document.getElementById("customServiceBox");
  const input = document.getElementById("customServiceName");

  if (serviceType === "Other") {
    box.style.display = "block";
    input.required = true;
  } else {
    box.style.display = "none";
    input.required = false;
    input.value = "";
  }
}

/* =========================
   MAIN
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reportForm");
  const status = document.getElementById("statusMessage");

  const pastorInput = document.getElementById("pastorName");
  const customServiceInput = document.getElementById("customServiceName");

  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycby3tGmvmBCkLxMpnfZwJSS6nwVXV2cj2NcBEXlLVLe2PdegU0Enw3R3qHcnzS5GxWdX/exec";

  /* =========================
     LIVE CALCULATIONS
  ========================= */

  ["male", "female", "heritage", "firstTimers"].forEach(id => {
    document.getElementById(id).addEventListener("input", calculateAttendance);
  });

  ["freeWill", "tithe", "thanksgiving"].forEach(id => {
    document.getElementById(id).addEventListener("input", calculateOffering);
  });

  calculateAttendance();
  calculateOffering();

  /* =========================
     INPUT FORMATTING
  ========================= */

  pastorInput.addEventListener("blur", () => {
    pastorInput.value = toTitleCase(pastorInput.value.trim());
  });

  customServiceInput.addEventListener("blur", () => {
    customServiceInput.value = toTitleCase(customServiceInput.value.trim());
  });

  /* =========================
     SUBMIT HANDLER
  ========================= */

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    status.style.color = "#333";
    status.innerText = "Submitting report...";

    try {
      const fileInput = document.getElementById("evidenceImage");
      const file = fileInput?.files?.[0];
      const imageBase64 = file ? await fileToBase64(file) : "";

      const payload = {
        pastorCode: pastorInput.value.trim(),
        pastorName: pastorInput.value.trim(),
        branch: document.getElementById("branch").value,
        serviceType: document.getElementById("serviceType").value,
        customServiceName: customServiceInput.value.trim(),
        serviceDate: document.getElementById("serviceDate").value,

        attendance: {
          male: num("male"),
          female: num("female"),
          heritage: num("heritage"),
          firstTimers: num("firstTimers"),
          newConverts: num("newConverts"),
          total: num("attendanceTotal")
        },

        offering: {
          freeWill: num("freeWill"),
          tithe: num("tithe"),
          thanksgiving: num("thanksgiving"),
          total: num("offeringTotal")
        },

        evidenceImageBase64: imageBase64
      };

      // Google Apps Script requires no-cors + no headers
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload)
      });

      status.style.color = "green";
      status.innerText = "Report submitted successfully.";

      form.reset();
      toggleCustomService();
      calculateAttendance();
      calculateOffering();

    } catch (error) {
      console.error(error);
      status.style.color = "red";
      status.innerText =
        "Submission failed. Please check your connection and try again.";
    }
  });
});
