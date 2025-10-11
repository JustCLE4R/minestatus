const rconService = require('../services/rconService');
const logService = require('../services/logService');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

class SocketController {
  constructor() {
    this.lastData = { total: 0, players: [] };
    this.log = logger.createLogger('SOCKET');
  }

  // Handle new client connection (initial data push)
  async handleConnection(socket, io) {
    this.log.debug("Client connected:", socket.id);

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
    }

    socket.on("disconnect", () => {
      this.log.debug("Client disconnected:", socket.id);
      if (io.engine.clientsCount === 0) {
        // Clear io instance when no clients connected
        cacheService.setSocketIO(null);
      }
    });
  }
}

module.exports = new SocketController();