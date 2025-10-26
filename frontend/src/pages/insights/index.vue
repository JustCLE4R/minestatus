<template>
  <v-container>
    <!-- Page Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="pa-6" elevation="3">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <div>
                <h1 class="text-h3 font-weight-bold mb-2">
                  <v-icon icon="mdi-chart-line" size="64" class="mr-3" color="primary"></v-icon>
                  Server Insights
                </h1>
                <p class="text-subtitle-1 text-medium-emphasis">
                  Comprehensive server analytics and statistics
                </p>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <v-tabs v-model="activeTab" class="mb-6" color="primary" grow>
      <v-tab value="blocks">
        <v-icon start icon="mdi-cube-outline"></v-icon>
        Block Analytics
      </v-tab>
      <v-tab value="players">
        <v-icon start icon="mdi-account-group"></v-icon>
        Player Analytics
      </v-tab>
      <v-tab value="overview" disabled>
        <v-icon start icon="mdi-chart-donut"></v-icon>
        Overview
        <v-chip class="ml-2" size="x-small" color="orange">Coming Soon</v-chip>
      </v-tab>
      <v-tab value="settings" disabled>
        <v-icon start icon="mdi-cog-outline"></v-icon>
        Settings
        <v-chip class="ml-2" size="x-small" color="orange">Coming Soon</v-chip>
      </v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Block Analytics Tab -->
      <v-window-item value="blocks">
        <BlockAnalyticsTab />
      </v-window-item>

      <!-- Player Analytics Tab -->
      <v-window-item value="players">
        <PlayerAnalyticsTab />
      </v-window-item>

      <!-- Overview Tab -->
      <v-window-item value="overview">
        <OverviewTab />
      </v-window-item>

      <!-- Settings Tab -->
      <v-window-item value="settings">
        <OverviewTab />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import BlockAnalyticsTab from '@/components/insights/BlockAnalyticsTab.vue'
import PlayerAnalyticsTab from '@/components/insights/PlayerAnalyticsTab.vue'
import OverviewTab from '@/components/insights/OverviewTab.vue'

// State
const activeTab = ref('blocks')
</script>