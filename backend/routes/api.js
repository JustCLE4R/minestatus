const express = require('express');
const router = express.Router();
const playerSessionController = require('../controllers/playerSessionController');
const performanceController = require('../controllers/performanceController');

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

// Performance metrics routes
router.get('/performance/current', performanceController.getCurrentMetrics);
router.get('/performance/history', performanceController.getPerformanceHistory);
router.get('/performance/stats', performanceController.getPerformanceStats);
router.get('/performance/health', performanceController.getServerHealth);
router.get('/performance/summary', performanceController.getPerformanceSummary);
router.post('/performance/refresh', performanceController.refreshPerformanceData);
router.delete('/performance/history', performanceController.clearPerformanceHistory);

// Test data generation (for development only)
router.post('/sessions/generate-test-data', playerSessionController.generateTestData);

// Manual session control (for testing/admin)
// router.post('/sessions/start', playerSessionController.startSession);
// router.post('/sessions/end', playerSessionController.endSession);

module.exports = router;