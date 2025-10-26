import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSocketStore = defineStore('socket', () => {
  // State
  const playersData = ref(null)
  const skillsData = ref(null)
  const logs = ref([])
  const isConnected = ref(false)

  // Actions
  function updatePlayers(data) {
    playersData.value = data
  }

  function updateSkills(data) {
    skillsData.value = data
  }

  function addLog(line) {
    logs.value.push(line)
    if (logs.value.length > 200) {
      logs.value.shift() // keep only last 200 lines
    }
  }

  function setConnectionStatus(status) {
    isConnected.value = status
  }

  function clearLogs() {
    logs.value = []
  }

  // Getters
  const playerCount = computed(() => playersData.value?.total || 0)
  const playersList = computed(() => playersData.value?.players || [])
  const playersWithSessions = computed(() => playersData.value?.playersWithSessions || [])
  const skills = computed(() => skillsData.value?.skills || [])

  return {
    // State
    playersData,
    skillsData, 
    logs,
    isConnected,
    
    // Actions
    updatePlayers,
    updateSkills,
    addLog,
    setConnectionStatus,
    clearLogs,
    
    // Getters
    playerCount,
    playersList,
    playersWithSessions,
    skills
  }
})