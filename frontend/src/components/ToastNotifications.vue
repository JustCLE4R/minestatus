<template>
  <div class="fixed top-4 right-4 space-y-2">
    <v-snackbar
      v-for="(toast, index) in toasts"
      :key="toast.id"
      v-model="toast.show"
      :timeout="6000"
      :color="toast.color"
      location="top right"
    >
      {{ toast.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
defineProps({
  toasts: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
.fixed {
  position: fixed;
}
.top-4 {
  top: 1rem;
}
.right-4 {
  right: 1rem;
}
.space-y-2 > * + * {
  margin-top: 0.5rem;
}
</style>