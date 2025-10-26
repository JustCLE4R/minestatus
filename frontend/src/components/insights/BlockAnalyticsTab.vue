<template>
  <!-- Loading State -->
  <v-row v-if="loading">
    <v-col v-for="i in 4" :key="i" cols="12" md="6" lg="3">
      <v-skeleton-loader type="card"></v-skeleton-loader>
    </v-col>
  </v-row>

  <!-- Summary Cards -->
  <v-row v-else-if="summary" class="mb-6">
    <v-col cols="12" md="6" lg="3">
      <v-card>
        <v-card-text>
          <div class="d-flex align-center">
            <v-avatar color="red" class="mr-3">
              <v-icon icon="mdi-hammer" color="white"></v-icon>
            </v-avatar>
            <div>
              <p class="text-caption text-medium-emphasis mb-1">Total Blocks Broken</p>
              <p class="text-h5 font-weight-bold">{{ formatNumber(summary.breaks.totalBlocks) }}</p>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="6" lg="3">
      <v-card>
        <v-card-text>
          <div class="d-flex align-center">
            <v-avatar color="green" class="mr-3">
              <v-icon icon="mdi-cube-outline" color="white"></v-icon>
            </v-avatar>
            <div>
              <p class="text-caption text-medium-emphasis mb-1">Total Blocks Placed</p>
              <p class="text-h5 font-weight-bold">{{ formatNumber(summary.places.totalBlocks) }}</p>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="6" lg="3">
      <v-card>
        <v-card-text>
          <div class="d-flex align-center">
            <v-avatar color="blue" class="mr-3">
              <v-icon icon="mdi-account-group" color="white"></v-icon>
            </v-avatar>
            <div>
              <p class="text-caption text-medium-emphasis mb-1">Players Recorded</p>
              <p class="text-h5 font-weight-bold">{{ Math.max(summary.breaks.totalPlayers, summary.places.totalPlayers) }}</p>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="6" lg="3">
      <v-card>
        <v-card-text>
          <div class="d-flex align-center">
            <v-avatar color="orange" class="mr-3">
              <v-icon icon="mdi-trophy" color="white"></v-icon>
            </v-avatar>
            <div>
              <p class="text-caption text-medium-emphasis mb-1">Top Player</p>
              <p class="text-h6 font-weight-bold">{{ summary.overall.topPlayer?.playerName || 'N/A' }} <span class="text-caption">{{ formatNumber(summary.overall.topPlayer?.totalBlocks || 0) }} blocks</span></p>
              <!-- <p class="text-caption">{{ formatNumber(summary.overall.topPlayer?.totalBlocks || 0) }} blocks</p> -->
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Top Blocks Section -->
  <v-row class="mb-6">
    <!-- Top Broken Blocks -->
    <v-col cols="12" lg="6">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-hammer" class="mr-2" color="red"></v-icon>
          Most Broken Blocks
        </v-card-title>
        <v-card-text>
          <div v-if="topBrokenBlocks.length === 0" class="text-center py-4">
            <v-icon icon="mdi-information-outline" size="48" class="mb-2 text-medium-emphasis"></v-icon>
            <p class="text-medium-emphasis">No data available</p>
          </div>
          <div v-else>
            <div 
              v-for="(block, index) in topBrokenBlocks" 
              :key="block.blockType"
              class="d-flex align-center mb-3"
            >
              <div class="mr-3 text-h6 font-weight-bold text-medium-emphasis" style="min-width: 24px;">
                {{ index + 1 }}
              </div>
              <BlockIcon 
                :block="block.blockType"
                :size="40"
                :showName="false"
                class="mr-3"
              />
              <div class="flex-grow-1">
                <p class="font-weight-medium mb-1">{{ formatBlockName(block.blockType) }}</p>
                <p class="text-caption text-medium-emphasis">{{ block.playerCount }} players</p>
              </div>
              <div class="text-right">
                <p class="text-h6 font-weight-bold">{{ formatNumber(block.totalCount) }}</p>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Top Placed Blocks -->
    <v-col cols="12" lg="6">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-cube-outline" class="mr-2" color="green"></v-icon>
          Most Placed Blocks
        </v-card-title>
        <v-card-text>
          <div v-if="topPlacedBlocks.length === 0" class="text-center py-4">
            <v-icon icon="mdi-information-outline" size="48" class="mb-2 text-medium-emphasis"></v-icon>
            <p class="text-medium-emphasis">No data available</p>
          </div>
          <div v-else>
            <div 
              v-for="(block, index) in topPlacedBlocks" 
              :key="block.blockType"
              class="d-flex align-center mb-3"
            >
              <div class="mr-3 text-h6 font-weight-bold text-medium-emphasis" style="min-width: 24px;">
                {{ index + 1 }}
              </div>
              <BlockIcon 
                :block="block.blockType"
                :size="40"
                :showName="false"
                class="mr-3"
              />
              <div class="flex-grow-1">
                <p class="font-weight-medium mb-1">{{ formatBlockName(block.blockType) }}</p>
                <p class="text-caption text-medium-emphasis">{{ block.playerCount }} players</p>
              </div>
              <div class="text-right">
                <p class="text-h6 font-weight-bold">{{ formatNumber(block.totalCount) }}</p>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Error State -->
  <v-row v-if="error">
    <v-col cols="12">
      <v-alert type="error" class="mb-4">
        <v-alert-title>Failed to load block analytics</v-alert-title>
        {{ error }}
      </v-alert>
      <v-btn @click="loadData" color="primary">
        <v-icon start icon="mdi-refresh"></v-icon>
        Retry
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BlockIcon from '@/components/BlockIcon.vue'

// State
const loading = ref(true)
const error = ref(null)
const summary = ref(null)
const topBrokenBlocks = ref([])
const topPlacedBlocks = ref([])

// API Base URL
const apiBase = import.meta.env.VITE_API_BASE

// Load block data
async function loadData() {
  loading.value = true
  error.value = null
  
  try {
    // Load summary data
    const summaryResponse = await fetch(`${apiBase}/api/player-metrics/blocks/summary`)
    if (!summaryResponse.ok) throw new Error('Failed to load summary')
    const summaryData = await summaryResponse.json()
    summary.value = summaryData.data

    // Load top broken blocks
    const brokenResponse = await fetch(`${apiBase}/api/player-metrics/blocks/top-blocks?actionType=break&limit=5`)
    if (!brokenResponse.ok) throw new Error('Failed to load top broken blocks')
    const brokenData = await brokenResponse.json()
    topBrokenBlocks.value = brokenData.data.topBlocks

    // Load top placed blocks
    const placedResponse = await fetch(`${apiBase}/api/player-metrics/blocks/top-blocks?actionType=place&limit=5`)
    if (!placedResponse.ok) throw new Error('Failed to load top placed blocks')
    const placedData = await placedResponse.json()
    topPlacedBlocks.value = placedData.data.topBlocks

  } catch (err) {
    error.value = err.message
    console.error('Failed to load block analytics:', err)
  } finally {
    loading.value = false
  }
}

// Format numbers with commas
function formatNumber(num) {
  return new Intl.NumberFormat().format(num)
}

// Format block names (convert SNAKE_CASE to Title Case)
function formatBlockName(blockType) {
  // exclude abbreviation like "TNT"
  const abbreviation = ['TNT']
  if (abbreviation.includes(blockType)) {
    return blockType
  }

  return blockType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Load data on mount
onMounted(() => {
  loadData()
})
</script>