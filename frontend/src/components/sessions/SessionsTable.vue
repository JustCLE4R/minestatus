<template>
  <v-card>
    <v-card-title>
      Session History
    </v-card-title>

    <v-data-table-server
      :items-per-page="itemsPerPage"
      :page="currentPage"
      :headers="headers"
      :items="sessions"
      :items-length="totalItems"
      :loading="loading"
      :no-data-text="sessions.length === 0 ? 'No sessions found' : 'Loading...'"
      @update:items-per-page="$emit('update:itemsPerPage', $event)"
      @update:page="$emit('update:currentPage', $event)"
      @update:options="$emit('updateOptions', $event)"
      class="elevation-0"
    >
      <!-- Player Name Column -->
      <template v-slot:item.playerName="{ item }">
        <div class="font-weight-medium">
          {{ item.playerName }}
        </div>
      </template>

      <!-- Session Start Column -->
      <template v-slot:item.sessionStart="{ item }">
        <div class="text-body-2">
          {{ formatDate(item.sessionStart) }}
        </div>
      </template>

      <!-- Session End Column -->
      <template v-slot:item.sessionEnd="{ item }">
        <div class="text-body-2">
          {{ item.sessionEnd ? formatDate(item.sessionEnd) : '-' }}
        </div>
      </template>

      <!-- Duration Column -->
      <template v-slot:item.duration="{ item }">
        <v-chip
          :color="item.isActive ? 'success' : 'default'"
          variant="tonal"
          size="small"
        >
          {{ formatDuration(item.duration) || '-' }}
        </v-chip>
      </template>

      <!-- Status Column -->
      <template v-slot:item.isActive="{ item }">
        <v-chip
          :color="item.isActive ? 'success' : 'grey'"
          :prepend-icon="item.isActive ? 'mdi-circle' : 'mdi-circle-outline'"
          variant="tonal"
          size="small"
        >
          {{ item.isActive ? 'Active' : 'Ended' }}
        </v-chip>
      </template>
    </v-data-table-server>
  </v-card>
</template>

<script setup>
defineProps({
  sessions: {
    type: Array,
    default: () => []
  },
  totalItems: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits([
  'update:currentPage',
  'update:itemsPerPage',
  'updateOptions'
]);

// Table Headers
const headers = [
  { title: 'Player', key: 'playerName', sortable: false },
  { title: 'Session Start', key: 'sessionStart', sortable: false },
  { title: 'Session End', key: 'sessionEnd', sortable: false },
  { title: 'Duration', key: 'duration', sortable: false },
  { title: 'Status', key: 'isActive', sortable: false }
];

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

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  
  // Format: DD/MM/YYYY, HH:mm:SS AM/PM
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, '0')
  
  return `${day}/${month}/${year}, ${formattedHours}:${minutes}:${seconds} ${ampm}`
}
</script>