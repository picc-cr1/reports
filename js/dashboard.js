document.addEventListener("DOMContentLoaded", () => {
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby3tGmvmBCkLxMpnfZwJSS6nwVXV2cj2NcBEXlLVLe2PdegU0Enw3R3qHcnzS5GxWdX/exec";

  fetch(`${WEB_APP_URL}?action=getReports`)
    .then(res => res.json())
    .then(data => {
      const reports = data.reports || [];

      // Calculate totals
      let totalAttendance = 0;
      let totalOfferings = 0;
      let serviceCounts = { Thursday: 0, Sunday: 0, Other: 0 };
      let branches = new Set();
      let recentHTML = "";

      reports.slice(-5).reverse().forEach(r => {
        totalAttendance += r.attendanceTotal;
        totalOfferings += r.offeringTotal;
        serviceCounts[r.serviceType] = (serviceCounts[r.serviceType] || 0) + 1;
        branches.add(r.branch);

        recentHTML += `
          <div class="report-card ${r.serviceType.toLowerCase()}">
            <h3>${r.branch} - ${r.pastorName}</h3>
            <p>${r.serviceType}${r.customServiceName ? ` (${r.customServiceName})` : ""} | ${r.serviceDate}</p>
            <p>M:${r.attendanceMale} F:${r.attendanceFemale} H:${r.attendanceHeritage} FT:${r.attendanceFirstTimers} NC:${r.attendanceNewConverts}</p>
            <p>Offerings: FreeWill:${r.offeringFreeWill}, Tithe:${r.offeringTithe}, Thanksgiving:${r.offeringThanksgiving}</p>
          </div>`;
      });

      document.getElementById("totalAttendance").querySelector("p").innerText = totalAttendance;
      document.getElementById("totalOfferings").querySelector("p").innerText = totalOfferings;
      document.getElementById("totalServices").querySelector("p").innerText = reports.length;
      document.getElementById("totalBranches").querySelector("p").innerText = branches.size;
      document.getElementById("recentReports").innerHTML = recentHTML || "<p>No reports found.</p>";

      // Charts
      const ctx1 = document.getElementById("attendanceChart").getContext("2d");
      new Chart(ctx1, {
        type: "bar",
        data: {
          labels: Object.keys(serviceCounts),
          datasets: [{
            label: "Number of Services",
            data: Object.values(serviceCounts),
            backgroundColor: ["#007bff","#28a745","#ffc107"]
          }]
        }
      });

      const ctx2 = document.getElementById("offeringsChart").getContext("2d");
      new Chart(ctx2, {
        type: "pie",
        data: {
          labels: ["FreeWill","Tithe","Thanksgiving"],
          datasets: [{
            label: "Offerings",
            data: [
              reports.reduce((sum,r)=>sum+r.offeringFreeWill,0),
              reports.reduce((sum,r)=>sum+r.offeringTithe,0),
              reports.reduce((sum,r)=>sum+r.offeringThanksgiving,0)
            ],
            backgroundColor: ["#3498db","#2ecc71","#f1c40f"]
          }]
        }
      });

    })
    .catch(err => {
      console.error(err);
      document.getElementById("recentReports").innerHTML = "<p>Failed to load reports.</p>";
    });
});
