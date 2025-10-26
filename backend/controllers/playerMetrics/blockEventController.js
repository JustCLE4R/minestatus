const { PlayerBlockStats } = require('../../models');
const jsend = require('../../services/jsendService');
const logger = require('../../utils/logger');
const { Op } = require('sequelize');

const log = logger.createLogger('PLAYER-METRICS-BLOCK');

class BlockEventController {
  
  /**
   * Get block statistics for all players
   * GET /api/player-metrics/blocks
   */
  async getAllBlockStats(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        actionType, 
        blockType, 
        playerName,
        sortBy = 'count',
        sortOrder = 'DESC'
      } = req.query;

      // Build where clause based on filters
      const whereClause = {};
      if (actionType) whereClause.actionType = actionType;
      if (blockType) whereClause.blockType = { [Op.like]: `%${blockType}%` };
      if (playerName) whereClause.playerName = { [Op.like]: `%${playerName}%` };

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Fetch data
      const { count, rows } = await PlayerBlockStats.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset
      });

      // Calculate pagination info
      const totalPages = Math.ceil(count / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      const response = {
        data: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        },
        filters: {
          actionType,
          blockType,
          playerName,
          sortBy,
          sortOrder
        }
      };

      log.info(`Retrieved ${rows.length} block stats records (page ${page}/${totalPages})`);
      return jsend.success(res, response);

    } catch (error) {
      log.error('Failed to get block stats:', error);
      return jsend.error(res, 'Failed to retrieve block statistics');
    }
  }

  /**
   * Get block statistics for a specific player
   * GET /api/player-metrics/blocks/player/:playerName
   */
  async getPlayerBlockStats(req, res) {
    try {
      const { playerName } = req.params;
      const { actionType, blockType, sortBy = 'count', sortOrder = 'DESC' } = req.query;

      // Build where clause
      const whereClause = { playerName };
      if (actionType) whereClause.actionType = actionType;
      if (blockType) whereClause.blockType = { [Op.like]: `%${blockType}%` };

      const stats = await PlayerBlockStats.findAll({
        where: whereClause,
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      // Calculate totals
      const totalBreaks = stats
        .filter(s => s.actionType === 'break')
        .reduce((sum, s) => sum + parseInt(s.count), 0);
      
      const totalPlaces = stats
        .filter(s => s.actionType === 'place')
        .reduce((sum, s) => sum + parseInt(s.count), 0);

      const response = {
        playerName,
        stats,
        summary: {
          totalBreaks,
          totalPlaces,
          totalBlocks: totalBreaks + totalPlaces,
          uniqueBlockTypes: [...new Set(stats.map(s => s.blockType))].length
        }
      };

      log.info(`Retrieved block stats for player: ${playerName} (${stats.length} records)`);
      return jsend.success(res, response);

    } catch (error) {
      log.error(`Failed to get player block stats for ${req.params.playerName}:`, error);
      return jsend.error(res, 'Failed to retrieve player block statistics');
    }
  }

  /**
   * Get leaderboard for a specific block type and action
   * GET /api/player-metrics/blocks/leaderboard
   */
  async getBlockLeaderboard(req, res) {
    try {
      const { 
        blockType, 
        actionType = 'break', 
        limit = 10 
      } = req.query;

      if (!blockType) {
        return jsend.fail(res, { blockType: 'Block type is required' });
      }

      const leaderboard = await PlayerBlockStats.findAll({
        where: {
          blockType: { [Op.like]: `%${blockType}%` },
          actionType
        },
        order: [['count', 'DESC']],
        limit: parseInt(limit)
      });

      const response = {
        blockType,
        actionType,
        leaderboard,
        totalPlayers: leaderboard.length
      };

      log.info(`Retrieved ${actionType} leaderboard for ${blockType} (${leaderboard.length} players)`);
      return jsend.success(res, response);

    } catch (error) {
      log.error('Failed to get block leaderboard:', error);
      return jsend.error(res, 'Failed to retrieve block leaderboard');
    }
  }

  /**
   * Get top block types (most broken/placed across all players)
   * GET /api/player-metrics/blocks/top-blocks
   */
  async getTopBlocks(req, res) {
    try {
      const { actionType = 'break', limit = 10 } = req.query;

      // Use raw query to group by block type and sum counts
      const results = await PlayerBlockStats.sequelize.query(`
        SELECT 
          block_type as blockType,
          SUM(count) as totalCount,
          COUNT(DISTINCT player_name) as playerCount
        FROM player_block_stats 
        WHERE action_type = :actionType 
        GROUP BY block_type 
        ORDER BY totalCount DESC 
        LIMIT :limit
      `, {
        replacements: { actionType, limit: parseInt(limit) },
        type: PlayerBlockStats.sequelize.QueryTypes.SELECT
      });

      const response = {
        actionType,
        topBlocks: results,
        totalBlockTypes: results.length
      };

      log.info(`Retrieved top ${actionType} blocks (${results.length} block types)`);
      return jsend.success(res, response);

    } catch (error) {
      log.error('Failed to get top blocks:', error);
      return jsend.error(res, 'Failed to retrieve top blocks');
    }
  }

  /**
   * Get overall statistics summary
   * GET /api/player-metrics/blocks/summary
   */
  async getBlockStatsSummary(req, res) {
    try {
      // Get total counts by action type
      const [breakStats] = await PlayerBlockStats.sequelize.query(`
        SELECT 
          SUM(count) as totalBlocks,
          COUNT(DISTINCT player_name) as totalPlayers,
          COUNT(DISTINCT block_type) as totalBlockTypes
        FROM player_block_stats 
        WHERE action_type = 'break'
      `, {
        type: PlayerBlockStats.sequelize.QueryTypes.SELECT
      });

      const [placeStats] = await PlayerBlockStats.sequelize.query(`
        SELECT 
          SUM(count) as totalBlocks,
          COUNT(DISTINCT player_name) as totalPlayers,
          COUNT(DISTINCT block_type) as totalBlockTypes
        FROM player_block_stats 
        WHERE action_type = 'place'
      `, {
        type: PlayerBlockStats.sequelize.QueryTypes.SELECT
      });

      // Get top player overall
      const [topPlayer] = await PlayerBlockStats.sequelize.query(`
        SELECT 
          player_name as playerName,
          SUM(count) as totalBlocks
        FROM player_block_stats 
        GROUP BY player_name 
        ORDER BY totalBlocks DESC 
        LIMIT 1
      `, {
        type: PlayerBlockStats.sequelize.QueryTypes.SELECT
      });

      const response = {
        breaks: {
          totalBlocks: parseInt(breakStats?.totalBlocks || 0),
          totalPlayers: parseInt(breakStats?.totalPlayers || 0),
          totalBlockTypes: parseInt(breakStats?.totalBlockTypes || 0)
        },
        places: {
          totalBlocks: parseInt(placeStats?.totalBlocks || 0),
          totalPlayers: parseInt(placeStats?.totalPlayers || 0),
          totalBlockTypes: parseInt(placeStats?.totalBlockTypes || 0)
        },
        overall: {
          totalBlocks: parseInt(breakStats?.totalBlocks || 0) + parseInt(placeStats?.totalBlocks || 0),
          topPlayer: topPlayer || null
        }
      };

      log.info('Retrieved block statistics summary');
      return jsend.success(res, response);

    } catch (error) {
      log.error('Failed to get block stats summary:', error);
      return jsend.error(res, 'Failed to retrieve block statistics summary');
    }
  }

}

module.exports = new BlockEventController();