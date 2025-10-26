const express = require('express');
const router = express.Router();
const playerSessionController = require('../controllers/playerSessionController');

// Session routes
router.get('/', playerSessionController.getAllSessions);
router.get('/active', playerSessionController.getActiveSessions);
router.get('/stats', playerSessionController.getSessionStats);
router.get('/player/:playerName', playerSessionController.getPlayerHistory);

// Session analytics routes
router.get('/analytics/daily', playerSessionController.getDailyAnalytics);
router.get('/analytics/hourly', playerSessionController.getHourlyAnalytics);
router.get('/analytics/duration', playerSessionController.getDurationAnalytics);
router.get('/analytics/top-players', playerSessionController.getTopPlayersAnalytics);

// Test data generation (for development only)
// router.post('/generate-test-data', playerSessionController.generateTestData);

// Manual session control (for testing/admin)
// router.post('/start', playerSessionController.startSession);
// router.post('/end', playerSessionController.endSession);

module.exports = router;