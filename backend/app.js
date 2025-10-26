require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

// Utils
const logger = require('./utils/logger');

// Services
const rconService = require('./services/rconService');
const logService = require('./services/logService');
const cmsService = require('./services/cmsService');
const blockAggregation = require('./services/aggregation/blockService');

// Controllers
const socketController = require('./controllers/socketController');

// Routes
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const log = logger.createLogger('APP');
const io = new Server(server, {
  cors: {
    origin: [
      "https://minestatus.cle4r.my.id",
      "http://localhost:2727",
      "http://localhost:3000",
      "http://127.0.0.1:2727"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
      "https://minestatus.cle4r.my.id",
      "http://localhost:2727",
      "http://localhost:3000",
      "http://127.0.0.1:2727"
    ],
  methods: ["GET"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// HTTP request logging (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(process.cwd(), 'public/assets'), {
  maxAge: '30d',
  immutable: true
}));

// API Routes
app.use('/api', apiRoutes);

// Initialize services
logService.setSocketIO(io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  socketController.handleConnection(socket, io);
});

// Start server
server.listen(PORT, async () => {
  log.info(`🚀 Server running on port ${PORT}`);
  await rconService.connect();
  
  // Initialize log service (starts watcher immediately for session tracking)
  logService.initialize();
  
  // Initialize CMS service (preload cache and start file watching)
  await cmsService.initialize();
  
  // Initialize aggregation service (starts background cron jobs)
  blockAggregation.initialize();
});

// Graceful shutdown
process.on('SIGTERM', async () => {``
  log.info('🛑 SIGTERM received, shutting down gracefully...');
  await cmsService.shutdown();
  blockAggregation.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log.info('🛑 SIGINT received, shutting down gracefully...');
  await cmsService.shutdown();
  blockAggregation.shutdown();
  process.exit(0);
});