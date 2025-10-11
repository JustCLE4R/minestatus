const { Skill, PlayerSession, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    // Cache for skills and users data
    this.skillsCache = {
      data: null,
      lastUpdated: 0,
      ttl: 60000 // 60 seconds cache TTL
    };
    
    // Store io instance to emit updates when cache refreshes
    this.io = null;
    this.log = logger.createLogger('CACHE');
  }

  // Method to set the io instance from socketController
  setSocketIO(io) {
    this.io = io;
  }

  async getSkillsAndUsers() {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (this.skillsCache.data && (now - this.skillsCache.lastUpdated) < this.skillsCache.ttl) {
      this.log.debug("📦 Returning cached skills/users data");
      return this.skillsCache.data;
    }
    
    // Fetch fresh data and update cache
    this.log.debug("🔄 Fetching fresh skills/users data from database");
    try {
      // Get skills data with user info
      const skillData = await Skill.findAll({
        include: [{ 
          model: User, 
          as: 'User',
          attributes: { exclude: ['uuid'] }
        }], // Include user info with skills, excluding uuid
        order: [['total', 'DESC']] // Order by total skills descending
      });

      // Get the most recent session end time for each player
      const playerNames = skillData.map(skill => skill.User.user);
      
      // Get only the most recent session for each player using a subquery
      const latestSessions = await PlayerSession.findAll({
        attributes: ['playerName', 'sessionEnd'],
        where: {
          playerName: playerNames,
          sessionEnd: { [Op.not]: null }, // Only sessions that have ended
          id: {
            [Op.in]: PlayerSession.sequelize.literal(`(
              SELECT MAX(id) FROM player_sessions ps2 
              WHERE ps2.player_name = PlayerSession.player_name 
              AND ps2.session_end IS NOT NULL
            )`)
          }
        }
      });

      // Create a map of playerName -> most recent sessionEnd
      const lastLoginMap = {};
      latestSessions.forEach(session => {
        if (!lastLoginMap[session.playerName]) {
          lastLoginMap[session.playerName] = session.sessionEnd;
        }
      });

      // Add the latest session end time to each skill data
      const skillDataWithLastLogin = skillData.map(skill => {
        const skillJson = skill.toJSON();
        
        // Use only session data for lastLogin (more accurate and consistent)
        skillJson.lastLogin = lastLoginMap[skill.User.user] || null;
        
        return skillJson;
      });

      this.skillsCache.data = { skills: skillDataWithLastLogin };
      this.skillsCache.lastUpdated = now;
      
      // Emit update to connected clients immediately when cache expires and refreshes
      if (this.io && this.io.engine.clientsCount > 0) {
        this.log.debug("📡 Broadcasting skills update (cache expired and refreshed)");
        this.io.emit("skills:update", this.skillsCache.data);
      }
      
      return this.skillsCache.data;
    } catch (error) {
      console.error("❌ Error fetching skills/users:", error);
      // Return cached data even if expired, or empty data
      return this.skillsCache.data || { skills: [] };
    }
  }

  // Method to manually invalidate cache (useful for external triggers)
  invalidateSkillsCache() {
    this.log.info("🗑️ Skills cache invalidated manually");
    this.skillsCache.lastUpdated = 0;
  }

  // Method to get cache stats (for debugging)
  getCacheStats() {
    const now = Date.now();
    return {
      hasData: !!this.skillsCache.data,
      age: now - this.skillsCache.lastUpdated,
      ttl: this.skillsCache.ttl,
      isExpired: (now - this.skillsCache.lastUpdated) >= this.skillsCache.ttl
    };
  }

  // Method to update cache TTL
  setCacheTTL(ttl) {
    this.skillsCache.ttl = ttl;
    this.log.info(`🕐 Cache TTL updated to ${ttl}ms`);
  }

  // Method to force refresh cache
  async refreshCache() {
    this.log.info("🔄 Force refreshing cache...");
    this.skillsCache.lastUpdated = 0;
    return await this.getSkillsAndUsers();
  }
}

module.exports = new CacheService();