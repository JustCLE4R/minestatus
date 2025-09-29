const { User, Skill } = require('../models');

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
  }

  // Method to set the io instance from socketController
  setSocketIO(io) {
    this.io = io;
  }

  async getSkillsAndUsers() {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (this.skillsCache.data && (now - this.skillsCache.lastUpdated) < this.skillsCache.ttl) {
      console.log("📦 Returning cached skills/users data");
      return this.skillsCache.data;
    }
    
    // Fetch fresh data and update cache
    console.log("🔄 Fetching fresh skills/users data from database");
    try {
      const [skillData, userData] = await Promise.all([
        Skill.findAll({
          include: [{ 
            model: User, 
            as: 'User',
            attributes: { exclude: ['uuid'] }
          }], // Include user info with skills, excluding uuid
          order: [['total', 'DESC']] // Order by total skills descending
        }),
        // User.findAll({
        //   order: [['lastlogin', 'DESC']], // Order by last login
        //   limit: 100 // Limit to prevent huge datasets
        // })
      ]);
      
      // this.skillsCache.data = { skills: skillData, users: userData };
      this.skillsCache.data = { skills: skillData };
      this.skillsCache.lastUpdated = now;
      
      // Emit update to connected clients immediately when cache expires and refreshes
      if (this.io && this.io.engine.clientsCount > 0) {
        console.log("📡 Broadcasting skills update (cache expired and refreshed)");
        this.io.emit("skills:update", this.skillsCache.data);
      }
      
      return this.skillsCache.data;
    } catch (error) {
      console.error("❌ Error fetching skills/users:", error);
      // Return cached data even if expired, or empty data
      // return this.skillsCache.data || { skills: [], users: [] };
      return this.skillsCache.data || { skills: [] };
    }
  }

  // Method to manually invalidate cache (useful for external triggers)
  invalidateSkillsCache() {
    console.log("🗑️ Skills cache invalidated manually");
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
    console.log(`🕐 Cache TTL updated to ${ttl}ms`);
  }

  // Method to force refresh cache
  async refreshCache() {
    console.log("🔄 Force refreshing cache...");
    this.skillsCache.lastUpdated = 0;
    return await this.getSkillsAndUsers();
  }
}

module.exports = new CacheService();