document.addEventListener("DOMContentLoaded", () => {
  const reportsContainer = document.getElementById("reportsContainer");
  const loadingMessage = document.getElementById("loadingMessage");
  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycby3tGmvmBCkLxMpnfZwJSS6nwVXV2cj2NcBEXlLVLe2PdegU0Enw3R3qHcnzS5GxWdX/exec";

  // Utility: force numbers, default to 0
  const n = val => Number(val) || 0;

  // Show loading state
  loadingMessage.textContent = "Loading reports…";

  fetch(`${WEB_APP_URL}?action=getReports`)
    .then(res => res.json())
    .then(data => {
      // Clear loading message
      reportsContainer.innerHTML = "";

      if (!data.reports || data.reports.length === 0) {
        reportsContainer.innerHTML = "<p>No reports found.</p>";
        return;
      }

      // Sort by serviceDate descending (newest first)
      data.reports.sort((a, b) => {
        const dateA = a.serviceDate ? new Date(a.serviceDate) : 0;
        const dateB = b.serviceDate ? new Date(b.serviceDate) : 0;
        return dateB - dateA;
      });

      data.reports.forEach(report => {
        const card = document.createElement("div");

        // =========================
        // SERVICE COLOR CODING
        // =========================
        let serviceClass = "other";
        if (report.serviceType) {
          const t = report.serviceType.toLowerCase();
          if (t.includes("thursday")) serviceClass = "thursday";
          else if (t.includes("sunday")) serviceClass = "sunday";
        }
        card.className = `report-card ${serviceClass}`;

        // =========================
        // NORMALIZED VALUES
        // =========================
        const male = n(report.attendanceMale);
        const female = n(report.attendanceFemale);
        const heritage = n(report.attendanceHeritage);
        const firstTimers = n(report.attendanceFirstTimers);
        const newConverts = n(report.attendanceNewConverts);
        const attendanceTotal = n(report.attendanceTotal);

        const freeWill = n(report.offeringFreeWill);
        const tithe = n(report.offeringTithe);
        const thanksgiving = n(report.offeringThanksgiving);
        const offeringTotal = n(report.offeringTotal);

        // =========================
        // CARD HTML
        // =========================
        card.innerHTML = `
          <div class="line-1">
            ${report.branch || "—"} — ${report.pastorName || "—"}
          </div>
          <div class="line-2">
            ${report.serviceType || "Service"}
            ${report.customServiceName ? `(${report.customServiceName})` : ""}
            • ${report.serviceDate
              ? new Date(report.serviceDate).toLocaleDateString()
              : "—"}
          </div>
          <div class="attendance">
            <strong>Att:</strong>
            M:${male} F:${female} H:${heritage} FT:${firstTimers} NC:${newConverts} |
            <strong>Total:</strong> ${attendanceTotal}
          </div>
          <div class="offerings">
            <strong>Off:</strong>
            FW:${freeWill} T:${tithe} TG:${thanksgiving} |
            <strong>Total:</strong> ${offeringTotal}
          </div>
          ${
            report.evidenceURL
              ? `<img src="${report.evidenceURL}" alt="Evidence image for ${report.branch} ${report.serviceType}">`
              : ""
          }
        `;

        reportsContainer.appendChild(card);
      });
    })
    .catch(err => {
      console.error(err);
      reportsContainer.innerHTML =
        "<p>Failed to load reports. Please try again.</p>";
    });
});
