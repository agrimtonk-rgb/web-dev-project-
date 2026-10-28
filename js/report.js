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
  outageDateInput.setAttribute('max', today);

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

  startTimeInput.addEventListener('change', updateDurationPreview);
  endTimeInput.addEventListener('change', updateDurationPreview);

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
    alertContainer.innerHTML = `<div class="alert alert-${type}">${htmlContent}</div>`;
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Form submit handler
   */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertContainer.innerHTML = '';

    let isValid = true;
    let firstInvalid = null;

    // 1. Village name
    const village = villageNameInput.value.trim();
    if (!village) {
      showError(villageNameInput, 'villageNameError', 'Village name is required.');
      isValid = false;
      firstInvalid = firstInvalid || villageNameInput;
    } else {
      clearError(villageNameInput, 'villageNameError');
    }

    // 2. Contact number (optional; if given, exactly 10 digits)
    const contact = contactNumberInput.value.trim();
    if (contact && !/^\d{10}$/.test(contact)) {
      showError(contactNumberInput, 'contactNumberError', 'Contact number must be exactly 10 digits.');
      isValid = false;
      firstInvalid = firstInvalid || contactNumberInput;
    } else {
      clearError(contactNumberInput, 'contactNumberError');
    }

    // 3. Outage date (cannot be in the future)
    const date = outageDateInput.value;
    if (!date) {
      showError(outageDateInput, 'outageDateError', 'Please select the date.');
      isValid = false;
      firstInvalid = firstInvalid || outageDateInput;
    } else if (date > today) {
      showError(outageDateInput, 'outageDateError', 'Outage date cannot be in the future.');
      isValid = false;
      firstInvalid = firstInvalid || outageDateInput;
    } else {
      clearError(outageDateInput, 'outageDateError');
    }

    // 4. Start & End times
    if (!startTimeInput.value) {
      showError(startTimeInput, 'startTimeError', 'Start time is required.');
      isValid = false;
      firstInvalid = firstInvalid || startTimeInput;
    }
    if (!endTimeInput.value) {
      showError(endTimeInput, 'endTimeError', 'End time is required.');
      isValid = false;
      firstInvalid = firstInvalid || endTimeInput;
    }
    if (startTimeInput.value && endTimeInput.value && startTimeInput.value === endTimeInput.value) {
      showError(endTimeInput, 'endTimeError', 'Start time and end time cannot be identical.');
      isValid = false;
      firstInvalid = firstInvalid || endTimeInput;
    }

    // 5. Impact Category
    if (!impactTypeSelect.value) {
      showError(impactTypeSelect, 'impactTypeError', 'Please select an impact category.');
      isValid = false;
      firstInvalid = firstInvalid || impactTypeSelect;
    } else {
      clearError(impactTypeSelect, 'impactTypeError');
    }

    // 6. Photo upload validation (optional)
    if (evidenceInput.files && evidenceInput.files.length > 0) {
      const file = evidenceInput.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        showError(evidenceInput, 'evidenceError', 'Only images (JPEG, PNG, WEBP, GIF) are allowed.');
        isValid = false;
        firstInvalid = firstInvalid || evidenceInput;
      } else if (file.size > 5 * 1024 * 1024) {
        showError(evidenceInput, 'evidenceError', 'Image must be under 5MB.');
        isValid = false;
        firstInvalid = firstInvalid || evidenceInput;
      }
    }

    // Stop and focus the first invalid field if any validation failed
    if (!isValid) {
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Disable submit button while sending to prevent double submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting Outage Report...';

    try {
      const formData = new FormData(form);
      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        const saved = result.report;
        const readableDuration = formatDuration(saved.durationMinutes);

        showAlert('success', `
          <div>
            <h4 style="margin-bottom: 4px; font-size: 16px;">✅ Outage Report Submitted Successfully!</h4>
            <p style="margin-bottom: 8px;">
              Report ID: <strong>${saved.id}</strong> for <strong>${saved.villageName}</strong> 
              (${readableDuration}). Saved to the database.
            </p>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
              <a href="dashboard.html" class="btn-green btn-sm" style="color: #fff;">View on Dashboard</a>
              <a href="reports.html" class="btn-outline btn-sm">View in Reports Table</a>
            </div>
          </div>
        `);

        // Reset form fields after server confirmed save
        form.reset();
        durationPreview.style.display = 'none';
        const medRadio = form.querySelector('input[value="medium"]');
        if (medRadio) medRadio.checked = true;
      } else {
        showAlert('error', `<strong>Error:</strong> ${result.error || 'Could not submit report.'}`);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      showAlert('error', '<strong>Network Error:</strong> Cannot connect to server at <code>http://localhost:3000</code>.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Outage Report';
    }
  });
});
