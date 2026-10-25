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
   * Calculates outage duration in minutes.
   * Handles overnight outages crossing midnight (e.g., 23:30 to 01:30 = 120 mins).
   */
  function calculateMinutes(startStr, endStr) {
    if (!startStr || !endStr) return 0;
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    let minutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (minutes < 0) {
      minutes += 24 * 60; // Crosses midnight into next day
    }
    return minutes;
  }

  /**
   * Formats duration into a readable string like "2 hrs 30 mins"
   */
  function formatDuration(minutes) {
    if (minutes <= 0) return '0 mins';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${mins} min${mins > 1 ? 's' : ''}`;
  }

  /**
   * Live duration preview when start or end time changes
   */
  function updateDurationPreview() {
    const start = startTimeInput.value;
    const end = endTimeInput.value;

    if (start && end) {
      if (start === end) {
        durationText.textContent = 'Start and end time cannot be identical.';
        durationPreview.style.display = 'block';
        return;
      }
      const minutes = calculateMinutes(start, end);
      const readable = formatDuration(minutes);
      const isOvernight = end < start;
      durationText.textContent = `${readable} (${minutes} minutes total)${isOvernight ? ' — Overnight outage' : ''}`;
      durationPreview.style.display = 'block';
    } else {
      durationPreview.style.display = 'none';
    }
  }

  if (startTimeInput) startTimeInput.addEventListener('change', updateDurationPreview);
  if (endTimeInput) endTimeInput.addEventListener('change', updateDurationPreview);

  /**
   * Validation helpers to show and clear field error states
   */
  function showError(inputEl, errorId, message) {
    if (inputEl) inputEl.classList.add('field-error');
    const errEl = document.getElementById(errorId);
    if (errEl) {
      if (message) errEl.textContent = message;
      errEl.classList.add('visible');
    }
  }

  function clearError(inputEl, errorId) {
    if (inputEl) inputEl.classList.remove('field-error');
    const errEl = document.getElementById(errorId);
    if (errEl) errEl.classList.remove('visible');
  }

  // Clear errors automatically as the user types or updates inputs
  [
    [villageNameInput, 'villageNameError'],
    [contactNumberInput, 'contactNumberError'],
    [outageDateInput, 'outageDateError'],
    [startTimeInput, 'startTimeError'],
    [endTimeInput, 'endTimeError'],
    [impactTypeSelect, 'impactTypeError'],
    [evidenceInput, 'evidenceError']
  ].forEach(([input, errId]) => {
    if (input) {
      input.addEventListener('input', () => clearError(input, errId));
      input.addEventListener('change', () => clearError(input, errId));
    }
  });

  /**
   * Displays an alert banner inside the page
   */
  function showAlert(type, htmlContent) {
    if (!alertContainer) return;
    alertContainer.innerHTML = `<div class="alert alert-${type}">${htmlContent}</div>`;
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
