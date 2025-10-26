<template>
  <v-app>
    <AppNavigation />
    <v-main>
      <router-view />
    </v-main>
    
    <!-- Global Toast Notifications -->
    <ToastNotifications :toasts="toasts" />
  </v-app>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { io } from 'socket.io-client'
import { useRoute } from 'vue-router'
import AppNavigation from '@/components/AppNavigation.vue'
import ToastNotifications from '@/components/ToastNotifications.vue'
import { useToasts } from '@/composables/useToasts'
import { usePlayerNotifications } from '@/composables/usePlayerNotifications'
import { useSocketStore } from '@/stores/socket'

// Use composables and stores
const { toasts } = useToasts()
const { handlePlayersUpdate } = usePlayerNotifications()
const socketStore = useSocketStore()

// Route and socket
const route = useRoute()
let socket = null

// API Configuration
const API_BASE = import.meta.env.VITE_API_BASE || 'https://minestatus-backend.cle4r.my.id'

// Update page title based on player count and current route
function updatePageTitle() {
  const playerText = socketStore.playerCount === 1 ? "Player" : "Players"
  const baseTitle = `Minestatus | ${socketStore.playerCount} ${playerText} Online`
  
  // Add route-specific suffix if needed
  let routeTitle = ''
  switch (route.name) {
    case 'sessions':
      routeTitle = ' - Sessions'
      break
    case 'insights':
      routeTitle = ' - Server Insights'
      break
    case 'buildings':
      routeTitle = ' - Buildings'
      break
    case 'building':
      routeTitle = ' - Building Guide'
      break
    default:
      routeTitle = ''
  }
  
  document.title = baseTitle + routeTitle
}

// Watch for changes in player count or route
watch([() => socketStore.playerCount, () => route.name], updatePageTitle, { immediate: true })

// Socket.IO connection and event handlers
onMounted(() => {
  socket = io(API_BASE)

  socket.on('connect', () => {
    socketStore.setConnectionStatus(true)
  })

  socket.on('disconnect', () => {
    socketStore.setConnectionStatus(false)
  })

  socket.on("players:update", (data) => {
    // Handle player notifications using composable
    handlePlayersUpdate(data)
    
    // Update store with player data
    socketStore.updatePlayers(data)
  })

  socket.on("skills:update", (data) => {
    // Update store with skills data
    socketStore.updateSkills(data)
  })

  socket.on("server:log", (line) => {
    // Add log to store
    socketStore.addLog(line)
  })
})

// Cleanup on unmount
onBeforeUnmount(() => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
})
</script>
