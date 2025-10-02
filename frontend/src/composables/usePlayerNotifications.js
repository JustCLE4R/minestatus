import { ref } from 'vue'
import { useToasts } from './useToasts'

export function usePlayerNotifications() {
  const { addToast } = useToasts()
  
  const previousPlayers = ref([])
  let initialized = false

  // Handle player updates and show appropriate toast notifications
  function handlePlayersUpdate(data) {
    // Extract players array from data object
    const newPlayers = data.players || [];
    const oldPlayers = previousPlayers.value;
    
    // Show toast notifications for joins/leaves (only after first initialization)
    if (initialized) {
      const joined = newPlayers.filter((p) => !oldPlayers.includes(p));
      const left = oldPlayers.filter((p) => !newPlayers.includes(p));

      joined.forEach((p) => addToast(`${p} joined the game`, "green"));
      left.forEach((p) => addToast(`${p} left the game`, "red"));
    } else {
      initialized = true; // first update = baseline, no toasts
    }
    
    // Update previous players list
    previousPlayers.value = [...newPlayers];
  }

  // Reset the notification state (useful for cleanup or re-initialization)
  function resetNotifications() {
    previousPlayers.value = []
    initialized = false
  }

  return {
    previousPlayers,
    handlePlayersUpdate,
    resetNotifications
  }
}