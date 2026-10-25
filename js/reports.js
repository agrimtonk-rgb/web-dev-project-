/**
 * ============================================================================
 * URJA SETU — REPORTS MANAGEMENT & ANALYSIS (js/reports.js)
 * ============================================================================
 * Handles fetching, filtering, searching, status updates, report deletion,
 * detailed viewing in modal, CSV file export, and printable reports.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const alertContainer = document.getElementById('reportsAlert');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const printReportBtn = document.getElementById('printReportBtn');
  const refreshReportsBtn = document.getElementById('refreshReportsBtn');

  // Summary Stat Elements
  const repStatTotal = document.getElementById('repStatTotal');
  const repStatTotalHours = document.getElementById('repStatTotalHours');
  const repStatAvg = document.getElementById('repStatAvg');
  const repStatHigh = document.getElementById('repStatHigh');
  const repStatReported = document.getElementById('repStatReported');
  const repStatResolved = document.getElementById('repStatResolved');

  // Containers
  const reportsTableContainer = document.getElementById('reportsTableContainer');
  const reportsTableBody = document.getElementById('reportsTableBody');
  const noReportsInDbState = document.getElementById('noReportsInDbState');
  const noFilterMatchState = document.getElementById('noFilterMatchState');
  const resultsCountText = document.getElementById('resultsCountText');

  let allReports = [];

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
   * Helper: Escape HTML characters for safe DOM insertion
   */
  function escapeText(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  /**
   * Shows a temporary notification alert on the page
   */
  function showAlert(type, message) {
    if (!alertContainer) return;
    alertContainer.innerHTML = `<div class="alert alert-${type}"><div>${message}</div></div>`;
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type === 'success') {
      setTimeout(() => { alertContainer.innerHTML = ''; }, 5000);
    }
  }

  /**
   * 1. Fetch all reports from the backend
   */
  async function fetchReports() {
    try {
      if (resultsCountText) resultsCountText.textContent = 'Loading records...';
      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Failed to retrieve reports');

      allReports = await response.json();
      updateSummaries(allReports);
      renderTable(allReports);
    } catch (err) {
      console.error('Fetch error:', err);
      showAlert('error', '⚠️ Could not load reports. Make sure the server is running at <code>http://localhost:3000</code>.');
      if (resultsCountText) resultsCountText.textContent = 'Error connecting to database';
    }
  }

  /**
   * 2. Update summary stat cards
   */
  function updateSummaries(reports) {
    if (!reports || reports.length === 0) {
      if (repStatTotal) repStatTotal.textContent = '0';
      if (repStatTotalHours) repStatTotalHours.textContent = '0 hrs';
      if (repStatAvg) repStatAvg.textContent = '--';
      if (repStatHigh) repStatHigh.textContent = '0';
      if (repStatReported) repStatReported.textContent = '0';
      if (repStatResolved) repStatResolved.textContent = '0';
      return;
    }

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

    if (repStatTotal) repStatTotal.textContent = reports.length;
    if (repStatTotalHours) repStatTotalHours.textContent = `${(totalMinutes / 60).toFixed(1)} hrs`;
    if (repStatAvg) repStatAvg.textContent = formatMinutes(Math.round(totalMinutes / reports.length));
    if (repStatHigh) repStatHigh.textContent = highCount;
    if (repStatReported) repStatReported.textContent = reportedCount;
    if (repStatResolved) repStatResolved.textContent = resolvedCount;
  }

  /**
   * 3. Render reports into the HTML table
   */
  function renderTable(reports) {
    if (!reportsTableBody) return;
    reportsTableBody.innerHTML = '';

    if (!reports || reports.length === 0) {
      if (reportsTableContainer) reportsTableContainer.style.display = 'none';
      if (noReportsInDbState) noReportsInDbState.style.display = 'block';
      if (resultsCountText) resultsCountText.textContent = '0 total records';
      return;
    }

    if (noReportsInDbState) noReportsInDbState.style.display = 'none';
    if (reportsTableContainer) reportsTableContainer.style.display = 'block';
    if (resultsCountText) resultsCountText.textContent = `Showing ${reports.length} of ${allReports.length} reports`;

    const impactNames = {
      farming: 'Farming',
      education: 'Education',
      healthcare: 'Healthcare',
      household: 'Household',
      business: 'Business'
    };

    reports.forEach(r => {
      const tr = document.createElement('tr');
      const isResolved = r.status === 'Resolved';
      const statusBadge = `<span class="badge ${isResolved ? 'badge-status-resolved' : 'badge-status-reported'}">${escapeText(r.status)}</span>`;
      const priorityClass = r.priority === 'high' ? 'badge-priority-high' : (r.priority === 'low' ? 'badge-priority-low' : 'badge-priority-medium');
      const priorityBadge = `<span class="badge ${priorityClass}">${escapeText(r.priority)}</span>`;
      const impactLabel = impactNames[r.impactType] || r.impactType;
      const toggleText = isResolved ? 'Mark Reported' : 'Mark Resolved';
      const toggleBtnClass = isResolved ? 'btn-outline' : 'btn-green';

      tr.innerHTML = `
        <td><strong style="color: #2e7d52;" title="${escapeText(r.id)}">${escapeText(r.id.substring(0, 13))}...</strong></td>
        <td><strong>${escapeText(r.villageName)}</strong></td>
        <td>${escapeText(r.outageDate)}</td>
        <td>${escapeText(r.startTime)} – ${escapeText(r.endTime)}</td>
        <td>${formatMinutes(r.durationMinutes)}</td>
        <td><span class="badge badge-impact">${escapeText(impactLabel)}</span></td>
        <td>${priorityBadge}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-outline btn-sm view-btn" data-id="${escapeText(r.id)}">View</button>
            <button class="${toggleBtnClass} btn-sm toggle-btn" data-id="${escapeText(r.id)}" data-status="${escapeText(r.status)}">${toggleText}</button>
            <button class="btn-danger-outline btn-sm delete-btn" data-id="${escapeText(r.id)}" data-village="${escapeText(r.villageName)}">Delete</button>
          </div>
        </td>
      `;
      reportsTableBody.appendChild(tr);
    });
  }

  if (refreshReportsBtn) refreshReportsBtn.addEventListener('click', fetchReports);
  fetchReports();
});
