const rconService = require('../services/rconService');
const logService = require('../services/logService');
const cacheService = require('../services/cacheService');
const chokidar = require('chokidar');
const fs = require('fs');
const readline = require('readline');

class SocketController {
  constructor() {
    this.logWatcher = null;
    this.lastData = { total: 0, players: [] };
    this.logFilePath = process.env.LOG_FILE || "./logs/latest.log"
    this.lastPosition = 0;
  }

  async handleConnection(socket, io) {
    console.log("Client connected:", socket.id);

    // Send cached logs to new client
    const cachedLogs = logService.getCachedLogs();
    cachedLogs.forEach(line => {
      socket.emit("server:log", line);
    });

    // Send cached skill and user data
    const skillsAndUsers = await cacheService.getSkillsAndUsers();
    socket.emit("skills:update", skillsAndUsers);

    // Ensure RCON is connected before serving first data
    await rconService.connect();

    const data = await rconService.getPlayers();
    this.lastData = data;
    socket.emit("players:update", data);

    if (io.engine.clientsCount === 1) {
      // Set up cache service for automatic emissions only when first client connects
      cacheService.setSocketIO(io);
      this.startLogWatching(io);
    }

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (io.engine.clientsCount === 0) {
        this.stopLogWatching();
        // Clear io instance when no clients connected
        cacheService.setSocketIO(null);
      }
    });
  }

  startLogWatching(io) {
    if (this.logWatcher) return;
    console.log("👁️ Starting log file watching with chokidar...");

    // Check if log file exists and initialize position
    if (fs.existsSync(this.logFilePath)) {
      this.lastPosition = fs.statSync(this.logFilePath).size;
    } else {
      console.log("⚠️ Log file not found:", this.logFilePath);
      this.lastPosition = 0;
    }

    this.logWatcher = chokidar.watch(this.logFilePath, {
      persistent: true,
      usePolling: false,
      ignoreInitial: true
    });

    this.logWatcher.on('change', async (filePath) => {
      try {
        const stats = fs.statSync(filePath);
        
        // Only process if file has grown
        if (stats.size > this.lastPosition) {
          const newLines = await this.readNewLines(filePath, this.lastPosition, stats.size);
          this.lastPosition = stats.size;
          
          // Check for player events
          const hasPlayerEvent = newLines.some(line => 
            line.includes('joined the game') || 
            line.includes('left the game') || 
            line.includes('Disconnected') ||
            line.includes('disconnected ')
          );

          if (hasPlayerEvent) {
            console.log("🔄 Player event detected in log:", newLines.filter(line => 
              line.includes('joined the game') || 
              line.includes('left the game') || 
              line.includes('Disconnected') ||
              line.includes('disconnected ')
            ));
            
            // Small delay to ensure the event is fully processed
            setTimeout(async () => {
              const data = await rconService.getPlayers();
              
              if (
                data.total !== this.lastData.total ||
                data.players.join(",") !== this.lastData.players.join(",")
              ) {
                this.lastData = data;
                io.emit("players:update", data);
                
                // Player events may affect skills, so force a skills cache refresh
                // This will automatically emit skills:update if there are changes
                await cacheService.refreshCache();
                
                console.log("📡 Broadcast player update:", data);
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error("❌ Error processing log file change:", error);
      }
    });

    this.logWatcher.on('error', (error) => {
      console.error("❌ Chokidar watcher error:", error);
    });
  }

  async readNewLines(filePath, startPos, endPos) {
    return new Promise((resolve, reject) => {
      const lines = [];
      const stream = fs.createReadStream(filePath, {
        start: startPos,
        end: endPos - 1,
        encoding: 'utf8'
      });

      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        if (line.trim()) {
          lines.push(line.trim());
        }
      });

      rl.on('close', () => {
        resolve(lines);
      });

      rl.on('error', (error) => {
        reject(error);
      });
    });
  }

  stopLogWatching() {
    if (this.logWatcher) {
      this.logWatcher.close();
      this.logWatcher = null;
      console.log("👁️‍🗨️ Stopped chokidar log file watching (no clients connected).");
    }
  }


}

module.exports = new SocketController();