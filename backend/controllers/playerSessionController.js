const { PlayerSession } = require('../models');
const { Op } = require('sequelize');
const sessionService = require('../services/sessionService');
const logger = require('../utils/logger');

class PlayerSessionController {
  constructor() {
    this.log = logger.createLogger('SESSION_CTRL');
  }
  
  // GET /api/sessions - Get all sessions with pagination and filters
  getAllSessions = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        playerName,
        startDate,
        endDate,
        activeOnly,
        days // Add days filter parameter
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = {};

      if (playerName) {
        where.playerName = { [Op.like]: `%${playerName}%` };
      }

      // Handle days filter - if provided, calculate start date from days
      if (days) {
        const calculatedStartDate = new Date();
        calculatedStartDate.setDate(calculatedStartDate.getDate() - parseInt(days));
        where.sessionStart = { [Op.gte]: calculatedStartDate };
        this.log.debug(`Filtering sessions to last ${days} days from ${calculatedStartDate.toISOString()}`);
      } else {
        // Use explicit start/end dates if provided and no days filter
        if (startDate) {
          where.sessionStart = { [Op.gte]: new Date(startDate) };
        }

        if (endDate) {
          where.sessionStart = { [Op.lte]: new Date(endDate) };
        }
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

      this.log.debug(`Found ${result.count} total sessions matching criteria`);

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
  getPlayerHistory = async (req, res) => {
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
  getActiveSessions = async (req, res) => {
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
  getSessionStats = async (req, res) => {
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
  startSession = async (req, res) => {
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
  endSession = async (req, res) => {
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

  // GET /api/sessions/analytics/daily - Get daily session analytics
  getDailyAnalytics = async (req, res) => {
    try {
      const { days } = req.query;
      
      // Build where clause - only add date filter if days is provided
      const where = {
        sessionEnd: { [Op.not]: null }
      };
      
      if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        where.sessionStart = { [Op.gte]: startDate };
        this.log.debug(`Loading daily analytics for ${days} days from ${startDate.toISOString()}`);
      } else {
        this.log.debug('Loading daily analytics for all time');
      }

      // Try using Sequelize for better compatibility
      const sessions = await PlayerSession.findAll({
        where,
        attributes: ['sessionStart', 'sessionEnd', 'playerName']
      });

      this.log.debug(`Found ${sessions.length} sessions for analytics`);

      // For 1 day, use hourly granularity; for longer periods, use daily
      const useHourlyGranularity = parseInt(days) === 1;
      const groupedData = {};

      sessions.forEach(session => {
        let key;
        if (useHourlyGranularity) {
          // Group by hour for 24-hour view
          const date = new Date(session.sessionStart);
          key = `${date.toISOString().split('T')[0]} ${date.getHours().toString().padStart(2, '0')}:00`;
        } else {
          // Group by date for longer periods
          key = session.sessionStart.toISOString().split('T')[0];
        }

        if (!groupedData[key]) {
          groupedData[key] = { 
            date: key, 
            sessions: 0, 
            uniquePlayers: new Set() 
          };
        }
        groupedData[key].sessions++;
        groupedData[key].uniquePlayers.add(session.playerName);
      });

      // Convert to array and format
      const result = Object.values(groupedData)
        .map(group => ({
          date: group.date,
          sessions: group.sessions,
          uniquePlayers: group.uniquePlayers.size
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      this.log.debug(`Returning ${result.length} data points for daily analytics`);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Error in getDailyAnalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get daily analytics'
      });
    }
  }

  // GET /api/sessions/analytics/hourly - Get hourly session distribution
  getHourlyAnalytics = async (req, res) => {
    try {
      const { days } = req.query;
      
      // Build where clause - only add date filter if days is provided
      const where = {
        sessionEnd: { [Op.not]: null }
      };
      
      if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        where.sessionStart = { [Op.gte]: startDate };
      }

      const sessions = await PlayerSession.findAll({
        where,
        attributes: ['sessionStart']
      });

      // Initialize hourly data
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        sessions: 0
      }));

      // Count sessions by hour
      sessions.forEach(session => {
        const hour = session.sessionStart.getHours();
        hourlyData[hour].sessions++;
      });

      res.json({
        success: true,
        data: hourlyData
      });
    } catch (error) {
      console.error('❌ Error in getHourlyAnalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get hourly analytics'
      });
    }
  }

  // GET /api/sessions/analytics/duration - Get session duration distribution
  getDurationAnalytics = async (req, res) => {
    try {
      const { days } = req.query;
      
      // Build where clause - only add date filter if days is provided
      const where = {
        sessionEnd: { [Op.not]: null }
      };
      
      if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        where.sessionStart = { [Op.gte]: startDate };
      }

      const sessions = await PlayerSession.findAll({
        where,
        attributes: ['sessionStart', 'sessionEnd']
      });

      // Calculate duration distribution
      const durationBuckets = {
        '< 5m': 0,
        '5-15m': 0,
        '15-30m': 0,
        '30-60m': 0,
        '1-2h': 0,
        '2-4h': 0,
        '4h+': 0
      };

      sessions.forEach(session => {
        const duration = (new Date(session.sessionEnd) - new Date(session.sessionStart)) / (1000 * 60); // minutes
        
        if (duration < 5) durationBuckets['< 5m']++;
        else if (duration < 15) durationBuckets['5-15m']++;
        else if (duration < 30) durationBuckets['15-30m']++;
        else if (duration < 60) durationBuckets['30-60m']++;
        else if (duration < 120) durationBuckets['1-2h']++;
        else if (duration < 240) durationBuckets['2-4h']++;
        else durationBuckets['4h+']++;
      });

      const result = Object.entries(durationBuckets).map(([label, count]) => ({
        label,
        count
      }));

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Error in getDurationAnalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get duration analytics'
      });
    }
  }

  // GET /api/sessions/analytics/top-players - Get top players by total playtime
  getTopPlayersAnalytics = async (req, res) => {
    try {
      const { days, limit = 10 } = req.query;
      
      // Build where clause - only add date filter if days is provided
      const where = {
        sessionEnd: { [Op.not]: null }
      };
      
      if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        where.sessionStart = { [Op.gte]: startDate };
      }

      const sessions = await PlayerSession.findAll({
        where,
        attributes: ['playerName', 'sessionStart', 'sessionEnd']
      });

      // Group by player and calculate totals
      const playerStats = {};
      sessions.forEach(session => {
        const playerName = session.playerName;
        const duration = (new Date(session.sessionEnd) - new Date(session.sessionStart)) / (1000 * 60 * 60); // hours
        
        if (!playerStats[playerName]) {
          playerStats[playerName] = {
            playerName,
            sessionCount: 0,
            totalHours: 0
          };
        }
        
        playerStats[playerName].sessionCount++;
        playerStats[playerName].totalHours += duration;
      });

      // Convert to array, sort by total hours, and limit
      const result = Object.values(playerStats)
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, parseInt(limit))
        .map(player => ({
          ...player,
          totalHours: Math.round(player.totalHours * 100) / 100 // Round to 2 decimal places
        }));

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Error in getTopPlayersAnalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get top players analytics'
      });
    }
  }

  // POST /api/sessions/generate-test-data - Generate test session data (for development)
  generateTestData = async (req, res) => {
    try {
      const testPlayers = ['TestPlayer1', 'TestPlayer2', 'TestPlayer3', 'TestPlayer4'];
      const now = new Date();
      const testSessions = [];

      // Generate sessions for the last 2 days with various durations
      for (let i = 0; i < 48; i++) { // 48 hours
        const sessionStart = new Date(now.getTime() - (i * 60 * 60 * 1000)); // i hours ago
        
        // Random number of sessions per hour (0-3)
        const sessionsThisHour = Math.floor(Math.random() * 4);
        
        for (let j = 0; j < sessionsThisHour; j++) {
          const player = testPlayers[Math.floor(Math.random() * testPlayers.length)];
          const sessionStartTime = new Date(sessionStart.getTime() + (Math.random() * 60 * 60 * 1000)); // Random minute within the hour
          const sessionDuration = Math.random() * 180 + 10; // 10-190 minutes
          const sessionEndTime = new Date(sessionStartTime.getTime() + (sessionDuration * 60 * 1000));

          testSessions.push({
            playerName: player,
            sessionStart: sessionStartTime,
            sessionEnd: sessionEndTime,
            isActive: false
          });
        }
      }

      // Insert test sessions
      await PlayerSession.bulkCreate(testSessions);

      res.json({
        success: true,
        message: `Generated ${testSessions.length} test sessions`,
        data: { count: testSessions.length }
      });
    } catch (error) {
      console.error('❌ Error in generateTestData:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate test data'
      });
    }
  }
}

module.exports = new PlayerSessionController();