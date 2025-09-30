require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Services
const rconService = require('./services/rconService');
const logService = require('./services/logService');

// Controllers
const socketController = require('./controllers/socketController');

// Routes
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(express.static('public')); // Serve static files


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
  console.log(`🚀 Server running on port ${PORT}`);
  await rconService.connect();
  
  // Initialize log service (starts watcher immediately for session tracking)
  logService.initialize();
});