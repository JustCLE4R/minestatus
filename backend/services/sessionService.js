const { PlayerSession } = require('../models');

class SessionService {
  constructor() {
    this.playerSessions = new Map(); // Map of playerName -> { loginTime, isOnline }
    
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

      // Update session end in DB if we have a session ID
      if (session.sessionId) {
        try {
          await PlayerSession.update(
            { sessionEnd: new Date(), isActive: false },
            { where: { id: session.sessionId } }
          );
        } catch (error) {
          console.error(`❌ Error updating session for ${playerName}:`, error);
        }
      }

      session.isOnline = false;
      console.log(`📉 Session ended for ${playerName}`);
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

  // Update current online players and detect joins/leaves
  async updatePlayers(currentPlayers, previousPlayers = []) {
    const joined = currentPlayers.filter(p => !previousPlayers.includes(p));
    const left = previousPlayers.filter(p => !currentPlayers.includes(p));

    // Track new joins
    for (const player of joined) {
      await this.playerJoined(player);
    }
    
    // Track leaves
    for (const player of left) {
      await this.playerLeft(player);
    }

    return { joined, left };
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
}

module.exports = new SessionService();