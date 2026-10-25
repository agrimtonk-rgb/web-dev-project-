# Urja Setu — Bridging Power, Empowering Villages

A community-focused web platform designed for rural communities to report electricity outages, track their duration and impact, analyze power trends through dynamic visual charts, and generate exportable reports for stakeholders.

---

## 1. Project Introduction

**Urja Setu** ("Energy Bridge") is an academic and community prototype that addresses one of the most critical challenges facing rural India: **frequent, unpredictable, and unrecorded electricity power outages**.

In many villages, power cuts disrupt irrigation pumps, shut down school computer labs, paralyze small clinics, and impact rural businesses. However, because these cuts are rarely documented with exact dates and durations, residents often lack structured evidence when requesting feeder maintenance or infrastructure upgrades.

Urja Setu provides a simple, accessible website where villagers and local leaders can log power outages, view live calculated statistics on an interactive dashboard, filter historical records, and export reports as CSV or printable summaries.

---

## 2. Features

- **Responsive Navigation**: Clear navigation across all pages (Home, About, Objectives, Report Outage, Dashboard, Reports, Team, References).
- **Client & Server-Side Form Validation**: Real-time feedback, required field checks, 10-digit mobile number validation, and future date prevention.
- **Overnight Outage Support**: Intelligently handles power cuts crossing midnight (e.g., 11:30 PM to 1:30 AM is calculated accurately as 2 hours / 120 minutes).
- **Optional Photo/Evidence Upload**: Allows users to attach image proof (JPEG, PNG, WEBP, GIF up to 5MB) stored safely in the local `uploads/` directory.
- **Local JSON Data Persistence**: All submissions are stored in `data/reports.json` with unique URJA IDs and ISO timestamps. Reports remain intact across page refreshes and server restarts.
- **Dynamic Analytics Dashboard**:
  - 6 real-time summary cards: Total Outages, Total Recorded Outage Hours, Average Outage Duration, High-Priority Reports, Active Reported Outages, and Resolved Outages.
  - 3 lightweight HTML5 Canvas charts built with Vanilla JavaScript (no external charting dependencies):
    1. Outages by Impact Category (Horizontal bar chart)
    2. Reports by Priority (Doughnut chart with percentage breakdown)
    3. Outage Frequency by Date (Recent timeline bar chart)
  - Recent outages table with one-click **View Details** modal.
- **Reports Management & Filtering**:
  - Live search by Village Name (case-insensitive substring match).
  - Multi-criteria filtering by Impact Category, Priority Level, Status, and Date.
  - Status toggle: Mark as Resolved / Mark as Reported (persists via `PATCH /api/reports/:id/status`).
  - Safe record deletion with confirmation modal dialog (cleans up any associated photo evidence).
- **Exportable Reports**:
  - **Export CSV**: One-click download of a standard `.csv` spreadsheet with proper escaping.
  - **Print / Save as PDF**: Clean print stylesheet formatted for official sharing or academic submission.

---

## 3. Technologies Used

- **Frontend**:
  - **HTML5**: Semantic document structure with accessibility attributes.
  - **CSS3**: Custom design system using the Urja Setu green (`#2e7d52`), gold (`#f5a623`), and warm background (`#faf8f5`) palette. No heavy CSS frameworks.
  - **Vanilla JavaScript**: Modern, readable ES6+ JavaScript (`async/await`, `fetch`, HTML5 Canvas API, DOM manipulation). No React, Angular, or Vue.
- **Backend**:
  - **Node.js**: Asynchronous JavaScript runtime.
  - **Express.js**: Lightweight HTTP server providing static file hosting and RESTful API endpoints.
  - **Multer**: Middleware for handling optional image evidence uploads.
- **Data Storage**:
  - **Local JSON File (`data/reports.json`)**: Thread-safe atomic file writing with automatic recovery. No external database installations (MongoDB, MySQL, Firebase) required.

---

## 4. Project Folder Structure

