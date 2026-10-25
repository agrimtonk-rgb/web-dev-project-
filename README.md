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
