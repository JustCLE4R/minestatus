const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');

// Buildings routes
router.get('/buildings', cmsController.getAllBuildings);
router.get('/buildings/:slug', cmsController.getBuildingBySlug);
router.get('/buildings/:slug/images/:imageName', cmsController.getBuildingImage);

// Metadata routes
router.get('/categories', cmsController.getCategories);
router.get('/builders', cmsController.getBuilders);

// Utility routes
router.get('/stats', cmsController.getStats);
router.get('/cache/stats', cmsController.getCacheStats);
router.post('/cache/clear', cmsController.clearCache);

module.exports = router;