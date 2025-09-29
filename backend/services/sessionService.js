class SessionService {
  constructor() {
    this.playerSessions = new Map(); // Map of playerName -> { loginTime, isOnline }
  }

  // Track when a player joins
  playerJoined(playerName) {
    const now = Date.now();
    this.playerSessions.set(playerName, {
      loginTime: now,
      isOnline: true
    });
    console.log(`📈 Session started for ${playerName} at ${new Date(now).toISOString()}`);
  }

  // Track when a player leaves
  playerLeft(playerName) {
    if (this.playerSessions.has(playerName)) {
      const session = this.playerSessions.get(playerName);
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
  updatePlayers(currentPlayers, previousPlayers = []) {
    const joined = currentPlayers.filter(p => !previousPlayers.includes(p));
    const left = previousPlayers.filter(p => !currentPlayers.includes(p));

    // Track new joins
    joined.forEach(player => this.playerJoined(player));
    
    // Track leaves
    left.forEach(player => this.playerLeft(player));

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
    for (const [playerName, session] of this.playerSessions.entries()) {
      if (!session.isOnline && (now - session.loginTime) > maxAgeMs) {
        this.playerSessions.delete(playerName);
        console.log(`🧹 Cleaned up old session for ${playerName}`);
      }
    }
  }
}

module.exports = new SessionService();