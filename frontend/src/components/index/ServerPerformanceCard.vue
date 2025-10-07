<template>
  <v-row class="mb-4">
    <!-- Server Health Overview -->
    <v-col cols="12">
      <v-card class="performance-card">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Server Performance</span>
          <div class="d-flex align-center gap-2">
            <v-chip 
              :color="healthStatusColor" 
              size="small" 
              variant="tonal"
            >
              <v-icon start size="small">{{ healthStatusIcon }}</v-icon>
              {{ healthStatus }}
            </v-chip>
            <v-btn 
              icon="mdi-refresh" 
              size="small" 
              variant="text"
              :loading="loading"
              @click="refreshPerformance"
            />
          </div>
        </v-card-title>
        <v-card-text>
          <v-row>
            <!-- Current Metrics Cards -->
            <v-col cols="12" sm="6" md="3">
              <v-card variant="outlined" class="metric-card">
                <v-card-text class="text-center">
                  <div class="metric-value" :class="tpsColor">
                    {{ currentMetrics?.tps?.oneMinute?.toFixed(2) || 'N/A' }}
                  </div>
                  <div class="metric-label">TPS (1m)</div>
                  <v-progress-linear
                    :model-value="tpsPercentage"
                    :color="tpsColor"
                    height="4"
                    class="mt-2"
                  />
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-card variant="outlined" class="metric-card">
                <v-card-text class="text-center">
                  <div class="metric-value" :class="cpuColor">
                    {{ currentMetrics?.cpu?.process?.toFixed(1) || 'N/A' }}%
                  </div>
                  <div class="metric-label">CPU Usage</div>
                  <v-progress-linear
                    :model-value="currentMetrics?.cpu?.process || 0"
                    :color="cpuColor"
                    height="4"
                    class="mt-2"
                  />
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-card variant="outlined" class="metric-card">
                <v-card-text class="text-center">
                  <div class="metric-value" :class="memoryColor">
                    {{ currentMetrics?.memory?.usedPercentage || 'N/A' }}%
                  </div>
                  <div class="metric-label">Memory Usage</div>
                  <v-progress-linear
                    :model-value="currentMetrics?.memory?.usedPercentage || 0"
                    :color="memoryColor"
                    height="4"
                    class="mt-2"
                  />
                  <div class="metric-details">
                    {{ currentMetrics?.memory?.used || 'N/A' }}M / {{ currentMetrics?.memory?.allocated || 'N/A' }}M
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-card variant="outlined" class="metric-card">
                <v-card-text class="text-center">
                  <div class="metric-value" :class="msptColor">
                    {{ currentMetrics?.mspt?.fiveSecond?.avg?.toFixed(2) || 'N/A' }}
                  </div>
                  <div class="metric-label">MSPT (5s avg)</div>
                  <v-progress-linear
                    :model-value="msptPercentage"
                    :color="msptColor"
                    height="4"
                    class="mt-2"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Health Issues -->
          <v-alert
            v-if="healthData?.issues?.length > 0"
            type="warning"
            variant="tonal"
            class="mt-4"
          >
            <v-alert-title>Performance Issues Detected</v-alert-title>
            <ul class="mt-2">
              <li v-for="issue in healthData.issues" :key="issue">{{ issue }}</li>
            </ul>
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Performance Charts -->
    <v-col cols="12" lg="8">
      <v-card class="performance-card">
        <v-card-title>Performance History (24h)</v-card-title>
        <v-card-text>
          <div class="chart-container">
            <Line
              v-if="performanceChartData.datasets.length > 0"
              :data="performanceChartData"
              :options="performanceChartOptions"
              :key="performanceChartKey"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 300px;">
              <v-progress-circular indeterminate color="primary" />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Performance Statistics -->
    <v-col cols="12" lg="4">
      <v-card class="performance-card">
        <v-card-title>24h Statistics</v-card-title>
        <v-card-text>
          <div v-if="performanceStats" class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Average TPS</div>
              <div class="stat-value">{{ performanceStats.averageTps }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Min TPS</div>
              <div class="stat-value" :class="performanceStats.minTps < 18 ? 'text-error' : ''">
                {{ performanceStats.minTps }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Lag Spikes</div>
              <div class="stat-value" :class="performanceStats.lagSpikes > 0 ? 'text-warning' : 'text-success'">
                {{ performanceStats.lagSpikes }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Uptime</div>
              <div class="stat-value">{{ performanceStats.uptimePercentage }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Avg CPU</div>
              <div class="stat-value">{{ performanceStats.averageCpu }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Peak Memory</div>
              <div class="stat-value">{{ performanceStats.maxMemoryUsage }}%</div>
            </div>
          </div>
          <div v-else class="d-flex align-center justify-center" style="height: 200px;">
            <v-progress-circular indeterminate color="primary" />
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// API Configuration
// const API_BASE = 'https://minestatus-backend.cle4r.my.id/api'
const API_BASE = 'http://localhost:3000/api'

// Reactive data
const loading = ref(false)
const currentMetrics = ref(null)
const healthData = ref(null)
const performanceHistory = ref([])
const performanceStats = ref(null)
const performanceChartKey = ref(0)
const refreshInterval = ref(null)

// Computed properties for health status
const healthStatus = computed(() => {
  if (!healthData.value) return 'Unknown'
  return healthData.value.status.charAt(0).toUpperCase() + healthData.value.status.slice(1)
})

const healthStatusColor = computed(() => {
  const status = healthData.value?.status
  switch (status) {
    case 'excellent': return 'success'
    case 'warning': return 'warning'
    case 'critical': return 'error'
    default: return 'grey'
  }
})

const healthStatusIcon = computed(() => {
  const status = healthData.value?.status
  switch (status) {
    case 'excellent': return 'mdi-check-circle'
    case 'warning': return 'mdi-alert'
    case 'critical': return 'mdi-alert-circle'
    default: return 'mdi-help-circle'
  }
})

// Computed properties for metric colors
const tpsColor = computed(() => {
  const tps = currentMetrics.value?.tps?.oneMinute
  if (!tps) return 'grey'
  if (tps < 15) return 'error'
  if (tps < 18) return 'warning'
  return 'success'
})

const tpsPercentage = computed(() => {
  const tps = currentMetrics.value?.tps?.oneMinute
  return tps ? Math.min((tps / 20) * 100, 100) : 0
})

const cpuColor = computed(() => {
  const cpu = currentMetrics.value?.cpu?.process
  if (!cpu) return 'grey'
  if (cpu > 80) return 'error'
  if (cpu > 60) return 'warning'
  return 'success'
})

const memoryColor = computed(() => {
  const memory = currentMetrics.value?.memory?.usedPercentage
  if (!memory) return 'grey'
  if (memory > 90) return 'error'
  if (memory > 75) return 'warning'
  return 'success'
})

const msptColor = computed(() => {
  const mspt = currentMetrics.value?.mspt?.fiveSecond?.avg
  if (!mspt) return 'grey'
  if (mspt > 100) return 'error'
  if (mspt > 50) return 'warning'
  return 'success'
})

const msptPercentage = computed(() => {
  const mspt = currentMetrics.value?.mspt?.fiveSecond?.avg
  return mspt ? Math.min((mspt / 50) * 100, 100) : 0
})

// Chart configuration
const performanceChartData = computed(() => ({
  labels: performanceHistory.value.map(entry => {
    const date = new Date(entry.timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }),
  datasets: [
    {
      label: 'TPS',
      data: performanceHistory.value.map(entry => entry.tps.oneMinute),
      borderColor: '#4CAF50',
      backgroundColor: '#4CAF5020',
      fill: false,
      tension: 0.3,
      pointRadius: 2,
      yAxisID: 'y'
    },
    {
      label: 'CPU %',
      data: performanceHistory.value.map(entry => entry.cpu.process),
      borderColor: '#FF9800',
      backgroundColor: '#FF980020',
      fill: false,
      tension: 0.3,
      pointRadius: 2,
      yAxisID: 'y1'
    },
    {
      label: 'Memory %',
      data: performanceHistory.value.map(entry => entry.memory.usedPercentage),
      borderColor: '#2196F3',
      backgroundColor: '#2196F320',
      fill: false,
      tension: 0.3,
      pointRadius: 2,
      yAxisID: 'y1'
    }
  ]
}))

const performanceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      min: 0,
      max: 20,
      title: {
        display: true,
        text: 'TPS'
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      min: 0,
      max: 100,
      title: {
        display: true,
        text: 'Percentage (%)'
      },
      grid: {
        drawOnChartArea: false
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
}

// API functions
async function loadCurrentMetrics() {
  try {
    const response = await fetch(`${API_BASE}/performance/current`)
    const data = await response.json()
    if (data.success) {
      currentMetrics.value = data.data.current
      healthData.value = data.data.health
    }
  } catch (error) {
    console.error('Error loading current performance metrics:', error)
  }
}

async function loadPerformanceHistory() {
  try {
    const response = await fetch(`${API_BASE}/performance/history?hours=24`)
    const data = await response.json()
    if (data.success) {
      performanceHistory.value = data.data
      performanceChartKey.value++
    }
  } catch (error) {
    console.error('Error loading performance history:', error)
  }
}

async function loadPerformanceStats() {
  try {
    const response = await fetch(`${API_BASE}/performance/stats?hours=24`)
    const data = await response.json()
    if (data.success) {
      performanceStats.value = data.data
    }
  } catch (error) {
    console.error('Error loading performance stats:', error)
  }
}

async function refreshPerformance() {
  loading.value = true
  try {
    // Refresh current data from server
    const response = await fetch(`${API_BASE}/performance/refresh`, {
      method: 'POST'
    })
    const data = await response.json()
    
    if (data.success) {
      // Reload all data
      await Promise.all([
        loadCurrentMetrics(),
        loadPerformanceHistory(),
        loadPerformanceStats()
      ])
    }
  } catch (error) {
    console.error('Error refreshing performance data:', error)
  } finally {
    loading.value = false
  }
}

async function loadAllData() {
  await Promise.all([
    loadCurrentMetrics(),
    loadPerformanceHistory(),
    loadPerformanceStats()
  ])
}

// Lifecycle
onMounted(() => {
  loadAllData()
  
  // Auto-refresh every 5 minutes
  refreshInterval.value = setInterval(() => {
    loadAllData()
  }, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

// Expose methods for parent component
defineExpose({
  refresh: loadAllData
})
</script>

<style scoped>
.performance-card {
  height: 100%;
}

.chart-container {
  position: relative;
  height: 300px;
}

.metric-card {
  height: 100%;
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
}

.metric-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
}

.metric-details {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
}

.text-success {
  color: rgb(var(--v-theme-success));
}

.text-warning {
  color: rgb(var(--v-theme-warning));
}

.text-error {
  color: rgb(var(--v-theme-error));
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .chart-container {
    height: 250px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>