<template>
  <v-card>
    <v-card-title> Online Players: {{ total }} </v-card-title>
    <v-card-text>
      <v-list class="player-list">
        <v-list-item v-for="player in players" :key="player">
          <v-avatar size="32" class="mr-2">
            <img :src="`https://mc-heads.net/avatar/${player}/32`" />
          </v-avatar>
          {{ player }}
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
  }
});
</script>

<style scoped>
.player-list {
  max-height: 168px; /* Fixed height for ~5 players (56px per item) */
  overflow-y: auto;
  padding: 0;
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