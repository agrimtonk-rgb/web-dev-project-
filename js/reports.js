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

  // Filter Elements
  const searchVillage = document.getElementById('searchVillage');
  const filterImpact = document.getElementById('filterImpact');
  const filterPriority = document.getElementById('filterPriority');
  const filterStatus = document.getElementById('filterStatus');
  const filterDate = document.getElementById('filterDate');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const clearFiltersPromptBtn = document.getElementById('clearFiltersPromptBtn');
  const resultsCountText = document.getElementById('resultsCountText');

  // Containers
  const reportsTableContainer = document.getElementById('reportsTableContainer');
  const reportsTableBody = document.getElementById('reportsTableBody');
  const noReportsInDbState = document.getElementById('noReportsInDbState');
  const noFilterMatchState = document.getElementById('noFilterMatchState');

  // Details Modal Elements
  const reportDetailsModal = document.getElementById('reportDetailsModal');
  const repModalCloseBtn = document.getElementById('repModalCloseBtn');
  const repModalCloseFooterBtn = document.getElementById('repModalCloseFooterBtn');
  const repModalBody = document.getElementById('repModalBody');

  // Delete Modal Elements
  const deleteModal = document.getElementById('deleteModal');
  const delModalCloseBtn = document.getElementById('delModalCloseBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteTargetId = document.getElementById('deleteTargetId');
  const deleteTargetVillage = document.getElementById('deleteTargetVillage');

  let allReports = [];
  let currentFiltered = [];
  let pendingDeleteId = null;

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
      resultsCountText.textContent = 'Loading records...';
      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Failed to retrieve reports');

      allReports = await response.json();
      applyFilters();
    } catch (err) {
      console.error('Fetch error:', err);
      showAlert('error', '⚠️ Could not load reports. Make sure the server is running at <code>http://localhost:3000</code>.');
      resultsCountText.textContent = 'Error connecting to database';
    }
  }

  /**
   * 2. Apply all search & filter criteria to the report list
   */
  function applyFilters() {
    if (!allReports || allReports.length === 0) {
      updateSummaries([]);
      reportsTableContainer.style.display = 'none';
      noFilterMatchState.style.display = 'none';
      noReportsInDbState.style.display = 'block';
      resultsCountText.textContent = '0 total records';
      return;
    }

    noReportsInDbState.style.display = 'none';

    const villageQuery = searchVillage.value.trim().toLowerCase();
    const impactVal = filterImpact.value;
    const priorityVal = filterPriority.value;
    const statusVal = filterStatus.value;
    const dateVal = filterDate.value;

    currentFiltered = allReports.filter(r => {
      if (villageQuery && !r.villageName.toLowerCase().includes(villageQuery)) return false;
      if (impactVal !== 'all' && r.impactType !== impactVal) return false;
      if (priorityVal !== 'all' && r.priority !== priorityVal) return false;
      if (statusVal !== 'all' && r.status !== statusVal) return false;
      if (dateVal && r.outageDate !== dateVal) return false;
      return true;
    });

    updateSummaries(currentFiltered);
    renderTable(currentFiltered);
  }

  /**
   * 3. Update summary stat cards
   */
  function updateSummaries(reports) {
    if (reports.length === 0) {
      repStatTotal.textContent = '0';
      repStatTotalHours.textContent = '0 hrs';
      repStatAvg.textContent = '--';
      repStatHigh.textContent = '0';
      repStatReported.textContent = '0';
      repStatResolved.textContent = '0';
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

    repStatTotal.textContent = reports.length;
    repStatTotalHours.textContent = `${(totalMinutes / 60).toFixed(1)} hrs`;
    repStatAvg.textContent = formatMinutes(Math.round(totalMinutes / reports.length));
    repStatHigh.textContent = highCount;
    repStatReported.textContent = reportedCount;
    repStatResolved.textContent = resolvedCount;
  }

  /**
   * 4. Render reports into the HTML table
   */
  function renderTable(reports) {
    reportsTableBody.innerHTML = '';

    if (reports.length === 0) {
      reportsTableContainer.style.display = 'none';
      noFilterMatchState.style.display = 'block';
      resultsCountText.textContent = `Showing 0 of ${allReports.length} reports`;
      return;
    }

    noFilterMatchState.style.display = 'none';
    reportsTableContainer.style.display = 'block';
    resultsCountText.textContent = `Showing ${reports.length} of ${allReports.length} reports`;

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

    // Attach button listeners
    reportsTableBody.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => openDetailsModal(btn.getAttribute('data-id')));
    });

    reportsTableBody.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const curr = btn.getAttribute('data-status');
        const next = curr === 'Resolved' ? 'Reported' : 'Resolved';
        updateStatus(id, next);
      });
    });

    reportsTableBody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openDeleteModal(btn.getAttribute('data-id'), btn.getAttribute('data-village'));
      });
    });
  }

  /**
   * 5. Toggle Status between Reported and Resolved (PATCH)
   */
  async function updateStatus(id, newStatus) {
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showAlert('success', `Status updated to <strong>${newStatus}</strong>.`);
        const rep = allReports.find(r => r.id === id);
        if (rep) rep.status = newStatus;
        applyFilters();
      } else {
        showAlert('error', 'Failed to update status.');
      }
    } catch (err) {
      console.error('Status update error:', err);
      showAlert('error', 'Network error updating report status.');
    }
  }

  /**
   * 6. Delete a report with modal confirmation (DELETE)
   */
  function openDeleteModal(id, village) {
    pendingDeleteId = id;
    deleteTargetId.textContent = id;
    deleteTargetVillage.textContent = village;
    deleteModal.classList.add('open');
  }

  function closeDeleteModal() {
    pendingDeleteId = null;
    deleteModal.classList.remove('open');
  }

  delModalCloseBtn.addEventListener('click', closeDeleteModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

  confirmDeleteBtn.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const targetId = pendingDeleteId;

    try {
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = 'Deleting...';

      const res = await fetch(`/api/reports/${encodeURIComponent(targetId)}`, { method: 'DELETE' });
      if (res.ok) {
        showAlert('success', `Outage report <strong>${escapeText(targetId)}</strong> was deleted.`);
        allReports = allReports.filter(r => r.id !== targetId);
        applyFilters();
        closeDeleteModal();
      } else {
        showAlert('error', 'Failed to delete report.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showAlert('error', 'Network error deleting report.');
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Delete Report';
    }
  });

  /**
   * 7. Open Details Modal
   */
  function openDetailsModal(id) {
    const report = allReports.find(r => r.id === id);
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

    repModalBody.innerHTML = `
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

    reportDetailsModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailsModal() {
    reportDetailsModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  repModalCloseBtn.addEventListener('click', closeDetailsModal);
  repModalCloseFooterBtn.addEventListener('click', closeDetailsModal);
  reportDetailsModal.addEventListener('click', e => { if (e.target === reportDetailsModal) closeDetailsModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetailsModal(); });

  /**
   * 8. Export records to a CSV spreadsheet file
   */
  function exportCsv() {
    const list = currentFiltered.length > 0 ? currentFiltered : allReports;
    if (list.length === 0) {
      showAlert('info', 'No reports available to export.');
      return;
    }

    const headers = ['Report ID', 'Village Name', 'Contact', 'Date', 'Start Time', 'End Time', 'Duration (Mins)', 'Impact', 'Priority', 'Status', 'Description', 'Evidence File', 'Created At'];

    // CSV cell escaper (quotes inner quotes)
    const cleanCell = val => `"${String(val || '').replace(/"/g, '""')}"`;

    const rows = [
      headers.map(cleanCell).join(','),
      ...list.map(r => [
        r.id, r.villageName, r.contactNumber || '', r.outageDate, r.startTime, r.endTime,
        r.durationMinutes, r.impactType, r.priority, r.status, r.description || '', r.evidenceFile || '', r.createdAt
      ].map(cleanCell).join(','))
    ];

    const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urja-setu-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert('success', `Exported <strong>${list.length}</strong> reports to CSV.`);
  }

  exportCsvBtn.addEventListener('click', exportCsv);
  printReportBtn.addEventListener('click', () => window.print());

  // Search & Filter event listeners
  [searchVillage, filterImpact, filterPriority, filterStatus, filterDate].forEach(el => {
    el.addEventListener('input', applyFilters);
    el.addEventListener('change', applyFilters);
  });

  function resetFilters() {
    searchVillage.value = '';
    filterImpact.value = 'all';
    filterPriority.value = 'all';
    filterStatus.value = 'all';
    filterDate.value = '';
    applyFilters();
  }

  resetFiltersBtn.addEventListener('click', resetFilters);
  clearFiltersPromptBtn.addEventListener('click', resetFilters);
  refreshReportsBtn.addEventListener('click', fetchReports);

  fetchReports();
});
