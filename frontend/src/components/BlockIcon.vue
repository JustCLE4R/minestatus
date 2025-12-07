<template>
  <v-tooltip v-if="showName" :text="formattedName" location="top">
    <template #activator="{ props }">
      <v-avatar
        v-bind="props"
        :size="size"
        class="block-icon"
        color="grey-lighten-3"
      >
        <v-img
          :src="imageUrl"
          :alt="block"
          loading="lazy"
          @error="onError"
          cover
        />
      </v-avatar>
    </template>
  </v-tooltip>

  <v-avatar
    v-else
    :size="size"
    class="block-icon"
    color="grey-lighten-3"
  >
    <v-img
      :src="imageUrl"
      :alt="block"
      loading="lazy"
      @error="onError"
      cover
    />
  </v-avatar>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// Props
const props = defineProps({
  block: { type: String, required: true },
  size: { type: [Number, String], default: 48 },
  showName: { type: Boolean, default: true },
  cdnBase: { type: String, default: `${import.meta.env.VITE_API_BASE}/assets/blocks` }
})

// State
const hasError = ref(false)

// Computed image URL
const imageUrl = computed(() => {
  if (hasError.value) return '/assets/blocks/unknown_block.png'
  return `${props.cdnBase}/${props.block.toLocaleLowerCase()}.png` //for some reason its work on windows and doesnt on linux if not toLowerCase
})

// Fallback jika gambar error
function onError() {
  hasError.value = true
}

// Format nama agar rapi di tooltip
const formattedName = computed(() =>
  props.block
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
)
</script>

<style scoped>
.block-icon {
  border-radius: 2px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.block-icon :deep(.v-img__img) {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
