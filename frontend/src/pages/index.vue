<template>
  <v-container>
    <!-- Top Row: Online Players and Server Logo -->
    <v-row class="mb-4" align="stretch">
      <v-col cols="12" md="6" class="d-flex">
        <ServerStatusCard class="flex-fill" />
      </v-col>

      <v-col cols="12" md="6" class="d-flex">
        <OnlinePlayersCard 
          :total="socketStore.playerCount" 
          :players="socketStore.playersList" 
          :playersWithSessions="playersWithSessions" 
          class="flex-fill" 
        />
      </v-col>
    </v-row>

        <!-- Second Row: Skills Leaderboard -->
        <v-row class="mb-4">
          <v-col cols="12">
            <SkillsLeaderboardCard :skillsData="socketStore.skills" />
          </v-col>
        </v-row>

        <!-- Third Row: Server Console -->
        <v-row class="mb-4">
          <v-col cols="12">
            <ServerConsoleCard :logs="socketStore.logs" />
          </v-col>
        </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useSocketStore } from '@/stores/socket'

// Import components
import OnlinePlayersCard from "../components/index/OnlinePlayersCard.vue";
import ServerConsoleCard from "../components/index/ServerConsoleCard.vue";
import SkillsLeaderboardCard from "../components/index/SkillsLeaderboardCard.vue";
import ServerStatusCard from "../components/index/ServerStatusCard.vue";

// Use socket store
const socketStore = useSocketStore()

// Local reactive data for session timers
const playersWithSessions = ref([]);
let sessionUpdateTimer = null;

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

// Watch for changes in players data to update sessions
watch(() => socketStore.playersWithSessions, (newPlayersWithSessions) => {
  if (newPlayersWithSessions) {
    playersWithSessions.value = newPlayersWithSessions;
    
    // Start timer to update session durations every minute
    if (!sessionUpdateTimer && playersWithSessions.value.length > 0) {
      startSessionUpdateTimer();
    }
  }
}, { immediate: true })

onMounted(() => {
  // Ensure scroll to bottom on initial mount
  nextTick(() => {
    const el = document.querySelector(".console-log");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  });
});

// Cleanup on component unmount
onBeforeUnmount(() => {
  stopSessionUpdateTimer();
});
</script>
