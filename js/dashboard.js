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
      if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = '⏳ Loading...';
      }

      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Server returned an error');

      cachedReports = await response.json();
      renderDashboard(cachedReports);
    } catch (err) {
      console.error('Dashboard load error:', err);
      if (alertContainer) {
        alertContainer.innerHTML = `
          <div class="alert alert-error">
            ⚠️ Could not load reports. Make sure the server is running at <code>http://localhost:3000</code>.
          </div>
        `;
      }
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 Refresh Data';
      }
    }
  }

  /**
   * Update all dashboard metrics, tables, and charts
   */
  function renderDashboard(reports) {
    if (alertContainer) alertContainer.innerHTML = '';

    // If no reports exist, display empty state
    if (!reports || reports.length === 0) {
      if (statTotalReports) statTotalReports.textContent = '0';
      if (statTotalHours) statTotalHours.textContent = '0 hrs';
      if (statAvgDuration) statAvgDuration.textContent = '--';
      if (statHighPriority) statHighPriority.textContent = '0';
      if (statReportedCount) statReportedCount.textContent = '0';
      if (statResolvedCount) statResolvedCount.textContent = '0';

      if (emptyState) emptyState.style.display = 'block';
      if (dashboardContent) dashboardContent.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (dashboardContent) dashboardContent.style.display = 'block';

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

    if (statTotalReports) statTotalReports.textContent = reports.length;
    if (statTotalHours) statTotalHours.textContent = `${totalHours} hrs`;
    if (statAvgDuration) statAvgDuration.textContent = formatMinutes(avgMinutes);
    if (statHighPriority) statHighPriority.textContent = highCount;
    if (statReportedCount) statReportedCount.textContent = reportedCount;
    if (statResolvedCount) statResolvedCount.textContent = resolvedCount;
  }

  if (refreshBtn) refreshBtn.addEventListener('click', loadDashboardData);
  loadDashboardData();
});
