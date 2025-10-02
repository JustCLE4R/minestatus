<template>
  <v-card class="mb-6">
    <v-card-text>
      <v-row align="center">
        <v-col cols="12" md="3">
          <v-text-field
            :model-value="playerFilter"
            @update:model-value="$emit('update:playerFilter', $event)"
            hide-details
            label="Filter by player name"
            prepend-inner-icon="mdi-magnify"
            clearable
            variant="outlined"
            density="compact"
            @input="onPlayerFilterChange"
          />
        </v-col>

        <v-col cols="12" md="2">
          <v-select
            :model-value="timeFilter"
            @update:model-value="$emit('update:timeFilter', $event)"
            hide-details
            :items="timeFilterOptions"
            label="Time Period"
            variant="outlined"
            density="compact"
          />
        </v-col>

        <v-col cols="6" md="2">
          <v-switch
            :model-value="activeOnly"
            @update:model-value="$emit('update:activeOnly', $event)"
            hide-details
            label="Active only"
            color="primary"
          />
        </v-col>

        <v-col cols="6" md="2">
          <v-switch
            :model-value="realTimeUpdates"
            @update:model-value="$emit('update:realTimeUpdates', $event)"
            hide-details
            label="Real-time"
            color="success"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-btn
            @click="$emit('refresh')"
            color="primary"
            variant="outlined"
            block
            :loading="loading"
          >
            <v-icon start>mdi-refresh</v-icon>
            Refresh
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  playerFilter: {
    type: String,
    default: ''
  },
  timeFilter: {
    type: Number,
    default: 30
  },
  activeOnly: {
    type: Boolean,
    default: false
  },
  realTimeUpdates: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:playerFilter',
  'update:timeFilter', 
  'update:activeOnly',
  'update:realTimeUpdates',
  'refresh',
  'playerFilterChange'
]);

// Time Filter Options
const timeFilterOptions = [
  { title: 'Last 7 days', value: 7 },
  { title: 'Last 30 days', value: 30 },
  { title: 'Last 90 days', value: 90 }
];

// Debounce function for search input
let debounceTimer = null;
function onPlayerFilterChange() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emit('playerFilterChange');
  }, 500);
}
</script>