```text
web-dev-project--main/
│
├── index.html           # Homepage introducing the project & 4-step workflow
├── about.html           # Project background, purpose, and prototype scope
├── objectives.html      # 6 key objectives of Urja Setu
├── report.html          # Outage reporting form with validation
├── dashboard.html       # Analytics dashboard with canvas charts & recent table
├── reports.html         # Full report database with search, filters, & exports
├── team.html            # Team members, responsibilities, and roles
├── references.html      # Academic publications, government links, & sources
├── style.css            # Unified responsive stylesheet
│
├── server.js            # Express backend server and REST API endpoints
├── package.json         # Project metadata and dependencies
│
├── js/
│   ├── report.js        # Form validation, live duration calculation, & submission
│   ├── dashboard.js     # Dashboard data fetching, stats, charts, & details modal
│   └── reports.js       # Reports table rendering, filtering, status toggle, & CSV export
│
├── data/
│   └── reports.json     # Persistent JSON storage for all outage records
│
├── uploads/
│   └── .gitkeep         # Storage folder for uploaded photo evidence
│
└── assets/
    └── hero-bg.jpg      # Background image for the homepage hero section
```

---

## 5. How the Website Works

Urja Setu follows a straightforward 4-step architecture:

1. **Step 1 — Submit Report**: A user visits `report.html` and enters their village name, outage date, start and end times, affected sector (farming, education, healthcare, household, business), and priority.
2. **Step 2 — Validate & Save**: The browser checks the inputs and sends the form to the Express server (`POST /api/reports`). The server validates the payload, calculates the outage duration (handling overnight cuts), generates a unique ID (e.g. `URJA-MVO...`), and saves the report into `data/reports.json`.
3. **Step 3 — Dynamic Analytics**: The Dashboard (`dashboard.html`) fetches all saved records from `GET /api/reports` and calculates total lost hours, average outage duration, and renders visual sector charts.
4. **Step 4 — Analyze & Export**: The Reports page (`reports.html`) displays the complete dataset with live search, filtering, status tracking (Reported ↔ Resolved), CSV download, and printable summaries.

---

## 6. How to Install Node.js

To run Urja Setu locally, ensure Node.js (version 16 or newer) is installed on your computer:

