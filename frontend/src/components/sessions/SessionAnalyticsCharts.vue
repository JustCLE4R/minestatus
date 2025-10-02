<template>
  <v-row class="mb-4">
    <!-- Daily Sessions Chart -->
    <v-col cols="12" lg="8">
      <v-card class="chart-card">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ timeFilter === 1 ? 'Hourly Session Activity (24h)' : 'Daily Session Activity' }}</span>
          <v-chip 
            size="small" 
            :color="timeFilter === null ? 'grey' : 'info'" 
            variant="tonal"
          >
            <v-icon start size="small">{{ timeFilter === null ? 'mdi-history' : 'mdi-filter' }}</v-icon>
            {{ timeFilter === null ? 'All time' : timeFilter === 1 ? 'Last 24 hours' : `Last ${timeFilter} days` }}
          </v-chip>
        </v-card-title>
        <v-card-text>
          <div class="chart-container">
            <Line
              v-if="dailyChartData.datasets.length > 0"
              :data="dailyChartData"
              :options="dailyChartOptions"
              :key="dailyChartKey"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 300px;">
              <v-progress-circular indeterminate color="primary" />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Session Duration Distribution -->
    <v-col cols="12" lg="4">
      <v-card class="chart-card">
        <v-card-title>Session Duration Distribution</v-card-title>
        <v-card-text>
          <div class="chart-container">
            <Doughnut
              v-if="durationChartData.datasets.length > 0"
              :data="durationChartData"
              :options="durationChartOptions"
              :key="durationChartKey"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 250px;">
              <v-progress-circular indeterminate color="primary" />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Hourly Activity Heatmap -->
    <v-col cols="12" lg="6">
      <v-card class="chart-card">
        <v-card-title>Hourly Activity Pattern</v-card-title>
        <v-card-text>
          <div class="chart-container">
            <Bar
              v-if="hourlyChartData.datasets.length > 0"
              :data="hourlyChartData"
              :options="hourlyChartOptions"
              :key="hourlyChartKey"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 250px;">
              <v-progress-circular indeterminate color="primary" />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Top Players Chart -->
    <v-col cols="12" lg="6">
      <v-card class="chart-card">
        <v-card-title>Top Players by Total Playtime</v-card-title>
        <v-card-text>
          <div class="chart-container">
            <Bar
              v-if="topPlayersChartData.datasets.length > 0"
              :data="topPlayersChartData"
              :options="topPlayersChartOptions"
              :key="topPlayersChartKey"
            />
            <div v-else class="d-flex align-center justify-center" style="height: 250px;">
              <v-progress-circular indeterminate color="primary" />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

// Props
const props = defineProps({
  timeFilter: {
    type: [Number, null],
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// API Configuration
// const API_BASE = 'https://minestatus-backend.cle4r.my.id/api'
const API_BASE = 'http://localhost:3000/api'

// Reactive data
const chartData = ref({
  daily: [],
  hourly: [],
  duration: [],
  topPlayers: []
})

// Chart keys for forcing re-renders
const dailyChartKey = ref(0)
const durationChartKey = ref(0)
const hourlyChartKey = ref(0)
const topPlayersChartKey = ref(0)

// Color schemes
const colors = {
  primary: '#1976D2',
  secondary: '#424242',
  accent: '#82B1FF',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3'
}

const gradientColors = [
  '#1976D2', '#42A5F5', '#66BB6A', '#FFA726', 
  '#EF5350', '#AB47BC', '#26C6DA', '#FFEE58'
]

// Daily Sessions Chart
const dailyChartData = computed(() => ({
  labels: chartData.value.daily.map(d => {
    // Handle both daily and hourly data formats
    if (props.timeFilter === 1 && d.date.includes(' ')) {
      // Hourly format: "2023-10-02 14:00"
      const [date, time] = d.date.split(' ');
      return time; // Show just the hour
    } else {
      // Daily format: "2023-10-02"
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }),
  datasets: [
    {
      label: 'Sessions',
      data: chartData.value.daily.map(d => d.sessions),
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6
    },
    {
      label: 'Unique Players',
      data: chartData.value.daily.map(d => d.uniquePlayers),
      borderColor: colors.success,
      backgroundColor: colors.success + '20',
      fill: false,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6
    }
  ]
}))

const dailyChartOptions = {
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
      beginAtZero: true,
      grid: {
        color: '#E0E0E0'
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
}

// Duration Distribution Chart
const durationChartData = computed(() => ({
  labels: chartData.value.duration.map(d => d.label),
  datasets: [
    {
      data: chartData.value.duration.map(d => d.count),
      backgroundColor: gradientColors.slice(0, chartData.value.duration.length),
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }
  ]
}))

const durationChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = ((context.raw / total) * 100).toFixed(1)
          return `${context.label}: ${context.raw} (${percentage}%)`
        }
      }
    }
  }
}

