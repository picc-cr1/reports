// Utility: safely convert input to number
function num(id) {
  const el = document.getElementById(id);
  return el && el.value ? parseInt(el.value, 10) : 0;
}

// Attendance total
function calculateAttendance() {
  const total = num("male") + num("female") + num("heritage") + num("firstTimers");
  document.getElementById("attendanceTotal").value = total;
}

// Offering total
function calculateOffering() {
  const total = num("freeWill") + num("tithe") + num("thanksgiving");
  document.getElementById("offeringTotal").value = total;
}

// Toggle Custom Service (Other)
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

// Capitalize each word
function toTitleCase(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
}

// File to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Main
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reportForm");
  const status = document.getElementById("statusMessage");
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby3tGmvmBCkLxMpnfZwJSS6nwVXV2cj2NcBEXlLVLe2PdegU0Enw3R3qHcnzS5GxWdX/exec";

  // Live attendance/offering calculation
  ["male","female","heritage","firstTimers"].forEach(id => document.getElementById(id).addEventListener("input", calculateAttendance));
  ["freeWill","tithe","thanksgiving"].forEach(id => document.getElementById(id).addEventListener("input", calculateOffering));
  calculateAttendance();
  calculateOffering();

  // Capitalize Pastor Name
  const pastorInput = document.getElementById("pastorName");
  pastorInput.addEventListener("input", () => {
    pastorInput.value = toTitleCase(pastorInput.value);
  });

  // Capitalize Custom Service if Other is selected
  const customInput = document.getElementById("customServiceName");
  customInput.addEventListener("input", () => {
    customInput.value = toTitleCase(customInput.value);
  });

  // Submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.innerText = "Submitting report...";

    try {
      const fileInput = document.getElementById("evidenceImage");
      const file = fileInput && fileInput.files[0];
      const imageBase64 = file ? await fileToBase64(file) : "";

      const payload = {
        pastorCode: pastorInput.value.trim(), // using name as code
        pastorName: pastorInput.value.trim(),
        branch: document.getElementById("branch").value,
        serviceType: document.getElementById("serviceType").value,
        customServiceName: customInput.value.trim(),
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

      // ✅ FIX: no Content-Type header, add mode: no-cors
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload)
      });

      status.innerText = "Report submitted successfully.";
      form.reset();
      toggleCustomService();
      calculateAttendance();
      calculateOffering();

    } catch (err) {
      console.error(err);
      status.innerText = "Submission failed. Please check console.";
    }
  });
});
