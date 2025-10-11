<template>
  <v-container>
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 400px;">
      <div class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
          class="mb-4"
        />
        <p class="text-h6">Loading building details...</p>
      </div>
    </div>

        <!-- Building Not Found -->
        <v-row v-else-if="!building">
          <v-col cols="12">
            <v-card class="pa-8 text-center" elevation="3">
              <v-icon size="64" color="error" class="mb-4">mdi-home-remove-outline</v-icon>
              <h1 class="text-h4 mb-2">Building Not Found</h1>
              <p class="text-h6 text-medium-emphasis mb-4">
                The building "{{ $route.params.slug }}" could not be found.
              </p>
              <v-btn
                variant="outlined"
                color="primary"
                prepend-icon="mdi-arrow-left"
                @click="goBack"
              >
                Back to Buildings
              </v-btn>
            </v-card>
          </v-col>
        </v-row>

        <!-- Building Content -->
        <div v-else>
          <!-- Back Button -->
          <v-row class="mb-4">
            <v-col cols="12">
              <v-btn
                variant="text"
                color="primary"
                prepend-icon="mdi-arrow-left"
                @click="goBack"
                class="mb-2"
              >
                Back to Buildings
              </v-btn>
            </v-col>
          </v-row>

          <!-- Building Header -->
          <v-row class="mb-4">
            <v-col cols="12">
              <v-card class="pa-6" elevation="3">
                <div class="d-flex justify-space-between align-start">
                  <div class="flex-grow-1">
                    <div class="d-flex align-center mb-2">
                      <h1 class="text-h3 font-weight-bold mr-3">
                        {{ building.metadata.name || building.slug }}
                      </h1>
                      <!-- <div v-if="building.metadata.category" class="d-flex flex-wrap ga-2">
                        <v-chip
                          v-if="Array.isArray(building.metadata.category)"
                          v-for="(cat, index) in building.metadata.category"
                          :key="index"
                          color="primary"
                          variant="elevated"
                          size="small"
                        >
                          {{ cat }}
                        </v-chip>
                        <v-chip
                          v-else
                          color="primary"
                          variant="elevated"
                          size="small"
                        >
                          {{ building.metadata.category }}
                        </v-chip>
                      </div> -->
                    </div>
                    
                    <div class="d-flex align-center flex-wrap">
                      <div v-if="building.metadata.builder" class="d-flex align-center mr-4 mb-1" style="flex-wrap: wrap;">
                        <v-icon size="20" class="mr-1">
                          {{ Array.isArray(building.metadata.builder) && building.metadata.builder.length > 1 ? 'mdi-account-group' : 'mdi-account' }}
                        </v-icon>
                        <span class="text-body-1" style="white-space: normal; word-break: break-word;">
                          Built by 
                          <span v-if="Array.isArray(building.metadata.builder)">
                            <strong v-if="building.metadata.builder.length === 1">{{ building.metadata.builder[0] }}</strong>
                            <span v-else>
                              <strong v-for="(builder, index) in building.metadata.builder" :key="index">
                                {{ builder }}<span v-if="index < building.metadata.builder.length - 1">, </span>
                              </strong>
                            </span>
                          </span>
                          <strong v-else>{{ building.metadata.builder }}</strong>
                        </span>
                      </div>
                      
                      <!-- <div v-if="building.metadata.difficulty" class="d-flex align-center mr-4 mb-1">
                        <v-icon size="20" class="mr-1">mdi-speedometer</v-icon>
                        <v-chip
                          size="small"
                          :color="getDifficultyColor(building.metadata.difficulty)"
                          variant="flat"
                        >
                          {{ building.metadata.difficulty }}
                        </v-chip>
                      </div> -->
                      
                      <div v-if="building.uploadedAt" class="d-flex align-center mb-1">
                        <v-icon size="20" class="mr-1">mdi-calendar</v-icon>
                        <span class="text-body-2 text-medium-emphasis">
                          {{ formatDate(building.uploadedAt) }}
                        </span>
                      </div>
                    </div>

                    <p v-if="building.metadata.description" class="text-h6 text-medium-emphasis mb-0">
                      {{ building.metadata.description }}
                    </p>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Building Images Gallery -->
          <v-row v-if="building.links.images && building.links.images.length > 0" class="mb-4">
            <v-col cols="12">
              <v-card elevation="3" class="pa-2">
                <v-card-title class="d-flex align-center">
                  <v-icon class="mr-2">mdi-image-multiple</v-icon>
                  Gallery ({{ building.links.images.length }} images)
                </v-card-title>
                
                <v-card-text>
                  <v-carousel
                    v-if="building.links.images.length > 1"
                    height="400"
                    show-arrows="hover"
                    cycle
                    interval="5000"
                  >
                    <v-carousel-item
                      v-for="(image, index) in building.links.images"
                      :key="index"
                    >
                      <v-img
                        :src="image"
                        :alt="`${building.metadata.name || building.slug} - Image ${index + 1}`"
                        height="400"
                        cover
                        @click="openImageDialog(image)"
                        style="cursor: pointer;"
                      >
                        <template v-slot:placeholder>
                          <div class="d-flex align-center justify-center fill-height">
                            <v-progress-circular indeterminate color="primary" />
                          </div>
                        </template>
                      </v-img>
                    </v-carousel-item>
                  </v-carousel>
                  
                  <v-img
                    v-else
                    :src="building.links.images[0]"
                    :alt="building.metadata.name || building.slug"
                    height="400"
                    cover
                    @click="openImageDialog(building.links.images[0])"
                    style="cursor: pointer;"
                  >
                    <template v-slot:placeholder>
                      <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular indeterminate color="primary" />
                      </div>
                    </template>
                  </v-img>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Building Content -->
          <v-row class="mb-4">
            <v-col cols="12" lg="8">
              <v-card elevation="3" class="pa-2">
                <v-card-title class="d-flex align-center">
                  <v-icon class="mr-2">mdi-text-box</v-icon>
                  Building Details
                </v-card-title>
                
                <v-card-text>
                  <div 
                    v-if="building.content"
                    class="building-content"
                    v-html="building.content"
                  />
                  <p v-else class="text-medium-emphasis">
                    No detailed description available for this building.
                  </p>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Building Metadata Sidebar -->
            <v-col cols="12" lg="4">
              <v-card elevation="3" class="mb-4">
                <v-card-title class="d-flex align-center pt-3">
                  <v-icon class="mr-2 ml-1">mdi-information</v-icon>
                  Building Information
                </v-card-title>
                
                <v-card-text>
                  <v-list density="comfortable">
                    <!-- Builder Information - Most Important -->
                    <v-list-item v-if="building.metadata.builder" class="mb-2">
                      <template v-slot:prepend>
                        <v-avatar color="primary" size="40">
                          <v-icon color="white">
                            {{ Array.isArray(building.metadata.builder) && building.metadata.builder.length > 1 ? 'mdi-account-group' : 'mdi-account' }}
                          </v-icon>
                        </v-avatar>
                      </template>
                      <v-list-item-title class="text-h6 font-weight-bold" style="white-space: normal; overflow: visible; text-overflow: clip;">
                        <span v-if="Array.isArray(building.metadata.builder)">
                          <span v-if="building.metadata.builder.length === 1">
                            {{ building.metadata.builder[0] }}
                          </span>
                          <span v-else style="line-height: 1.4;">
                            <span v-for="(builder, index) in building.metadata.builder" :key="index">
                              {{ builder }}<span v-if="index < building.metadata.builder.length - 1">, </span>
                            </span>
                          </span>
                        </span>
                        <span v-else>{{ building.metadata.builder }}</span>
                      </v-list-item-title>
                      <v-list-item-subtitle class="text-body-2">
                        {{ Array.isArray(building.metadata.builder) && building.metadata.builder.length > 1 ? 'Builders' : 'Builder' }}
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-divider v-if="building.metadata.builder" class="my-3"></v-divider>

                    <!-- Difficulty and Category - Key Info -->
                    <v-list-item v-if="building.metadata.difficulty" class="mb-1">
                      <template v-slot:prepend>
                        <v-icon color="grey-darken-1">mdi-speedometer</v-icon>
                      </template>
                      <v-list-item-title>Difficulty</v-list-item-title>
                      <v-list-item-subtitle>
                        <v-chip
                          :color="getDifficultyColor(building.metadata.difficulty)"
                          variant="flat"
                          size="small"
                          class="font-weight-bold"
                        >
                          {{ building.metadata.difficulty }}
                        </v-chip>
                      </v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item v-if="building.metadata.category" class="mb-4">
                      <template v-slot:prepend>
                        <v-icon color="grey-darken-1">mdi-tag</v-icon>
                      </template>
                      <v-list-item-title>
                        {{ Array.isArray(building.metadata.category) && building.metadata.category.length > 1 ? 'Categories' : 'Category' }}
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        <div class="d-flex flex-wrap ga-1 mt-1">
                          <div v-if="Array.isArray(building.metadata.category)" class="d-flex flex-wrap ga-1">
                            <v-chip
                              v-for="(cat, index) in building.metadata.category"
                              :key="index"
                              size="small"
                              color="primary"
                              variant="outlined"
                            >
                              {{ cat }}
                            </v-chip>
                          </div>
                          <v-chip
                            v-else
                            size="small"
                            color="primary"
                            variant="outlined"
                          >
                            {{ building.metadata.category }}
                          </v-chip>
                        </div>
                      </v-list-item-subtitle>
                    </v-list-item>

                    <!-- Location Information -->
                    <v-list-item v-if="building.metadata.coordinates" class="mb-4">
                      <template v-slot:prepend>
                        <v-icon color="grey-darken-1">mdi-map-marker</v-icon>
                      </template>
                      <v-list-item-title>Location</v-list-item-title>
                      <v-list-item-subtitle class="font-weight-medium">
                        {{ formatCoordinates(building.metadata.coordinates) }}
                      </v-list-item-subtitle>
                    </v-list-item>

                    <!-- Build Specifications -->
                    <v-list-subheader class="text-h6 font-weight-bold px-0 mt-4 mb-2">
                      Build Specifications
                    </v-list-subheader>
                    
                    <v-list-item v-if="building.metadata.size" class="mb-1">
                      <template v-slot:prepend>
                        <v-icon color="grey-darken-1">mdi-ruler</v-icon>
                      </template>
                      <v-list-item-title>Size</v-list-item-title>
                      <v-list-item-subtitle class="font-weight-medium">
                        {{ formatSize(building.metadata.size) }}
                      </v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item v-if="building.metadata.materials" class="mb-1">
                      <template v-slot:prepend>
                        <v-icon color="grey-darken-1">mdi-package-variant</v-icon>
                      </template>
                      <v-list-item-title>Materials</v-list-item-title>
                      <v-list-item-subtitle class="font-weight-medium">
                        {{ building.metadata.materials }}
                      </v-list-item-subtitle>
                    </v-list-item>

                    <!-- Additional Information -->
                    <v-divider class="my-3"></v-divider>
                    
                    <v-list-item v-if="building.metadata.finished_at" class="mb-1">
                        <template v-slot:prepend>
                        <v-icon color="grey-darken-1">mdi-calendar-check</v-icon>
                        </template>
                        <v-list-item-title>Date Completed</v-list-item-title>
                      <v-list-item-subtitle>{{ formatDate(building.metadata.finished_at) }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item v-if="building.metadata.reference" class="mb-1">
                      <template v-slot:prepend>
                        <v-icon color="grey-darken-1">mdi-link</v-icon>
                      </template>
                      <v-list-item-title>Reference</v-list-item-title>
                      <v-list-item-subtitle>
                        <a 
                          :href="building.metadata.reference" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          class="text-decoration-none text-primary font-weight-medium"
                        >
                          {{ formatReferenceUrl(building.metadata.reference) }}
                          <v-icon size="16" class="ml-1">mdi-open-in-new</v-icon>
                        </a>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>

              <!-- Tags/Keywords -->
              <v-card v-if="building.metadata.tags" elevation="3" class="mb-4">
                <v-card-title class="d-flex align-center">
                  <v-icon class="mr-2">mdi-tag-multiple</v-icon>
                  Tags
                </v-card-title>
                
                <v-card-text>
                  <div class="d-flex flex-wrap ga-2">
                    <v-chip
                      v-for="tag in parseTags(building.metadata.tags)"
                      :key="tag"
                      size="small"
                      color="secondary"
                      variant="outlined"
                    >
                      {{ tag }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Quick Actions -->
              <v-card elevation="3">
                <v-card-title class="d-flex align-center">
                  <v-icon class="mr-2">mdi-lightning-bolt</v-icon>
                  Quick Actions
                </v-card-title>
                
                <v-card-text>
                  <div class="d-flex flex-column ga-2">
                    <v-btn
                      variant="outlined"
                      color="primary"
                      :prepend-icon="shareButtonIcon"
                      @click="shareBuilding"
                      block
                    >
                      {{ shareButtonText }}
                    </v-btn>
                    
                    <v-btn
                      v-if="building.metadata.downloadUrl"
                      variant="outlined"
                      color="success"
                      prepend-icon="mdi-download"
                      :href="building.metadata.downloadUrl"
                      target="_blank"
                      block
                    >
                      Download
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Image Dialog -->
        <v-dialog v-model="imageDialog" max-width="90vw">
          <v-card>
            <v-card-text class="pa-0">
              <v-img
                :src="selectedImage"
                :alt="building?.metadata.name || 'Building image'"
                max-height="80vh"
                contain
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="primary" @click="imageDialog = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

  </v-container>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Composables
const route = useRoute()
const router = useRouter()

// API Configuration
const API_BASE = import.meta.env.VITE_API_BASE || 'https://minestatus-backend.cle4r.my.id'

// Reactive data
const building = ref(null)
const loading = ref(true)
const imageDialog = ref(false)
const selectedImage = ref('')
const shareButtonText = ref('Share Building')
const shareButtonIcon = ref('mdi-share')

// Methods
const loadBuilding = async (slug) => {
  try {
    loading.value = true
    const response = await fetch(`${API_BASE}/api/cms/buildings/${slug}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        building.value = null
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status === 'success') {
      building.value = data.data
    } else {
      throw new Error(data.message || 'Failed to load building')
    }
  } catch (error) {
    console.error('Error loading building:', error)
    building.value = null
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/buildings')
}

const openImageDialog = (imageUrl) => {
  selectedImage.value = imageUrl
  imageDialog.value = true
}

const shareBuilding = async () => {
  const url = window.location.href
  
  try {
    await navigator.clipboard.writeText(url)
    // Show success feedback
    shareButtonText.value = 'Copied!'
    shareButtonIcon.value = 'mdi-check'
    
    // Reset after 2 seconds
    setTimeout(() => {
      shareButtonText.value = 'Share Building'
      shareButtonIcon.value = 'mdi-share'
    }, 2000)
  } catch (error) {
    console.error('Failed to copy link:', error)
    // Show error feedback
    shareButtonText.value = 'Copy Failed'
    shareButtonIcon.value = 'mdi-alert'
    
    // Reset after 2 seconds
    setTimeout(() => {
      shareButtonText.value = 'Share Building'
      shareButtonIcon.value = 'mdi-share'
    }, 2000)
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatCoordinates = (coordinates) => {
  if (!coordinates) return ''
  
  if (Array.isArray(coordinates) && coordinates.length >= 3) {
    const [x, y, z] = coordinates
    return `X: ${x}, Y: ${y}, Z: ${z}`
  }
  
  // Fallback if coordinates is not in expected format
  return coordinates.toString()
}

const formatSize = (size) => {
  if (!size) return ''
  
  // If it's already a string with "blocks" or other units, return as is
  if (typeof size === 'string' && (size.includes('block') || size.includes('x'))) {
    return size
  }
  
  // If it's a number, add "blocks"
  if (typeof size === 'number') {
    return `${size} blocks`
  }
  
  // If it's an array like [length, width, height], format as dimensions
  if (Array.isArray(size) && size.length >= 2) {
    return `${size.join(' × ')} blocks`
  }
  
  // If it's a string without units, add "blocks"
  if (typeof size === 'string' && !isNaN(size)) {
    return `${size} blocks`
  }
  
  // Fallback - add blocks if it doesn't already contain unit info
  return size.toString().includes('block') ? size : `${size} blocks`
}

const formatReferenceUrl = (url) => {
  if (!url) return ''
  
  try {
    const urlObj = new URL(url)
    
    // Special handling for common platforms
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      return 'YouTube Video'
    }
    if (urlObj.hostname.includes('tiktok.com')) {
      return 'TikTok'
    }
    if (urlObj.hostname.includes('github.com')) {
      return 'GitHub Repository'
    }
    if (urlObj.hostname.includes('minecraft.net')) {
      return 'Minecraft Official'
    }
    if (urlObj.hostname.includes('planetminecraft.com')) {
      return 'Planet Minecraft'
    }
    
    // Generic hostname display
    return urlObj.hostname.replace('www.', '')
  } catch (error) {
    // If URL parsing fails, return the original URL
    return url
  }
}

const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'error'
    default: return 'info'
  }
}

const parseTags = (tags) => {
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag)
  }
  return []
}

// Watch for route changes
watch(() => route.params.slug, (newSlug) => {
  if (newSlug) {
    loadBuilding(newSlug)
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (route.params.slug) {
    loadBuilding(route.params.slug)
  }
})

console.log(building)
</script>

<style scoped>
.building-content {
  line-height: 1.6;
}

.building-content :deep(h1),
.building-content :deep(h2),
.building-content :deep(h3),
.building-content :deep(h4),
.building-content :deep(h5),
.building-content :deep(h6) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.building-content :deep(h1) { font-size: 2rem; }
.building-content :deep(h2) { font-size: 1.75rem; }
.building-content :deep(h3) { font-size: 1.5rem; }
.building-content :deep(h4) { font-size: 1.25rem; }
.building-content :deep(h5) { font-size: 1.125rem; }
.building-content :deep(h6) { font-size: 1rem; }

.building-content :deep(p) {
  margin-bottom: 1rem;
}

.building-content :deep(ul),
.building-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.building-content :deep(li) {
  margin-bottom: 0.5rem;
}

.building-content :deep(blockquote) {
  border-left: 4px solid #1976d2;
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  background-color: rgba(25, 118, 210, 0.05);
  border-radius: 0 4px 4px 0;
}

.building-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.building-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1rem 0;
}

.building-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1rem 0;
}
</style>