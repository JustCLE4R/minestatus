const fs = require("fs");
const readline = require("readline");
const chokidar = require("chokidar");
const sessionService = require('./sessionService');
const rconService = require('./rconService');

class LogService {
  constructor() {
    this.cachedLogs = [];
    this.lastSize = 0;
    this.LOG_FILE = process.env.LOG_FILE || "./logs/latest.log";
    this.io = null;
    this.watcher = null;
    this.isWatching = false;
  }

  setSocketIO(io) {
    this.io = io;
    console.log("📡 Socket.IO instance set for log service");
  }

  getCachedLogs() {
    return this.cachedLogs;
  }

  filterLine(line) {
    // Filter out lines containing IP addresses or UUIDs
    if (line.includes('/') && /\d+\.\d+\.\d+\.\d+/.test(line)) return false;
    if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(line)) return false;
    return true;
  }

  addLogLine(line, broadcast = false, checkEvents = true) {
    // if (!this.filterLine(line)) return;
    
    this.cachedLogs.push(line);
    if (this.cachedLogs.length > 200) this.cachedLogs.shift();
    
    // Only check for player events if specified (skip for historical logs)
    if (checkEvents) {
      this.checkPlayerEvents(line);
    }
    
    if (broadcast && this.io) {
      this.io.emit("server:log", line);
    }
  }

  checkPlayerEvents(line) {
    // Check for player join events
    const joinMatch = line.match(/(\w+) joined the game/);
    if (joinMatch) {
      const playerName = joinMatch[1];
      sessionService.playerJoined(playerName);
      console.log(`🎮 Player joined: ${playerName}`);
      
      // Trigger player update if we have connected clients
      if (this.io) {
        this.triggerPlayerUpdate();
      }
      return;
    }

    // Check for player leave events - improved patterns
    const leaveMatch = line.match(/(\w+) left the game/i) || 
                     line.match(/(\w+) lost connection:/i) ||
                     line.match(/(\w+) has disconnected/i);
    if (leaveMatch) {
      const playerName = leaveMatch[1];
      sessionService.playerLeft(playerName);
      console.log(`👋 Player left: ${playerName}`);
      
      // Trigger player update if we have connected clients
      if (this.io) {
        this.triggerPlayerUpdate();
      }
      return;
    }
  }

  async triggerPlayerUpdate() {
    // Small delay to ensure the event is fully processed
    setTimeout(async () => {
      try {
        const data = await rconService.getPlayers();
        
        if (this.io) {
          this.io.emit("players:update", data);
          console.log("📡 Broadcast player update due to log event:", data.total, "players");
        }
      } catch (error) {
        console.error("❌ Error triggering player update:", error);
      }
    }, 500);
  }

  startWatcher() {
    if (this.isWatching) {
      console.log("📄 Log watcher already running");
      return;
    }

    console.log("👁️ Starting log file watcher (always active)...");
    this.isWatching = true;

    // Initialize cached logs from existing file
    fs.stat(this.LOG_FILE, (err, stats) => {
      if (!err) {
        this.lastSize = stats.size;
        const stream = fs.createReadStream(this.LOG_FILE, {
          encoding: "utf8",
          start: Math.max(0, stats.size - 20000), // last ~20KB
        });

        const rl = readline.createInterface({ input: stream });
        rl.on("line", (line) => {
          this.addLogLine(line, false, false); // don't broadcast initial logs and don't check events
        });
      } else {
        console.log("⚠️ Log file not found, will create watcher anyway:", this.LOG_FILE);
      }
    });

    // Watch for file changes
    this.watcher = chokidar.watch(this.LOG_FILE, {
      persistent: true,
      usePolling: false,
      ignoreInitial: true
    });

    this.watcher.on("change", () => {
      fs.stat(this.LOG_FILE, (err, stats) => {
        if (err) return;

        if (stats.size < this.lastSize) this.lastSize = 0; // log rotated

        const stream = fs.createReadStream(this.LOG_FILE, {
          encoding: "utf8",
          start: this.lastSize,
          end: stats.size,
        });

        const rl = readline.createInterface({ input: stream });
        rl.on("line", (line) => {
          this.addLogLine(line, true, true); // broadcast new logs and check for player events
        });

        this.lastSize = stats.size;
      });
    });

    this.watcher.on('error', (error) => {
      console.error("❌ Log watcher error:", error);
      this.isWatching = false;
    });
  }

  stopWatcher() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.isWatching = false;
      console.log("👁️‍🗨️ Log watcher stopped");
    }
  }

  // Initialize the log service - to be called at startup
  initialize() {
    console.log("🔧 Initializing log service...");
    this.startWatcher();
    console.log("✅ Log service initialized - now tracking player sessions continuously");
  }
}

module.exports = new LogService();