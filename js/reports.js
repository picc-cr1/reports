document.addEventListener("DOMContentLoaded", async () => {
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby3tGmvmBCkLxMpnfZwJSS6nwVXV2cj2NcBEXlLVLe2PdegU0Enw3R3qHcnzS5GxWdX/exec?action=getReports";
    let reportData = [];
    let currentView = 'cards';

    // --- UTILITIES ---
    const n = val => Number(val) || 0;

    // Formats YYYY-MM-DD string to DD-MM-YYYY for display
    function formatDisplayDate(dateStr) {
        if (!dateStr || !dateStr.includes('-')) return dateStr || '-';
        const parts = dateStr.split('T')[0].split('-');
        if(parts.length !== 3) return dateStr;
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    // --- CORE LOGIC ---
    async function fetchReports() {
        try {
            const res = await fetch(WEB_APP_URL);
            const data = await res.json();
            
            // We take serviceDate exactly as it is from the sheet
            reportData = (data.reports || []).map(r => ({
                ...r,
                // Ensure we only have the YYYY-MM-DD part if there's a timestamp attached
                isoDate: r.serviceDate ? r.serviceDate.split('T')[0] : ""
            }));

            // Populate branch filter
            const branchSet = new Set(reportData.map(r => r.branch).filter(Boolean));
            const branchSelect = document.getElementById('branchSelect');
            branchSelect.innerHTML = `<option value="">All Branches</option>` + 
                [...branchSet].sort().map(b => `<option value="${b}">${b}</option>`).join('');

            renderView();
        } catch (e) {
            console.error("Fetch error:", e);
            document.getElementById("reportsContainer").innerHTML = '<p class="no-data">Failed to load reports.</p>';
        }
    }

    function filterReports() {
        const branch = document.getElementById('branchSelect').value;
        const fromFilter = document.getElementById('dateFrom').value; // HTML date picker returns YYYY-MM-DD
        const toFilter = document.getElementById('dateTo').value;     // HTML date picker returns YYYY-MM-DD

        return reportData.filter(r => {
            if (!r.isoDate) return false;

            let keep = true;
            if (branch) keep = keep && r.branch === branch;
            
            // Direct Alphabetic String Comparison (YYYY-MM-DD)
            // This is 100% accurate for date ranges without timezone issues
            if (fromFilter) keep = keep && r.isoDate >= fromFilter;
            if (toFilter) keep = keep && r.isoDate <= toFilter;

            return keep;
        });
    }

    function renderView() {
        const container = document.getElementById('reportsContainer');
        container.innerHTML = "";
        const filtered = filterReports();

        if (!filtered.length) {
            container.innerHTML = '<p class="no-data">No reports found for these dates.</p>';
            return;
        }

        if (currentView === 'cards') {
            const cardsDiv = document.createElement('div');
            cardsDiv.className = 'cards-container';
            filtered.forEach(r => {
                const c = document.createElement('div');
                const sType = (r.serviceType || '').toLowerCase();
                const cls = sType.includes('sunday') ? 'sunday' : sType.includes('thursday') ? 'thursday' : 'other';
                
                c.className = `report-card ${cls}`;
                c.innerHTML = `
                    <div style="font-weight:700; color:#1e293b;">${r.branch || '-'}</div>
                    <div style="font-size:0.9em; color:#64748b; margin-bottom:8px;">${r.pastorName || '-'}</div>
                    <div style="font-size:0.9em; margin-bottom:10px;">
                        <strong>${r.serviceType || 'Service'}</strong> ${r.customServiceName ? `(${r.customServiceName})` : ''}<br>
                        <span style="color:#0f172a;">${formatDisplayDate(r.isoDate)}</span>
                    </div>
                    <div style="font-size:0.85em; background:#f1f5f9; padding:8px; border-radius:6px;">
                        <strong>Att:</strong> Total ${n(r.attendanceTotal)} (M:${n(r.attendanceMale)} F:${n(r.attendanceFemale)})<br>
                        <strong>Off:</strong> Total ${n(r.offeringTotal)}
                    </div>
                    ${r.evidenceURL ? `<img src="${r.evidenceURL}" style="width:100%; border-radius:8px; margin-top:10px; border:1px solid #e2e8f0;">` : ''}
                `;
                cardsDiv.appendChild(c);
            });
            container.appendChild(cardsDiv);
        } else {
            // Table View Logic
            const table = document.createElement('table');
            const headers = ["Branch", "Pastor", "Service", "Date", "Att", "Off"];
            table.innerHTML = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
            const tbody = document.createElement('tbody');
            filtered.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${r.branch}</td>
                    <td>${r.pastorName}</td>
                    <td>${r.serviceType} ${r.customServiceName ? `(${r.customServiceName})` : ''}</td>
                    <td>${formatDisplayDate(r.isoDate)}</td>
                    <td>${n(r.attendanceTotal)}</td>
                    <td>${n(r.offeringTotal)}</td>
                `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            container.appendChild(table);
        }
    }

    // --- EVENT HANDLERS ---
    document.getElementById('cardsViewBtn').onclick = () => { currentView = 'cards'; renderView(); };
    document.getElementById('tableViewBtn').onclick = () => { currentView = 'table'; renderView(); };
    document.getElementById('resetFilters').onclick = () => {
        document.getElementById('branchSelect').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        renderView();
    };

    ['branchSelect', 'dateFrom', 'dateTo'].forEach(id => {
        document.getElementById(id).addEventListener('change', renderView);
    });

    document.getElementById('downloadPDF').onclick = () => {
        const filtered = filterReports();
        if (!filtered.length) return alert("No data to export.");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("l", "pt", "a4");
        const rows = filtered.map(r => [r.branch, r.pastorName, r.serviceType, formatDisplayDate(r.isoDate), n(r.attendanceTotal), n(r.offeringTotal)]);
        doc.autoTable({ 
            head: [["Branch", "Pastor", "Service", "Date", "Att", "Off"]], 
            body: rows,
            theme: 'grid',
            headStyles: {fillColor: [79, 70, 229]}
        });
        doc.save(`Service_Reports_${new Date().toLocaleDateString()}.pdf`);
    };

    // Initialize
    fetch('nav.html').then(r => r.text()).then(h => document.getElementById('nav-placeholder').innerHTML = h).catch(e => {});
    await fetchReports();
});
