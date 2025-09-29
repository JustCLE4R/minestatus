const fs = require("fs");
const readline = require("readline");
const chokidar = require("chokidar");

class LogService {
  constructor() {
    this.cachedLogs = [];
    this.lastSize = 0;
    this.LOG_FILE = process.env.LOG_FILE || "./logs/latest.log";
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
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

  addLogLine(line, broadcast = false) {
    if (!this.filterLine(line)) return;
    
    this.cachedLogs.push(line);
    if (this.cachedLogs.length > 200) this.cachedLogs.shift();
    
    if (broadcast && this.io) {
      this.io.emit("server:log", line);
    }
  }

  startWatcher() {
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
          this.addLogLine(line, false); // don't broadcast initial logs
        });
      }
    });

    // Watch for file changes
    chokidar.watch(this.LOG_FILE).on("change", () => {
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
          this.addLogLine(line, true); // broadcast new logs
        });

        this.lastSize = stats.size;
      });
    });
  }
}

module.exports = new LogService();