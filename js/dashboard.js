/**
 * ============================================================================
 * URJA SETU — DASHBOARD ANALYTICS (js/dashboard.js)
 * ============================================================================
 * Fetches reports, calculates summary statistics, renders pure Canvas charts,
 * and displays the recent outages table and detail modal.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const refreshBtn = document.getElementById('refreshBtn');
  const emptyState = document.getElementById('emptyDashboardState');
  const dashboardContent = document.getElementById('dashboardContent');
  const alertContainer = document.getElementById('dashboardAlert');

  // Stat Card Elements
  const statTotalReports = document.getElementById('statTotalReports');
  const statTotalHours = document.getElementById('statTotalHours');
  const statAvgDuration = document.getElementById('statAvgDuration');
  const statHighPriority = document.getElementById('statHighPriority');
  const statReportedCount = document.getElementById('statReportedCount');
  const statResolvedCount = document.getElementById('statResolvedCount');

  // Table & Modal Elements
  const tableBody = document.getElementById('dashboardTableBody');
  const tableCountBadge = document.getElementById('tableCountBadge');
  const detailsModal = document.getElementById('detailsModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCloseFooterBtn = document.getElementById('modalCloseFooterBtn');
  const modalBody = document.getElementById('modalBody');

  let cachedReports = [];

  /**
   * Helper: Format minutes into "X hrs Y mins"
   */
  function formatMinutes(minutes) {
    if (!minutes && minutes !== 0) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
    if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${mins} min${mins > 1 ? 's' : ''}`;
  }

  /**
   * Helper: Escape strings to prevent HTML injection
   */
  function escapeText(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  /**
   * Fetch all reports from the backend Express server
   */
  async function loadDashboardData() {
    try {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '⏳ Loading...';

      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Server returned an error');

      cachedReports = await response.json();
      renderDashboard(cachedReports);
    } catch (err) {
      console.error('Dashboard load error:', err);
      alertContainer.innerHTML = `
        <div class="alert alert-error">
          ⚠️ Could not load reports. Make sure the server is running at <code>http://localhost:3000</code>.
        </div>
      `;
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄 Refresh Data';
    }
  }

  /**
   * Update all dashboard metrics, tables, and charts
   */
  function renderDashboard(reports) {
    alertContainer.innerHTML = '';

    // If no reports exist, display empty state
    if (!reports || reports.length === 0) {
      statTotalReports.textContent = '0';
      statTotalHours.textContent = '0 hrs';
      statAvgDuration.textContent = '--';
      statHighPriority.textContent = '0';
      statReportedCount.textContent = '0';
      statResolvedCount.textContent = '0';

      emptyState.style.display = 'block';
      dashboardContent.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    dashboardContent.style.display = 'block';

    // 1. Calculate Summary Numbers in a single loop
    let totalMinutes = 0;
    let highCount = 0;
    let reportedCount = 0;
    let resolvedCount = 0;

    reports.forEach(r => {
      totalMinutes += Number(r.durationMinutes) || 0;
      if (r.priority === 'high') highCount++;
      if (r.status === 'Resolved') resolvedCount++;
      else reportedCount++;
    });

    const totalHours = (totalMinutes / 60).toFixed(1);
    const avgMinutes = Math.round(totalMinutes / reports.length);

    statTotalReports.textContent = reports.length;
    statTotalHours.textContent = `${totalHours} hrs`;
    statAvgDuration.textContent = formatMinutes(avgMinutes);
    statHighPriority.textContent = highCount;
    statReportedCount.textContent = reportedCount;
    statResolvedCount.textContent = resolvedCount;

    // 2. Render Recent Reports Table (Latest 10)
    renderRecentTable(reports.slice(0, 10), reports.length);
  }


  /**
   * Populates the recent reports table
   */
  function renderRecentTable(recentReports, totalCount) {
    tableBody.innerHTML = '';
    tableCountBadge.textContent = `Showing latest ${recentReports.length} of ${totalCount} reports`;

    const impactNames = {
      farming: 'Farming & Irrigation',
      education: 'Education',
      healthcare: 'Healthcare',
      household: 'Household',
      business: 'Small Business'
    };

    recentReports.forEach(r => {
      const tr = document.createElement('tr');
      const isResolved = r.status === 'Resolved';
      const statusBadge = `<span class="badge ${isResolved ? 'badge-status-resolved' : 'badge-status-reported'}">${escapeText(r.status)}</span>`;
      const priorityClass = r.priority === 'high' ? 'badge-priority-high' : (r.priority === 'low' ? 'badge-priority-low' : 'badge-priority-medium');
      const priorityBadge = `<span class="badge ${priorityClass}">${escapeText(r.priority)}</span>`;
      const impactLabel = impactNames[r.impactType] || r.impactType;

      tr.innerHTML = `
        <td><strong style="color: #2e7d52;" title="${escapeText(r.id)}">${escapeText(r.id.substring(0, 14))}...</strong></td>
        <td><strong>${escapeText(r.villageName)}</strong></td>
        <td>${escapeText(r.outageDate)}</td>
        <td>${formatMinutes(r.durationMinutes)}</td>
        <td><span class="badge badge-impact">${escapeText(impactLabel)}</span></td>
        <td>${priorityBadge}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn-outline btn-sm view-details-btn" data-id="${escapeText(r.id)}">
            View Details
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach click listeners to "View Details" buttons
    tableBody.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', () => openDetailsModal(btn.getAttribute('data-id')));
    });
  }

  /**
   * Opens the report details modal
   */
  function openDetailsModal(reportId) {
    const report = cachedReports.find(r => r.id === reportId);
    if (!report) return;

    const impactNames = {
      farming: 'Farming & Irrigation',
      education: 'Education & Schooling',
      healthcare: 'Healthcare & Clinics',
      household: 'Household & Daily Life',
      business: 'Small Business & Trade'
    };

    const isResolved = report.status === 'Resolved';
    const statusBadge = `<span class="badge ${isResolved ? 'badge-status-resolved' : 'badge-status-reported'}">${escapeText(report.status)}</span>`;
    const priorityClass = report.priority === 'high' ? 'badge-priority-high' : (report.priority === 'low' ? 'badge-priority-low' : 'badge-priority-medium');

    let evidenceHtml = '<p style="color: #888; font-style: italic; font-size: 13.5px;">No photo attached.</p>';
    if (report.evidenceFile) {
      evidenceHtml = `
        <div style="margin-top: 6px;">
          <a href="${escapeText(report.evidenceFile)}" target="_blank" rel="noopener noreferrer">
            <img src="${escapeText(report.evidenceFile)}" alt="Evidence" style="max-width: 100%; max-height: 200px; border-radius: 6px; border: 1px solid #ddd;">
          </a>
        </div>
      `;
    }

    modalBody.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><span class="detail-label">Report ID</span><span class="detail-value" style="font-family: monospace;">${escapeText(report.id)}</span></div>
        <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">${statusBadge}</span></div>
        <div class="detail-item"><span class="detail-label">Village Name</span><span class="detail-value" style="color: #2e7d52; font-weight: 700;">${escapeText(report.villageName)}</span></div>
        <div class="detail-item"><span class="detail-label">Contact</span><span class="detail-value">${report.contactNumber ? escapeText(report.contactNumber) : '<em>Not provided</em>'}</span></div>
        <div class="detail-item"><span class="detail-label">Date</span><span class="detail-value">${escapeText(report.outageDate)}</span></div>
        <div class="detail-item"><span class="detail-label">Timings</span><span class="detail-value">${escapeText(report.startTime)} – ${escapeText(report.endTime)}</span></div>
        <div class="detail-item"><span class="detail-label">Duration</span><span class="detail-value">${formatMinutes(report.durationMinutes)} (${report.durationMinutes} mins)</span></div>
        <div class="detail-item"><span class="detail-label">Priority</span><span class="detail-value"><span class="badge ${priorityClass}">${escapeText(report.priority)}</span></span></div>
        <div class="detail-item" style="grid-column: 1 / -1;"><span class="detail-label">Impact Sector</span><span class="detail-value">${escapeText(impactNames[report.impactType] || report.impactType)}</span></div>
      </div>
      <div style="margin: 14px 0;">
        <span class="detail-label">Description / Notes</span>
        <div style="background: #faf8f5; border: 1px solid #e5e0d8; padding: 10px; border-radius: 6px; font-size: 14px; margin-top: 4px;">
          ${report.description ? escapeText(report.description) : '<em style="color: #888;">No description provided.</em>'}
        </div>
      </div>
      <div style="margin-bottom: 12px;">
        <span class="detail-label">Evidence Photo</span>
        ${evidenceHtml}
      </div>
    `;

    detailsModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailsModal() {
    detailsModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  modalCloseBtn.addEventListener('click', closeDetailsModal);
  modalCloseFooterBtn.addEventListener('click', closeDetailsModal);
  detailsModal.addEventListener('click', e => { if (e.target === detailsModal) closeDetailsModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetailsModal(); });


  refreshBtn.addEventListener('click', loadDashboardData);
  loadDashboardData();
});
