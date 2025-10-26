<template>
  <v-row class="mb-4">
    <v-col cols="12">
      <v-card class="pa-6" elevation="3">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <div>
            <h1 class="text-h3 font-weight-bold mb-2">
              <v-icon icon="mdi-controller" size="64" class="mr-3" color="primary"></v-icon>
              Player Session History
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Track player activity and session statistics
            </p>
          </div>
        </div>
        <div class="text-right">
          <v-chip
            v-if="realTimeUpdates"
            color="success"
            variant="tonal"
            size="small"
            class="mb-2"
          >
            <v-icon start size="small">mdi-wifi</v-icon>
            Live Updates
          </v-chip>
          <v-chip
            v-else
            color="grey"
            variant="tonal"
            size="small"
            class="mb-2"
          >
            <v-icon start size="small">mdi-wifi-off</v-icon>
            Manual Refresh
          </v-chip>
        </div>
      </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps({
  realTimeUpdates: {
    type: Boolean,
    default: true
  }
});
</script>

<style scoped>
.text-h4 {
  line-height: 1.2;
}
</style>