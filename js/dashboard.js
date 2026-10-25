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

    // 2. Render Canvas Charts
    renderImpactChart(reports);
    renderPriorityChart(reports);
    renderDateChart(reports);
  }

  /**
   * Chart 1: Horizontal Bar Chart - Outages by Impact Category
   */
  function renderImpactChart(reports) {
    const canvas = document.getElementById('impactChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const counts = { farming: 0, education: 0, healthcare: 0, household: 0, business: 0 };
    reports.forEach(r => {
      if (counts[r.impactType] !== undefined) counts[r.impactType]++;
    });

    const categories = [
      { key: 'farming', label: 'Farming', color: '#2e7d52' },
      { key: 'education', label: 'Education', color: '#3b82f6' },
      { key: 'healthcare', label: 'Healthcare', color: '#ef4444' },
      { key: 'household', label: 'Household', color: '#f5a623' },
      { key: 'business', label: 'Business', color: '#8b5cf6' }
    ];

    const maxCount = Math.max(...Object.values(counts), 1);
    const barHeight = 24;
    const gap = 16;
    const startY = 20;
    const labelWidth = 85;
    const chartWidth = width - labelWidth - 60;

    categories.forEach((cat, index) => {
      const y = startY + index * (barHeight + gap);
      const count = counts[cat.key];
      const barW = Math.max((count / maxCount) * chartWidth, 4);

      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(cat.label, labelWidth - 10, y + barHeight / 2);

      // Bar Background
      ctx.fillStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.roundRect(labelWidth, y, chartWidth, barHeight, 4);
      ctx.fill();

      // Colored Bar
      ctx.fillStyle = cat.color;
      ctx.beginPath();
      ctx.roundRect(labelWidth, y, barW, barHeight, 4);
      ctx.fill();

      // Count Number
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${count}`, labelWidth + barW + 8, y + barHeight / 2);
    });
  }

  /**
   * Chart 2: Doughnut Chart - Outages by Priority Level
   */
  function renderPriorityChart(reports) {
    const canvas = document.getElementById('priorityChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const counts = { high: 0, medium: 0, low: 0 };
    reports.forEach(r => {
      if (counts[r.priority] !== undefined) counts[r.priority]++;
    });

    const total = reports.length || 1;
    const slices = [
      { label: 'High', count: counts.high, color: '#ef4444' },
      { label: 'Medium', count: counts.medium, color: '#f5a623' },
      { label: 'Low', count: counts.low, color: '#10b981' }
    ];

    const centerX = width / 2 - 35;
    const centerY = height / 2;
    const radius = 60;
    const innerRadius = 35;

    let currentAngle = -0.5 * Math.PI;

    slices.forEach(slice => {
      const sliceAngle = (slice.count / total) * (2 * Math.PI);
      if (slice.count > 0) {
        ctx.fillStyle = slice.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fill();
      }
      currentAngle += sliceAngle;
    });

    // Center total text
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${reports.length}`, centerX, centerY - 2);
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Reports', centerX, centerY + 14);

    // Legend
    const legendX = width - 85;
    slices.forEach((s, idx) => {
      const ly = 55 + idx * 28;
      ctx.fillStyle = s.color;
      ctx.fillRect(legendX, ly - 5, 10, 10);

      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const pct = Math.round((s.count / total) * 100);
      ctx.fillText(`${s.label}: ${s.count} (${pct}%)`, legendX + 16, ly);
    });
  }

  /**
   * Chart 3: Timeline Bar Chart - Outage Frequency by Date
   */
  function renderDateChart(reports) {
    const canvas = document.getElementById('dateChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Group reports by date
    const dateMap = {};
    reports.forEach(r => {
      dateMap[r.outageDate] = (dateMap[r.outageDate] || 0) + 1;
    });

    // Take recent dates sorted ascending
    const sortedDates = Object.keys(dateMap).sort().slice(-7);
    if (sortedDates.length === 0) return;

    const maxCount = Math.max(...sortedDates.map(d => dateMap[d]), 1);
    const bottomPadding = 30;
    const topPadding = 20;
    const chartHeight = height - bottomPadding - topPadding;
    const barWidth = Math.min(36, (width - 40) / (sortedDates.length * 1.6));
    const step = (width - 40) / sortedDates.length;

    sortedDates.forEach((date, i) => {
      const count = dateMap[date];
      const barH = (count / maxCount) * chartHeight;
      const x = 30 + i * step + (step - barWidth) / 2;
      const y = height - bottomPadding - barH;

      // Bar
      ctx.fillStyle = '#2e7d52';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Count above bar
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${count}`, x + barWidth / 2, y - 6);

      // Date label below
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px Inter, sans-serif';
      const shortDate = date.substring(5); // MM-DD
      ctx.fillText(shortDate, x + barWidth / 2, height - 10);
    });
  }

  if (refreshBtn) refreshBtn.addEventListener('click', loadDashboardData);
  loadDashboardData();
});
