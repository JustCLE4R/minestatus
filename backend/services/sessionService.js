const { PlayerSession } = require('../models');
const CacheService = require('./cacheService');

class SessionService {
  constructor() {
    this.playerSessions = new Map(); // Map of playerName -> { loginTime, isOnline }
    this.sessionThreshold = 150 * 1000; // 2.5 minute minimum session duration to save to DB
    
    // Automatically clean up old sessions every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldSessions();
    }, 60 * 60 * 1000); // 1 hour
  }

  // Track when a player joins
  async playerJoined(playerName) {
    try {
      const now = new Date();

      const playerSession = await PlayerSession.create({
        playerName,
        sessionStart: now,
        isActive: true
      });

      this.playerSessions.set(playerName, {
        sessionId: playerSession.id,
        loginTime: now.getTime(), // Store as timestamp for consistency
        isOnline: true
      });
      console.log(`📈 Session started for ${playerName} at ${now.toISOString()}`);
    } catch (error) {
      console.error(`❌ Error creating session for ${playerName}:`, error);
      // Fallback to in-memory only tracking
      this.playerSessions.set(playerName, {
        sessionId: null,
        loginTime: Date.now(),
        isOnline: true
      });
    }
  }

  // Track when a player leaves
  async playerLeft(playerName) {
    if (this.playerSessions.has(playerName)) {
      const session = this.playerSessions.get(playerName);
      const now = new Date();
      const sessionDuration = now.getTime() - session.loginTime;

      // Only save to database if session duration meets the threshold
      if (session.sessionId && sessionDuration >= this.sessionThreshold) {
        try {
          await PlayerSession.update(
            { sessionEnd: now, isActive: false },
            { where: { id: session.sessionId } }
          );
          console.log(`📉 Session ended for ${playerName} (${Math.floor(sessionDuration / 1000)}s) - Saved to DB`);

          // tell session to refresh cache and emit update
          CacheService.refreshCache();
          
        } catch (error) {
          console.error(`❌ Error updating session for ${playerName}:`, error);
        }
      } else if (session.sessionId) {
        // Session too short - delete from database instead of updating
        try {
          await PlayerSession.destroy({
            where: { id: session.sessionId }
          });
          console.log(`📉 Session ended for ${playerName} (${Math.floor(sessionDuration / 1000)}s) - Too short, removed from DB`);
        } catch (error) {
          console.error(`❌ Error removing short session for ${playerName}:`, error);
        }
      } else {
        console.log(`📉 Session ended for ${playerName} (${Math.floor(sessionDuration / 1000)}s) - In-memory only`);
      }

      session.isOnline = false;
    }
  }

  // Get session duration for a player in milliseconds
  getSessionDuration(playerName) {
    const session = this.playerSessions.get(playerName);
    if (!session || !session.isOnline) return 0;
    
    return Date.now() - session.loginTime;
  }

  // Get formatted session duration (e.g., "2h 15m")
  getFormattedSessionDuration(playerName) {
    const durationMs = this.getSessionDuration(playerName);
    if (durationMs === 0) return "0m";

    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    } else {
      return `${remainingMinutes}m`;
    }
  }

  // Get enhanced player data with session info
  getPlayersWithSessions(players) {
    return players.map(playerName => ({
      name: playerName,
      sessionDuration: this.getSessionDuration(playerName),
      sessionDurationFormatted: this.getFormattedSessionDuration(playerName),
      loginTime: this.playerSessions.get(playerName)?.loginTime || null
    }));
  }

  // Clean up old offline sessions (optional - for memory management)
  cleanupOldSessions(maxAgeMs = 24 * 60 * 60 * 1000) { // Default: 24 hours
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [playerName, session] of this.playerSessions.entries()) {
      if (!session.isOnline && (now - session.loginTime) > maxAgeMs) {
        this.playerSessions.delete(playerName);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old session(s)`);
    }
  }

  // Get all active sessions
  getActiveSessions() {
    const activeSessions = [];
    for (const [playerName, session] of this.playerSessions.entries()) {
      if (session.isOnline) {
        activeSessions.push({
          playerName,
          loginTime: session.loginTime,
          sessionDuration: this.getSessionDuration(playerName),
          sessionDurationFormatted: this.getFormattedSessionDuration(playerName)
        });
      }
    }
    return activeSessions;
  }

  // Destroy cleanup interval (for testing or shutdown)
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Set minimum session duration threshold (in seconds)
  setSessionThreshold(seconds) {
    this.sessionThreshold = seconds * 1000;
    console.log(`⏱️ Session threshold updated to ${seconds} seconds`);
  }

  // Get current session threshold in seconds
  getSessionThreshold() {
    return this.sessionThreshold / 1000;
  }
}

module.exports = new SessionService();