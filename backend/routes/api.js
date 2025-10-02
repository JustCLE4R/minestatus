const express = require('express');
const router = express.Router();
const playerSessionController = require('../controllers/playerSessionController');

// Session routes
router.get('/sessions', playerSessionController.getAllSessions);
router.get('/sessions/active', playerSessionController.getActiveSessions);
router.get('/sessions/stats', playerSessionController.getSessionStats);
router.get('/sessions/player/:playerName', playerSessionController.getPlayerHistory);

// Session analytics routes
router.get('/sessions/analytics/daily', playerSessionController.getDailyAnalytics);
router.get('/sessions/analytics/hourly', playerSessionController.getHourlyAnalytics);
router.get('/sessions/analytics/duration', playerSessionController.getDurationAnalytics);
router.get('/sessions/analytics/top-players', playerSessionController.getTopPlayersAnalytics);

// Test data generation (for development only)
router.post('/sessions/generate-test-data', playerSessionController.generateTestData);

// Manual session control (for testing/admin)
// router.post('/sessions/start', playerSessionController.startSession);
// router.post('/sessions/end', playerSessionController.endSession);

module.exports = router;