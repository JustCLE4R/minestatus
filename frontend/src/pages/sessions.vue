<template>
  <v-app>
    <v-main>
      <v-container>
        <!-- Page Header -->
        <v-row class="mb-6">
          <v-col cols="12">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-btn
                  icon
                  variant="text"
                  to="/"
                  class="mr-3"
                  size="large"
                >
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <div>
                  <h1 class="text-h4 font-weight-bold mb-2">
                    🎮 Player Session History
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
          </v-col>
        </v-row>

        <!-- Statistics Cards -->
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

        <!-- Filters and Controls -->
        <v-card class="mb-6">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="playerFilter"
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
                  v-model="timeFilter"
                  hide-details
                  :items="timeFilterOptions"
                  label="Time Period"
                  variant="outlined"
                  density="compact"
                  @update:model-value="loadStats"
                />
              </v-col>

              <v-col cols="6" md="2">
                <v-switch
                  v-model="activeOnly"
                  hide-details
                  label="Active only"
                  color="primary"
                  @update:model-value="loadSessions(1)"
                />
              </v-col>

              <v-col cols="6" md="2">
                <v-switch
                  v-model="realTimeUpdates"
                  hide-details
                  label="Real-time"
                  color="success"
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-btn
                  @click="refreshAll"
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

        <!-- Sessions Table -->
        <v-card>
          <v-card-title>
            Session History
          </v-card-title>

          <v-data-table-server
            v-model:items-per-page="itemsPerPage"
            v-model:page="currentPage"
            :headers="headers"
            :items="sessions"
            :items-length="totalItems"
            :loading="loading"
            :no-data-text="sessions.length === 0 ? 'No sessions found' : 'Loading...'"
            @update:options="loadSessions"
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

        <!-- Loading Overlay -->
        <v-overlay
          v-model="loading"
          class="align-center justify-center"
          contained
        >
          <v-progress-circular
            color="primary"
            indeterminate
            size="64"
          />
        </v-overlay>

        <!-- Error Snackbar -->
        <v-snackbar
          v-model="errorSnackbar"
          color="error"
          timeout="5000"
        >
          {{ errorMessage }}
          <template v-slot:actions>
            <v-btn
              variant="text"
              @click="errorSnackbar = false"
            >
              Close
            </v-btn>
          </template>
        </v-snackbar>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { io } from 'socket.io-client'

// API Configuration
const API_BASE = 'https://minestatus-backend.cle4r.my.id/api'
// const API_BASE = 'http://localhost:3000/api' 

// Socket.IO connection
let socket = null

// Reactive Data
const total = ref(0);
const sessions = ref([])
const stats = ref({})
const activeSessionsCount = ref(0)
const loading = ref(false)
const errorSnackbar = ref(false)
const errorMessage = ref('')
const realTimeUpdates = ref(true) // Track if real-time updates are enabled

// Filters
const playerFilter = ref('')
const timeFilter = ref(30)
const activeOnly = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)

// Update page title based on player count
watch(
  total,
  (newTotal) => {
    const playerText = newTotal === 1 ? "Player" : "Players";
    document.title = `Minestatus | ${newTotal} ${playerText} Online`;
  },
  { immediate: true }
);

// Table Headers
const headers = [
  { title: 'Player', key: 'playerName', sortable: false },
  { title: 'Session Start', key: 'sessionStart', sortable: false },
  { title: 'Session End', key: 'sessionEnd', sortable: false },
  { title: 'Duration', key: 'duration', sortable: false },
  { title: 'Status', key: 'isActive', sortable: false }
]

// Time Filter Options
const timeFilterOptions = [
  { title: 'Last 7 days', value: 7 },
  { title: 'Last 30 days', value: 30 },
  { title: 'Last 90 days', value: 90 }
]

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

function showError(message) {
  errorMessage.value = message
  errorSnackbar.value = true
}

// Debounce function for search input
let debounceTimer = null
function onPlayerFilterChange() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadSessions(1)
  }, 500)
}

// API Functions
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/sessions/stats?days=${timeFilter.value}`)
    const data = await response.json()
    
    if (data.success) {
      stats.value = data.data.stats
    } else {
      showError('Failed to load statistics: ' + data.error)
    }

    // Load active sessions count
    const activeResponse = await fetch(`${API_BASE}/sessions/active`)
    const activeData = await activeResponse.json()
    if (activeData.success) {
      activeSessionsCount.value = activeData.data.count
    } else {
      showError('Failed to load active sessions: ' + activeData.error)
    }
  } catch (error) {
    console.error('Error loading stats:', error)
    showError('Error loading statistics: ' + error.message)
  }
}

async function loadSessions(options = null) {
  try {
    loading.value = true
    
    // Handle different call patterns
    let page = currentPage.value
    let limit = itemsPerPage.value
    
    if (options && typeof options === 'object' && options.page) {
      // Called from v-data-table-server with options object
      page = options.page
      limit = options.itemsPerPage
    } else if (typeof options === 'number') {
      // Called manually with page number
      page = options
    }
    
    // Handle "All" items per page case - convert -1 or negative values to a large number
    if (limit <= 0) {
      limit = 10000; // Use a large number instead of -1
    }
    
    let url = `${API_BASE}/sessions?page=${page}&limit=${limit}`
    if (playerFilter.value) url += `&playerName=${encodeURIComponent(playerFilter.value)}`
    if (activeOnly.value) url += `&activeOnly=true`

    const response = await fetch(url)
    const data = await response.json()
    
    if (data.success) {
      sessions.value = data.data.sessions
      totalItems.value = data.data.pagination.total
      currentPage.value = data.data.pagination.page
    } else {
      showError('Failed to load sessions: ' + data.error)
    }
  } catch (error) {
    console.error('Error loading sessions:', error)
    showError('Error loading sessions: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function refreshAll() {
  await Promise.all([
    loadStats(),
    loadSessions()
  ])
}

// Lifecycle
onMounted(() => {
  refreshAll()
  
  // Initialize Socket.IO connection for real-time updates
  socket = io(API_BASE.replace('/api', ''))
  
  // Listen for player updates to refresh session data
  socket.on('players:update', (data) => {
    total.value = data.total;
    // Only refresh if real-time updates are enabled
    if (realTimeUpdates.value) {
      // Refresh stats and sessions when players join/leave
      loadStats()
      
      // Only refresh sessions if we're viewing active sessions or recent data
      if (activeOnly.value || currentPage.value === 1) {
        loadSessions()
      }
    }
  })
})

// Cleanup
onBeforeUnmount(() => {
  // Disconnect socket
  if (socket) {
    socket.disconnect()
    socket = null
  }
  
  // Clear debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
})
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.text-h4 {
  line-height: 1.2;
}
</style>