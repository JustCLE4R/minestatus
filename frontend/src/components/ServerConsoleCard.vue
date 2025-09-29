<template>
  <v-card class="mb-4">
    <v-card-title>Server Console</v-card-title>
    <v-card-text class="console-log">
      <div v-for="(line, idx) in logs" :key="idx" class="log-line">
        {{ line }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { nextTick, watch } from 'vue';

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  }
});

// Auto-scroll to bottom when logs update
watch(() => props.logs, () => {
  nextTick(() => {
    const el = document.querySelector(".console-log");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  });
}, { deep: true });
</script>

<style scoped>
.console-log {
  background: #111;
  color: #0f0;
  font-family: monospace;
  max-height: 300px;
  overflow-y: auto;
}
.log-line {
  white-space: pre-wrap;
}
</style>