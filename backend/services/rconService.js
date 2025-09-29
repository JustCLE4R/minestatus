const { Rcon } = require("rcon-client");

class RconService {
  constructor() {
    this.rcon = null;
    this.rconConnected = false;
  }

  async connect() {
    if (this.rconConnected) return this.rcon;

    try {
      this.rcon = await Rcon.connect({
        host: process.env.RCON_HOST,
        port: parseInt(process.env.RCON_PORT),
        password: process.env.RCON_PASSWORD,
      });

      this.rconConnected = true;
      console.log("✅ RCON connected");

      this.rcon.on("end", () => {
        console.log("⚠️ RCON connection closed, retrying in 5s...");
        this.rconConnected = false;
        setTimeout(() => this.connect(), 5000);
      });

      this.rcon.on("error", (err) => {
        console.error("❌ RCON error:", err);
        this.rconConnected = false;
      });

      return this.rcon;
    } catch (err) {
      console.error("❌ Failed to connect RCON:", err);
      this.rconConnected = false;
      setTimeout(() => this.connect(), 5000);
    }
  }

  async getPlayers() {
    if (!this.rconConnected) {
      await this.connect();
      if (!this.rconConnected) return { total: 0, players: [] };
    }

    try {
      const response = await this.rcon.send("list");
      const match = response.match(/There are (\d+) of a max of \d+ players online: ?(.*)?/);

      if (!match) return { total: 0, players: [] };

      const total = parseInt(match[1], 10);
      const players = match[2] ? match[2].split(", ").filter((p) => p) : [];

      return { total, players };
    } catch (err) {
      console.error("RCON send error:", err);
      this.rconConnected = false;
      return { total: 0, players: [] };
    }
  }
}

module.exports = new RconService();