1. Visit the official Node.js website: [https://nodejs.org](https://nodejs.org).
2. Download the **LTS (Long Term Support)** installer for your operating system (Windows, macOS, or Linux).
3. Run the installer and follow the on-screen prompts (accept default settings).
4. Verify the installation by opening your terminal or Command Prompt and running:
   ```bash
   node -v
   npm -v
   ```

---

## 7. How to Install Project Dependencies

1. Open your terminal or Command Prompt.
2. Navigate to the project root directory:
   ```bash
   cd "path/to/web-dev-project--main"
   ```
3. Install the dependencies listed in `package.json` (`express` and `multer`):
   ```bash
   npm install
   ```

---

## 8. How to Run the Website

Start the Express backend server by running:

```bash
npm start
```

You will see terminal output confirming that the server is active:

```text
====================================================
⚡ Urja Setu Server is running!
🌐 Local Website URL: http://localhost:3000
📁 Reports JSON storage: .../data/reports.json
====================================================
```

---

## 9. How to Open the Website in a Browser

Open your web browser (Chrome, Edge, Firefox, or Safari) and visit:

```text
http://localhost:3000
```

> **Important**: Always access the site through `http://localhost:3000`. Do **not** double-click `index.html` as a `file:///` path, because browser security policies prevent `file:///` pages from communicating with local backend APIs (`/api/reports`).

---

## 10. How Form Submission Works

1. **Input Validation**:
   - **Village Name**: Mandatory, trimmed, max 100 characters.
   - **Contact Number**: Optional; if supplied, must be exactly 10 digits (`^\d{10}$`).
   - **Outage Date**: Mandatory; restricted to dates today or in the past (future dates are blocked).
   - **Timings**: Start time and end time in `HH:MM` format.
   - **Impact Category**: Must select from `farming`, `education`, `healthcare`, `household`, or `business`.
   - **Priority**: Must choose `low`, `medium`, or `high`.
2. **Duration Computation**:
   - Normal outage (e.g. 10:00 AM to 12:00 PM): `(12*60 + 0) - (10*60 + 0) = 120 minutes`.
   - Overnight outage (e.g. 11:30 PM to 1:30 AM): `(1440 - (23*60 + 30)) + (1*60 + 30) = 30 + 90 = 120 minutes`.
3. **Submission State**:
   - The submit button is disabled during the HTTP request to prevent accidental double-clicks.
   - On success (HTTP 201), an alert banner displays the new Report ID and links to the Dashboard and Reports pages. The form resets only after confirmed server saving.

---

## 11. How JSON File Storage Works

Reports are saved in `data/reports.json` as a standard JSON array.

### Report Data Structure Example
```json
{
  "id": "URJA-MVO39ED8-9AG9",
  "villageName": "Sundarpur",
  "contactNumber": "9123456789",
  "outageDate": "2026-10-25",
  "startTime": "09:00",
  "endTime": "11:30",
  "durationMinutes": 150,
  "impactType": "farming",
  "priority": "high",
  "description": "Power outage disrupted tube wells and irrigation pumps during watering hours.",
  "evidenceFile": null,
  "status": "Reported",
  "createdAt": "2026-10-25T17:15:28.124Z"
}
```

### Safety & Concurrency
- `server.js` uses an asynchronous write queue and atomic file swapping (writing to `reports.tmp.<timestamp>.json` and renaming to `reports.json`).
- If `data/` or `data/reports.json` does not exist on startup, the server creates them automatically.

---

## 12. How the Dashboard Calculates Statistics

When `dashboard.html` loads, `js/dashboard.js` issues a `GET /api/reports` request and dynamically calculates:

1. **Total Outages**: Total number of elements in the reports array.
2. **Total Outage Hours**: Sum of all `durationMinutes` divided by 60, formatted to one decimal place (e.g., `4.5 hrs`).
3. **Average Outage Duration**: Sum of minutes divided by the count of reports, converted into readable hours and minutes (e.g., `2 hrs 30 mins`).
4. **High Priority Reports**: Count of records where `priority === 'high'`.
5. **Reported (Active)**: Count of records where `status === 'Reported'`.
6. **Resolved**: Count of records where `status === 'Resolved'`.

If no reports exist, the dashboard presents a clean empty state with a call-to-action button to submit the first report.

---

## 13. How Search and Filtering Work

On `reports.html`, `js/reports.js` provides client-side multi-filter capabilities:

- **Search Village**: Case-insensitive substring matching on village names as you type.
- **Impact Category**: Filters by Farming, Education, Healthcare, Household, or Business.
- **Priority**: Filters by Low, Medium, or High.
- **Status**: Filters by Reported (Active) or Resolved.
- **Date**: Matches reports on a specific date.
- **Reset Filters**: Restores all filter inputs to default and redisplays all records.
- **Match Indicator**: Displays live feedback (e.g., `Showing 2 of 3 reports`).

---

## 14. How to Download Reports

1. **CSV Spreadsheet Export**:
   - Click the **"Export CSV"** button on the Reports page.
   - The system generates a formatted `.csv` file (`urja-setu-outage-reports-YYYY-MM-DD.csv`).
   - Fields containing commas or quotation marks are properly escaped.
2. **Print / Save as PDF**:
   - Click the **"Print / Save PDF"** button on the Reports page.
   - The browser opens its native print dialog.
   - The custom `@media print` CSS automatically hides navigation bars, filter inputs, and action buttons, producing a clean, professional paper or PDF summary report.

---

## 15. How to Test the Website

To verify the complete system functionality:

1. **Automated Test Suite**:
   Run the test script from your terminal:
   ```bash
   node scratch/test-suite.js
   ```
   This validates empty states, input validation, duration calculation (normal and overnight), API routes (`GET`, `POST`, `PATCH`, `DELETE`), and disk persistence.

2. **Manual Browser Workflow**:
   - Open `http://localhost:3000`.
   - Click **Start Reporting Outages**.
   - Submit an outage for village "Sundarpur", timings 09:00 to 11:30 (duration preview shows 2 hrs 30 mins).
   - Check the **Dashboard** (`/dashboard.html`) to verify that the charts and summary numbers updated.
   - Open **Reports** (`/reports.html`), search for "Sundarpur", click **Mark Resolved**, and observe the status badge change to green.
   - Click **Export CSV** to verify that a spreadsheet downloads to your computer.

---

## 16. Known Limitations

- **Prototype Demonstration Scope**: This project is built as an educational demonstration. It is not coupled to state electricity distribution companies (DISCOMs) or live power grid telemetry.
- **No Emergency Dispatch**: Submitting a report does not dispatch electrical line workers or repair squads. Downed wires and electrical emergencies should be reported directly to local emergency helplines.
- **Authentication**: To keep the application beginner-friendly for college demonstration, the REST API does not require login tokens or user authentication. It is intended for local deployment and presentation.
- **Local JSON Storage**: Using a local JSON file is straightforward, portable, and transparent for academic presentations. For large enterprise production systems with thousands of simultaneous writes, a database like PostgreSQL or SQLite with connection pooling would typically be used.
