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

// Body parser middleware for JSON and URL-encoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets (HTML, CSS, JS)
app.use(express.static(__dirname));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Server listener
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ Urja Setu Server running at http://localhost:${PORT}`);
  console.log(`====================================================`);
});
