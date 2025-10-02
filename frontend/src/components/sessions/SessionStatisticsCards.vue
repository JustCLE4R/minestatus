<template>
  <v-row class="mb-6">
    <v-col cols="12" sm="6" md="3">
      <v-card class="pa-4 text-center">
        <v-card-text>
          <div class="text-h4 font-weight-bold text-primary mb-2">
            {{ stats.totalSessions || '-' }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">
            Total Sessions
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card class="pa-4 text-center">
        <v-card-text>
          <div class="text-h4 font-weight-bold text-success mb-2">
            {{ activeSessionsCount || '-' }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">
            Active Sessions
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card class="pa-4 text-center">
        <v-card-text>
          <div class="text-h4 font-weight-bold text-info mb-2">
            {{ stats.uniquePlayers || '-' }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">
            Unique Players
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card class="pa-4 text-center">
        <v-card-text>
          <div class="text-h4 font-weight-bold text-warning mb-2">
            {{ formatDuration(stats.averageSessionLength) || '-' }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">
            Avg Session Time
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    default: () => ({})
  },
  activeSessionsCount: {
    type: Number,
    default: 0
  }
});

// Utility Functions
function formatDuration(seconds) {
  if (!seconds) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>