// Hourly Activity Chart
const hourlyChartData = computed(() => ({
  labels: chartData.value.hourly.map(d => `${d.hour}:00`),
  datasets: [
    {
      label: 'Session Starts',
      data: chartData.value.hourly.map(d => d.sessions),
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 1
    }
  ]
}))

const hourlyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        title: function(context) {
          return `${context[0].label} - ${(parseInt(context[0].label) + 1)}:00`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#E0E0E0'
      }
    }
  }
}

// Top Players Chart
const topPlayersChartData = computed(() => ({
  labels: chartData.value.topPlayers.map(p => p.playerName),
  datasets: [
    {
      label: 'Total Playtime (hours)',
      data: chartData.value.topPlayers.map(p => p.totalHours),
      backgroundColor: gradientColors.slice(0, chartData.value.topPlayers.length),
      borderWidth: 1,
      borderColor: '#FFFFFF'
    }
  ]
}))

const topPlayersChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `${context.raw.toFixed(1)} hours`
        }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: {
        color: '#E0E0E0'
      }
    },
    y: {
      grid: {
        display: false
      }
    }
  }
}

// API Functions
async function loadChartData() {
  try {
    // Build URL parameters for timeFilter
    const timeParam = props.timeFilter !== null ? `?days=${props.timeFilter}` : ''
    
    // Load daily session data
    const dailyResponse = await fetch(`${API_BASE}/sessions/analytics/daily${timeParam}`)
    const dailyData = await dailyResponse.json()
    if (dailyData.success) {
      chartData.value.daily = dailyData.data
    }

    // Load hourly distribution
    const hourlyResponse = await fetch(`${API_BASE}/sessions/analytics/hourly${timeParam}`)
    const hourlyData = await hourlyResponse.json()
    if (hourlyData.success) {
      chartData.value.hourly = hourlyData.data
    }

    // Load duration distribution
    const durationResponse = await fetch(`${API_BASE}/sessions/analytics/duration${timeParam}`)
    const durationData = await durationResponse.json()
    if (durationData.success) {
      chartData.value.duration = durationData.data
    }

    // Load top players
    const topPlayersParam = props.timeFilter !== null ? `?days=${props.timeFilter}&limit=10` : '?limit=10'
    const topPlayersResponse = await fetch(`${API_BASE}/sessions/analytics/top-players${topPlayersParam}`)
    const topPlayersData = await topPlayersResponse.json()
    if (topPlayersData.success) {
      chartData.value.topPlayers = topPlayersData.data
    }

    // Force chart re-renders
    dailyChartKey.value++
    durationChartKey.value++
    hourlyChartKey.value++
    topPlayersChartKey.value++

  } catch (error) {
    console.error('Error loading chart data:', error)
  }
}

// Watchers
watch(() => props.timeFilter, () => {
  loadChartData()
})

// Lifecycle
onMounted(() => {
  loadChartData()
})

// Expose methods for parent component
defineExpose({
  refreshCharts: loadChartData
})
</script>

<style scoped>
.chart-card {
  height: 100%;
}

.chart-container {
  position: relative;
  height: 300px;
}

.chart-card .v-card-text {
  padding: 16px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .chart-container {
    height: 250px;
  }
}

@media (max-width: 600px) {
  .chart-container {
    height: 200px;
  }
}
</style>