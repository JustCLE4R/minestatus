const { PlayerSession } = require('../models');
const { Op } = require('sequelize');
const sessionService = require('../services/sessionService');

class PlayerSessionController {
  // GET /api/sessions - Get all sessions with pagination and filters
  async getAllSessions(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        playerName,
        startDate,
        endDate,
        activeOnly
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = {};

      if (playerName) {
        where.playerName = { [Op.like]: `%${playerName}%` };
      }

      if (startDate) {
        where.sessionStart = { [Op.gte]: new Date(startDate) };
      }

      if (endDate) {
        where.sessionStart = { [Op.lte]: new Date(endDate) };
      }

      if (activeOnly === 'true') {
        where.isActive = true;
      }

      const result = await PlayerSession.findAndCountAll({
        where,
        order: [['isActive', 'DESC'], ['sessionEnd', 'DESC'], ['sessionStart', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Add calculated duration to each session
      const sessionsWithDuration = result.rows.map(session => {
        const sessionData = session.toJSON();
        // Calculate duration manually
        if (sessionData.sessionStart && sessionData.sessionEnd) {
          sessionData.duration = Math.floor((new Date(sessionData.sessionEnd) - new Date(sessionData.sessionStart)) / 1000);
        } else {
          sessionData.duration = null;
        }
        return sessionData;
      });

      res.json({
        success: true,
        data: {
          sessions: sessionsWithDuration,
          pagination: {
            total: result.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(result.count / parseInt(limit)),
            hasMore: (offset + parseInt(limit)) < result.count
          }
        }
      });
    } catch (error) {
      console.error('❌ Error in getAllSessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sessions'
      });
    }
  }

  // GET /api/sessions/player/:playerName - Get sessions for specific player
  async getPlayerHistory(req, res) {
    try {
      const { playerName } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const result = await PlayerSession.findAndCountAll({
        where: { playerName },
        order: [['sessionStart', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Add calculated duration to each session
      const sessionsWithDuration = result.rows.map(session => {
        const sessionData = session.toJSON();
        // Calculate duration manually
        if (sessionData.sessionStart && sessionData.sessionEnd) {
          sessionData.duration = Math.floor((new Date(sessionData.sessionEnd) - new Date(sessionData.sessionStart)) / 1000);
        } else {
          sessionData.duration = null;
        }
        return sessionData;
      });

      res.json({
        success: true,
        data: {
          playerName,
          sessions: sessionsWithDuration,
          pagination: {
            total: result.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(result.count / parseInt(limit)),
            hasMore: (offset + parseInt(limit)) < result.count
          }
        }
      });
    } catch (error) {
      console.error('❌ Error in getPlayerHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch player history'
      });
    }
  }

  // GET /api/sessions/active - Get currently active sessions
  async getActiveSessions(req, res) {
    try {
      const activeSessions = await PlayerSession.findAll({
        where: { isActive: true },
        order: [['sessionStart', 'DESC']]
      });

      // Add calculated duration for active sessions (time since start)
      const activeSessionsWithDuration = activeSessions.map(session => {
        const sessionData = session.toJSON();
        // For active sessions, calculate duration from start to now
        if (sessionData.sessionStart) {
          sessionData.duration = Math.floor((new Date() - new Date(sessionData.sessionStart)) / 1000);
        } else {
          sessionData.duration = 0;
        }
        return sessionData;
      });

      res.json({
        success: true,
        data: {
          activeSessions: activeSessionsWithDuration,
          count: activeSessionsWithDuration.length
        }
      });
    } catch (error) {
      console.error('❌ Error in getActiveSessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active sessions'
      });
    }
  }

  // GET /api/sessions/stats - Get session statistics
  async getSessionStats(req, res) {
    try {
      const { playerName, days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const where = {
        sessionStart: { [Op.gte]: startDate },
        isActive: false // Only completed sessions
      };

      if (playerName) {
        where.playerName = playerName;
      }

      const sessions = await PlayerSession.findAll({
        where,
        attributes: ['playerName', 'sessionStart', 'sessionEnd']
      });

      // Calculate statistics
      const stats = {
        totalSessions: sessions.length,
        totalPlaytime: 0,
        averageSessionLength: 0,
        uniquePlayers: new Set(),
        playerStats: {}
      };

      sessions.forEach(session => {
        // Calculate duration manually since virtual getters can be unreliable
        let duration = 0;
        if (session.sessionStart && session.sessionEnd) {
          duration = Math.floor((new Date(session.sessionEnd) - new Date(session.sessionStart)) / 1000);
        }
        
        stats.totalPlaytime += duration;
        stats.uniquePlayers.add(session.playerName);

        if (!stats.playerStats[session.playerName]) {
          stats.playerStats[session.playerName] = {
            sessions: 0,
            totalTime: 0
          };
        }

        stats.playerStats[session.playerName].sessions++;
        stats.playerStats[session.playerName].totalTime += duration;
      });

      stats.uniquePlayers = stats.uniquePlayers.size;
      stats.averageSessionLength = stats.totalSessions > 0 
        ? Math.round(stats.totalPlaytime / stats.totalSessions) 
        : 0;

      res.json({
        success: true,
        data: {
          period: `${days} days`,
          playerName: playerName || 'all players',
          stats
        }
      });
    } catch (error) {
      console.error('❌ Error in getSessionStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session statistics'
      });
    }
  }

  // POST /api/sessions/start - Manually start a session (for testing)
  async startSession(req, res) {
    try {
      const { playerName } = req.body;

      if (!playerName) {
        return res.status(400).json({
          success: false,
          error: 'Player name is required'
        });
      }

      await sessionService.playerJoined(playerName);

      res.json({
        success: true,
        message: `Session started for ${playerName}`
      });
    } catch (error) {
      console.error('❌ Error in startSession:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start session'
      });
    }
  }

  // POST /api/sessions/end - Manually end a session (for testing)
  async endSession(req, res) {
    try {
      const { playerName } = req.body;

      if (!playerName) {
        return res.status(400).json({
          success: false,
          error: 'Player name is required'
        });
      }

      await sessionService.playerLeft(playerName);

      res.json({
        success: true,
        message: `Session ended for ${playerName}`
      });
    } catch (error) {
      console.error('❌ Error in endSession:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to end session'
      });
    }
  }
}

module.exports = new PlayerSessionController();