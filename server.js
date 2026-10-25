/**
 * ============================================================================
 * URJA SETU — BACKEND SERVER (server.js)
 * ============================================================================
 * An Express.js backend for rural electricity outage reporting and analytics.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Storage paths
const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Ensure data folder and reports JSON file exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(REPORTS_FILE)) fs.writeFileSync(REPORTS_FILE, '[]', 'utf8');

// Body parser middleware for JSON and URL-encoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets (HTML, CSS, JS)
app.use(express.static(__dirname));

/**
 * Reads all outage reports from data/reports.json
 */
function readReports() {
  try {
    const rawData = fs.readFileSync(REPORTS_FILE, 'utf8').trim();
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error('Error reading reports.json:', error.message);
    return [];
  }
}

/**
 * Saves all outage reports to data/reports.json
 */
function writeReports(reports) {
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving reports.json:', error.message);
    return false;
  }
}

/**
 * Calculates outage duration in minutes.
 * Handles overnight outages crossing midnight (e.g., 23:30 to 01:30 = 120 mins).
 */
function calculateOutageDuration(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  let duration = endMinutes - startMinutes;

  // If end time is earlier than start time, the outage continued past midnight
  if (duration < 0) {
    duration += 24 * 60; // Add 1440 minutes (24 hours)
  }

  return duration;
}

/**
 * Validates report fields. Returns an error message string or null if valid.
 */
function validateReportData(data) {
  const { villageName, contactNumber, outageDate, startTime, endTime, impactType, priority } = data;

  if (!villageName || !villageName.trim()) {
    return 'Village name is required and cannot be empty.';
  }
  if (villageName.trim().length > 100) {
    return 'Village name cannot exceed 100 characters.';
  }

  // Contact number is optional, but if entered must be 10 digits
  if (contactNumber && contactNumber.trim()) {
    if (!/^\d{10}$/.test(contactNumber.trim())) {
      return 'Contact number must be exactly 10 digits.';
    }
  }

  if (!outageDate) {
    return 'Outage date is required.';
  }

  // Prevent future dates
  const today = new Date().toISOString().split('T')[0];
  if (outageDate > today) {
    return 'Outage date cannot be in the future.';
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!startTime || !timeRegex.test(startTime)) {
    return 'Start time must be in HH:MM format.';
  }
  if (!endTime || !timeRegex.test(endTime)) {
    return 'End time must be in HH:MM format.';
  }
  if (startTime === endTime) {
    return 'Start time and end time cannot be identical.';
  }

  const allowedImpacts = ['farming', 'education', 'healthcare', 'household', 'business'];
  if (!allowedImpacts.includes(impactType)) {
    return 'Please select a valid impact category.';
  }

  const allowedPriorities = ['low', 'medium', 'high'];
  if (!allowedPriorities.includes(priority)) {
    return 'Please select a valid priority (low, medium, high).';
  }

  return null;
}

// GET /api/reports — Retrieve all reports
app.get('/api/reports', (req, res) => {
  const reports = readReports();
  res.json(reports);
});

// GET /api/reports/:id — Retrieve a single report by ID
app.get('/api/reports/:id', (req, res) => {
  const reports = readReports();
  const report = reports.find(r => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Outage report not found.' });
  }
  res.json(report);
});

// Server listener
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ Urja Setu Server running at http://localhost:${PORT}`);
  console.log(`📁 Reports JSON Storage: ${REPORTS_FILE}`);
  console.log(`====================================================`);
});
