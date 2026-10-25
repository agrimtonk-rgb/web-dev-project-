/**
 * ============================================================================
 * URJA SETU — REPORT FORM LOGIC (js/report.js)
 * ============================================================================
 * Handles browser-side validation, live outage duration calculation,
 * and asynchronous form submission to the Express backend.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('outageForm');
  const submitBtn = document.getElementById('submitBtn');
  const alertContainer = document.getElementById('alertContainer');

  // Form input elements
  const villageNameInput = document.getElementById('villageName');
  const contactNumberInput = document.getElementById('contactNumber');
  const outageDateInput = document.getElementById('outageDate');
  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');
  const impactTypeSelect = document.getElementById('impactType');
  const evidenceInput = document.getElementById('evidence');
  const durationPreview = document.getElementById('durationPreview');
  const durationText = document.getElementById('durationText');

  // Prevent users from picking future dates in the datepicker
  const today = new Date().toISOString().split('T')[0];
  if (outageDateInput) {
    outageDateInput.setAttribute('max', today);
  }

  /**
   * Displays an alert banner inside the page
   */
  function showAlert(type, htmlContent) {
    if (!alertContainer) return;
    alertContainer.innerHTML = `<div class="alert alert-${type}">${htmlContent}</div>`;
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
