/**
 * ============================================================================
 * URJA SETU — BACKEND SERVER (server.js)
 * ============================================================================
 * An Express.js backend for rural electricity outage reporting and analytics.
 * 
 * Workflow:
 * Receive request -> Validate input -> Calculate duration -> Save JSON -> Respond
 */

// ----------------------------------------------------------------------------
// 1. IMPORTS, CONFIGURATION & DIRECTORY SETUP
// ----------------------------------------------------------------------------
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Storage paths
const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure data folder, JSON file, and uploads folder exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(REPORTS_FILE)) fs.writeFileSync(REPORTS_FILE, '[]', 'utf8');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Body parser middleware for JSON and URL-encoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend HTML/CSS/JS and uploaded images
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer for optional photo evidence uploads (Max 5MB images only)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `evidence-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed.'));
    }
  }
});

// ----------------------------------------------------------------------------
// 2. JSON FILE HELPER FUNCTIONS
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// 3. INPUT VALIDATION & DURATION CALCULATION
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// 4. API ROUTES
// ----------------------------------------------------------------------------

/**
 * GET /api/reports — Retrieve all reports
 */
app.get('/api/reports', (req, res) => {
  const reports = readReports();
  res.json(reports);
});

/**
 * GET /api/reports/:id — Retrieve a single report by ID
 */
app.get('/api/reports/:id', (req, res) => {
  const reports = readReports();
  const report = reports.find(r => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Outage report not found.' });
  }
  res.json(report);
});

/**
 * POST /api/reports — Validate and save a new outage report
 */
app.post('/api/reports', (req, res) => {
  upload.single('evidence')(req, res, (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    const { villageName, contactNumber, outageDate, startTime, endTime, impactType, priority, description } = req.body;

    // Validate inputs
    const error = validateReportData({ villageName, contactNumber, outageDate, startTime, endTime, impactType, priority });
    if (error) {
      // If a file was uploaded with invalid form data, delete it
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error });
    }

    // Calculate duration in minutes (handles overnight outages)
    const durationMinutes = calculateOutageDuration(startTime, endTime);

    // Create unique ID e.g., URJA-MVO...
    const uniqueId = `URJA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newReport = {
      id: uniqueId,
      villageName: villageName.trim(),
      contactNumber: contactNumber && contactNumber.trim() ? contactNumber.trim() : null,
      outageDate: outageDate.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      durationMinutes: durationMinutes,
      impactType: impactType.trim(),
      priority: priority.trim(),
      description: description && description.trim() ? description.trim() : '',
      evidenceFile: req.file ? `/uploads/${req.file.filename}` : null,
      status: 'Reported',
      createdAt: new Date().toISOString()
    };

    // Save report to JSON file
    const reports = readReports();
    reports.unshift(newReport); // Add new report to the beginning

    if (!writeReports(reports)) {
      return res.status(500).json({ error: 'Failed to write report to storage.' });
    }

    res.status(201).json({
      message: 'Outage report submitted successfully!',
      report: newReport
    });
  });
});

/**
 * PATCH /api/reports/:id/status — Toggle status between 'Reported' and 'Resolved'
 */
app.patch('/api/reports/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['Reported', 'Resolved'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "Reported" or "Resolved".' });
  }

  const reports = readReports();
  const report = reports.find(r => r.id === req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'Outage report not found.' });
  }

  report.status = status;
  report.updatedAt = new Date().toISOString();

  if (!writeReports(reports)) {
    return res.status(500).json({ error: 'Failed to update report in storage.' });
  }

  res.json({ message: `Report status updated to ${status}.`, report });
});

/**
 * DELETE /api/reports/:id — Delete a report and remove any uploaded evidence image
 */
app.delete('/api/reports/:id', (req, res) => {
  const reports = readReports();
  const index = reports.findIndex(r => r.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Outage report not found.' });
  }

  const deletedReport = reports[index];

  // If there was an uploaded evidence image, remove it from the uploads folder
  if (deletedReport.evidenceFile) {
    const filename = path.basename(deletedReport.evidenceFile);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  }

  // Remove from array and save
  reports.splice(index, 1);
  writeReports(reports);

  res.json({ message: 'Report deleted successfully.', id: req.params.id });
});

// ----------------------------------------------------------------------------
// 5. SERVER STARTUP
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ Urja Setu Server running at http://localhost:${PORT}`);
  console.log(`📁 Reports JSON Storage: ${REPORTS_FILE}`);
  console.log(`====================================================`);
});
