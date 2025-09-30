const express = require('express');
const router = express.Router();
const playerSessionController = require('../controllers/playerSessionController');

// Session routes
router.get('/sessions', playerSessionController.getAllSessions);
router.get('/sessions/active', playerSessionController.getActiveSessions);
router.get('/sessions/stats', playerSessionController.getSessionStats);
router.get('/sessions/player/:playerName', playerSessionController.getPlayerHistory);

// Manual session control (for testing/admin)
// router.post('/sessions/start', playerSessionController.startSession);
// router.post('/sessions/end', playerSessionController.endSession);

module.exports = router;