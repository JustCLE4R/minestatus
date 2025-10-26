const express = require('express');
const router = express.Router();
const SessionsRouter = require('./sessions');
const blockEventRoutes = require('./playerMetrics/blockEvent');
const cmsRoutes = require('./cms');

// Session routes
router.use('/sessions', SessionsRouter);

// CMS routes
router.use('/cms', cmsRoutes);

// Player metrics routes
router.use('/player-metrics/blocks', blockEventRoutes);


module.exports = router;