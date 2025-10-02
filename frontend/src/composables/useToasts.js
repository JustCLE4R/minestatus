import { ref } from 'vue'

// Global toast state and management
const toasts = ref([])
let toastId = 0

export function useToasts() {
  // Add a new toast notification
  function addToast(message, color = "primary") {
    const id = ++toastId;
    const toast = { id, message, color, show: true };
    toasts.value.push(toast);
    
    // Auto-remove toast after 3.2 seconds
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 3200);
  }

  // Clear all toasts
  function clearToasts() {
    toasts.value = [];
  }

  // Remove specific toast by id
  function removeToast(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    addToast,
    clearToasts,
    removeToast
  }
}