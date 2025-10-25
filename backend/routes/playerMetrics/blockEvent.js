const express = require('express');
const router = express.Router();
const blockEventController = require('../../controllers/playerMetrics/blockEventController');

/**
 * @route   GET /api/player-metrics/blocks
 * @desc    Get paginated block statistics for all players
 * @query   page, limit, actionType, blockType, playerName, sortBy, sortOrder
 * @access  Public
 */
router.get('/', blockEventController.getAllBlockStats);

/**
 * @route   GET /api/player-metrics/blocks/summary
 * @desc    Get overall block statistics summary
 * @access  Public
 */
router.get('/summary', blockEventController.getBlockStatsSummary);

/**
 * @route   GET /api/player-metrics/blocks/leaderboard
 * @desc    Get leaderboard for specific block type and action
 * @query   blockType (required), actionType, limit
 * @access  Public
 */
router.get('/leaderboard', blockEventController.getBlockLeaderboard);

/**
 * @route   GET /api/player-metrics/blocks/top-blocks
 * @desc    Get top block types (most broken/placed)
 * @query   actionType, limit
 * @access  Public
 */
router.get('/top-blocks', blockEventController.getTopBlocks);

/**
 * @route   GET /api/player-metrics/blocks/player/:playerName
 * @desc    Get block statistics for a specific player
 * @param   playerName - Player username
 * @query   actionType, blockType, sortBy, sortOrder
 * @access  Public
 */
router.get('/player/:playerName', blockEventController.getPlayerBlockStats);

module.exports = router;