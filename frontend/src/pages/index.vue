<template>
  <v-app>
    <v-main>
      <v-container>
        <!-- Top Row: Online Players and Server Logo -->
        <v-row class="mb-4" align="stretch">
          <v-col cols="12" md="6" class="d-flex">
            <ServerStatusCard class="flex-fill" />
          </v-col>

          <v-col cols="12" md="6" class="d-flex">
            <OnlinePlayersCard 
              :total="total" 
              :players="players" 
              :playersWithSessions="playersWithSessions" 
              class="flex-fill" 
            />
          </v-col>
        </v-row>

        <!-- Second Row: Server Performance -->
        <v-row class="mb-4">
          <v-col cols="12">
            <ServerPerformanceCard />
          </v-col>
        </v-row>

        <!-- Third Row: Skills Leaderboard -->
        <v-row class="mb-4">
          <v-col cols="12">
            <SkillsLeaderboardCard :skillsData="skillsData" />
          </v-col>
        </v-row>

        <!-- Fourth Row: Server Console -->
        <v-row class="mb-4">
          <v-col cols="12">
            <ServerConsoleCard :logs="logs" />
          </v-col>
        </v-row>

        <!-- Toast Notifications -->
        <ToastNotifications :toasts="toasts" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { io } from "socket.io-client";
import { useToasts } from '../composables/useToasts'
import { usePlayerNotifications } from '../composables/usePlayerNotifications'

// API Configuration
// const API_BASE = 'https://minestatus-backend.cle4r.my.id'
const API_BASE = 'http://localhost:3000'

// Import components
import OnlinePlayersCard from "../components/index/OnlinePlayersCard.vue";
import ServerConsoleCard from "../components/index/ServerConsoleCard.vue";
import SkillsLeaderboardCard from "../components/index/SkillsLeaderboardCard.vue";
import ServerStatusCard from "../components/index/ServerStatusCard.vue";
import ServerPerformanceCard from "../components/index/ServerPerformanceCard.vue";
import ToastNotifications from "../components/ToastNotifications.vue";

// Use composables
const { toasts } = useToasts()
const { handlePlayersUpdate } = usePlayerNotifications()

// Reactive data
const total = ref(0);
const players = ref([]);
const playersWithSessions = ref([]);
const logs = ref([]);
const skillsData = ref([]);
let sessionUpdateTimer = null;

// Update page title based on player count
watch(
  total,
  (newTotal) => {
    const playerText = newTotal === 1 ? "Player" : "Players";
    document.title = `Minestatus | ${newTotal} ${playerText} Online`;
  },
  { immediate: true }
);

// Session duration update timer
function startSessionUpdateTimer() {
  sessionUpdateTimer = setInterval(() => {
    // Update session durations locally to keep them current
    playersWithSessions.value = playersWithSessions.value.map(player => {
      if (player.loginTime) {
        const durationMs = Date.now() - player.loginTime;
        const minutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        const sessionDurationFormatted = hours > 0 
          ? `${hours}h ${remainingMinutes}m` 
          : `${remainingMinutes}m`;
          
        return {
          ...player,
          sessionDuration: durationMs,
          sessionDurationFormatted
        };
      }
      return player;
    });
  }, 60000); // Update every minute
}

function stopSessionUpdateTimer() {
  if (sessionUpdateTimer) {
    clearInterval(sessionUpdateTimer);
    sessionUpdateTimer = null;
  }
}

// Socket.IO connection and event handlers
onMounted(() => {
  const socket = io(API_BASE); // set base URL manually

  // Mock data for testing - 7 online players
  // setTimeout(() => {
  //   total.value = 7;
  //   players.value = ["Steve", "Alex", "Notch", "Herobrine", "Creeper", "Bjir", "EnderDragon"];
  //   previousPlayers.value = [...players.value];
  //   initialized = true;
  // }, 1000);

  socket.on("players:update", (data) => {
    // Handle player notifications using composable
    handlePlayersUpdate(data)
    
    total.value = data.total;
    players.value = data.players;

    // Update session data if available
    if (data.playersWithSessions) {
      playersWithSessions.value = data.playersWithSessions;
    }

    // Start timer to update session durations every minute
    if (!sessionUpdateTimer && playersWithSessions.value.length > 0) {
      startSessionUpdateTimer();
    }
  });

  socket.on("skills:update", (data) => {
    if (data && data.skills) {
      skillsData.value = data.skills;
    }
  });

  socket.on("server:log", (line) => {
    logs.value.push(line);
    if (logs.value.length > 200) {
      logs.value.shift(); // keep only last 200 lines
    }
  });

  // Ensure scroll to bottom on initial mount
  nextTick(() => {
    const el = document.querySelector(".console-log");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  });
  
  // Cleanup on component unmount
  onBeforeUnmount(() => {
    stopSessionUpdateTimer();
  });
});
</script>
