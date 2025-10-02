<template>
  <v-app>
    <v-main>
      <v-container>
        <!-- Page Header -->
        <SessionPageHeader :realTimeUpdates="realTimeUpdates" />

        <!-- Statistics Cards -->
        <SessionStatisticsCards 
          :stats="stats" 
          :activeSessionsCount="activeSessionsCount" 
        />

        <!-- Filters and Controls -->
        <SessionFilters
          v-model:playerFilter="playerFilter"
          v-model:timeFilter="timeFilter"
          v-model:activeOnly="activeOnly"
          v-model:realTimeUpdates="realTimeUpdates"
          :loading="loading"
          @refresh="refreshAll"
          @playerFilterChange="loadSessions(1)"
          @update:timeFilter="onTimeFilterChange"
          @update:activeOnly="loadSessions(1)"
        />

        <!-- Sessions Table -->
        <SessionsTable
          :sessions="sessions"
          :totalItems="totalItems"
          :currentPage="currentPage"
          :itemsPerPage="itemsPerPage"
          :loading="loading"
          :timeFilter="timeFilter"
          @update:currentPage="currentPage = $event"
          @update:itemsPerPage="itemsPerPage = $event"
          @updateOptions="loadSessions"
        />

        <!-- Session Analytics Charts -->
        <SessionAnalyticsCharts 
          ref="chartsComponent"
          :timeFilter="timeFilter"
          :loading="loading"
        />

        <!-- Toast Notifications -->
        <ToastNotifications :toasts="toasts" />

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

// Import composables
import { useToasts } from '../composables/useToasts'
import { usePlayerNotifications } from '../composables/usePlayerNotifications'

// Import components
import SessionPageHeader from '../components/sessions/SessionPageHeader.vue'
import SessionStatisticsCards from '../components/sessions/SessionStatisticsCards.vue'
import SessionFilters from '../components/sessions/SessionFilters.vue'
import SessionsTable from '../components/sessions/SessionsTable.vue'
import SessionAnalyticsCharts from '../components/sessions/SessionAnalyticsCharts.vue'
import ToastNotifications from '../components/ToastNotifications.vue'

// Use composables
const { toasts } = useToasts()
const { handlePlayersUpdate } = usePlayerNotifications()

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

// Component references
const chartsComponent = ref(null)

// Filters
const playerFilter = ref('')
const timeFilter = ref(null) // Default to "All time"
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

// Watch for filter changes to reset pagination
watch([timeFilter, playerFilter, activeOnly], () => {
  currentPage.value = 1;
}, { deep: true });

// Utility Functions
function showError(message) {
  errorMessage.value = message
  errorSnackbar.value = true
}

// API Functions
async function loadStats() {
  try {
    // Build URL with days parameter only if timeFilter is not null
    let statsUrl = `${API_BASE}/sessions/stats`
    if (timeFilter.value !== null) {
      statsUrl += `?days=${timeFilter.value}`
    }
    
    const response = await fetch(statsUrl)
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
    if (timeFilter.value !== null) url += `&days=${timeFilter.value}` // Only add days filter if not "All time"

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

// Handle time filter changes - refresh both stats, sessions, and charts
async function onTimeFilterChange() {
  await Promise.all([
    loadStats(),
    loadSessions(1) // Reset to first page when filter changes
  ])
}

async function refreshAll() {
  await Promise.all([
    loadStats(),
    loadSessions()
  ])
  
  // Refresh charts if component is available
  if (chartsComponent.value) {
    chartsComponent.value.refreshCharts()
  }
}

// Lifecycle
onMounted(() => {
  refreshAll()
  
  // Initialize Socket.IO connection for real-time updates
  const socket = io(API_BASE.replace('/api', ''))
  
  // Listen for player updates to refresh session data
  socket.on('players:update', (data) => {
    // Handle player notifications using composable
    handlePlayersUpdate(data)
    
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