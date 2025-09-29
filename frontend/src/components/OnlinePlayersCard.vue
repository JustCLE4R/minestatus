<template>
  <v-card class="online-players-card d-flex flex-column">
    <v-card-title> Online Players: {{ total }} </v-card-title>
    <v-card-text class="flex-grow-1 d-flex flex-column overflow-auto">
      <v-list class="player-list flex-grow-1">
        <v-list-item v-for="player in playersWithSessions" :key="player.name || player">
          <template v-if="typeof player === 'object'">
            <!-- Enhanced player display with session info -->
            <div class="d-flex align-center justify-space-between w-100">
              <div class="d-flex align-center">
                <v-avatar size="32" class="mr-3">
                  <img :src="`https://mc-heads.net/avatar/${player.name}/32`" />
                </v-avatar>
                <span class="player-name">{{ player.name }}</span>
              </div>
              <div class="session-info text-caption">
                <v-chip
                  size="x-small"
                  color="primary"
                  variant="outlined"
                  class="session-chip"
                >
                  {{ player.sessionDurationFormatted }}
                </v-chip>
              </div>
            </div>
          </template>
          <template v-else>
            <!-- Fallback for simple string players -->
            <v-avatar size="32" class="mr-2">
              <img :src="`https://mc-heads.net/avatar/${player}/32`" />
            </v-avatar>
            {{ player }}
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  total: {
    type: Number,
    default: 0
  },
  players: {
    type: Array,
    default: () => []
  },
  playersWithSessions: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
.online-players-card {
  max-height: 320px;
}

.player-list {
  padding: 0;
}

.player-name {
  font-weight: 500;
}

.session-info {
  min-width: 60px;
  text-align: right;
}

.session-chip {
  font-size: 0.7rem !important;
  height: 20px !important;
  border-radius: 10px;
}

/* Custom scrollbar styling for dark theme */
.player-list::-webkit-scrollbar {
  width: 6px;
}

.player-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.player-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.player-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>