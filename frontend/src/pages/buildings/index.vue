<template>
  <v-container>
    <!-- Page Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="pa-6" elevation="3">
          <div class="d-flex justify-space-between align-center">
            <div>
              <h1 class="text-h3 font-weight-bold mb-2">
                <v-icon icon="mdi-crane" size="64" class="mr-3" color="primary"></v-icon>
                Buildings Gallery
              </h1>
              <p class="text-subtitle-1 text-medium-emphasis">
                Explore amazing builds from our community
              </p>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

        <!-- Search and Filters -->
        <v-row class="mb-4">
          <v-col cols="12" md="8">
            <v-text-field
              v-model="searchQuery"
              label="Search buildings..."
              placeholder="Search by name, builder, category, or content"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              clearable
              @input="onSearchChange"
              :loading="searchLoading"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedCategory"
              label="Category"
              :items="categories"
              variant="outlined"
              clearable
              prepend-inner-icon="mdi-tag"
              @update:model-value="onCategoryChange"
            />
          </v-col>
        </v-row>

        <!-- Building Stats -->
        <v-row class="mb-4" v-if="!loading">
          <v-col cols="12">
            <v-card class="pa-4" elevation="2">
              <div class="d-flex justify-space-around text-center">
                <div>
                  <div class="text-h4 font-weight-bold primary--text">{{ filteredBuildings.length }}</div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ searchQuery || selectedCategory ? 'Filtered' : 'Total' }} Buildings
                  </div>
                </div>
                <div>
                  <div class="text-h4 font-weight-bold success--text">{{ uniqueBuilders.length }}</div>
                  <div class="text-body-2 text-medium-emphasis">Builders</div>
                </div>
                <div>
                  <div class="text-h4 font-weight-bold info--text">{{ uniqueCategories.length }}</div>
                  <div class="text-body-2 text-medium-emphasis">Categories</div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Buildings Grid -->
        <v-row v-if="!loading">
          <v-col
            v-for="building in paginatedBuildings"
            :key="building.slug"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card
              class="building-card"
              elevation="2"
              hover
              @click="goToBuildingDetail(building.slug)"
              style="cursor: pointer; height: 100%;"
            >
              <!-- Building Image -->
              <div class="image-container">
                <v-img
                  :src="building.thumbnail || '/placeholder-building.jpg'"
                  :alt="building.name || building.slug"
                  height="200"
                  cover
                  class="building-image"
                >
                  <template v-slot:placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                      <v-icon size="64" color="grey-lighten-2">mdi-home-outline</v-icon>
                    </div>
                  </template>
                </v-img>
                
                <!-- Category Badges -->
                <div v-if="building.category" class="category-chips">
                  <v-chip
                    v-if="Array.isArray(building.category)"
                    v-for="(cat, index) in building.category"
                    :key="index"
                    class="category-chip"
                    size="small"
                    color="primary"
                    variant="elevated"
                  >
                    {{ cat }}
                  </v-chip>
                  <v-chip
                    v-else
                    class="category-chip"
                    size="small"
                    color="primary"
                    variant="elevated"
                  >
                    {{ building.category }}
                  </v-chip>
                </div>
              </div>

              <!-- Building Info -->
              <v-card-text class="pb-2">
                <h3 class="text-h6 font-weight-bold mb-1 text-truncate">
                  {{ building.name || building.slug }}
                </h3>
                
                <div class="d-flex align-center mb-2" v-if="building.builder">
                  <v-icon size="16" class="mr-1">
                    {{ Array.isArray(building.builder) && building.builder.length > 1 ? 'mdi-account-group' : 'mdi-account' }}
                  </v-icon>
                  <span class="text-body-2 text-medium-emphasis text-truncate">
                    <span v-if="Array.isArray(building.builder)">
                      <span v-if="building.builder.length === 1">{{ building.builder[0] }}</span>
                      <span v-else>
                        <span v-for="(builder, index) in building.builder" :key="index">
                          {{ builder }}<span v-if="index < building.builder.length - 1">, </span>
                        </span>
                      </span>
                    </span>
                    <span v-else>{{ building.builder }}</span>
                  </span>
                </div>

                <p class="text-body-2 text-medium-emphasis mb-0 building-description">
                    <span v-html="building.summary || 'No description available.'"></span>
                </p>
              </v-card-text>

              <!-- Building Footer -->
              <v-card-actions class="pt-0">
                <v-chip
                  v-if="building.difficulty"
                  size="x-small"
                  :color="getDifficultyColor(building.difficulty)"
                  variant="flat"
                >
                  {{ building.difficulty }}
                </v-chip>
                
                <v-spacer />
                
                <v-btn
                  size="small"
                  variant="text"
                  color="primary"
                  append-icon="mdi-arrow-right"
                >
                  View Details
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- Empty State -->
        <v-row v-if="!loading && filteredBuildings.length === 0">
          <v-col cols="12">
            <v-card class="pa-8 text-center" elevation="2">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-home-search-outline</v-icon>
              <h2 class="text-h5 mb-2">No Buildings Found</h2>
              <p class="text-body-1 text-medium-emphasis mb-4">
                {{ searchQuery || selectedCategory 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No buildings have been added yet.' 
                }}
              </p>
              <v-btn
                v-if="searchQuery || selectedCategory"
                variant="outlined"
                color="primary"
                @click="clearFilters"
              >
                Clear Filters
              </v-btn>
            </v-card>
          </v-col>
        </v-row>

        <!-- Pagination -->
        <v-row v-if="!loading && filteredBuildings.length > itemsPerPage">
          <v-col cols="12" class="d-flex justify-center">
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              :total-visible="7"
              class="mt-4"
            />
          </v-col>
        </v-row>

        <!-- Loading State -->
        <v-row v-if="loading">
          <v-col cols="12">
            <div class="d-flex justify-center align-center" style="min-height: 300px;">
              <div class="text-center">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="64"
                  class="mb-4"
                />
                <p class="text-h6">Loading buildings...</p>
              </div>
            </div>
          </v-col>
        </v-row>

  </v-container>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

// Composables
const router = useRouter()

// API Configuration
const API_BASE = import.meta.env.VITE_API_BASE || 'https://minestatus-backend.cle4r.my.id'

// Reactive data
const buildings = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref(null)
const searchLoading = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(12)

// Search debounce timer
let searchTimeout = null

// Computed properties
const filteredBuildings = computed(() => {
  // Ensure buildings.value is always an array
  const buildingsArray = Array.isArray(buildings.value) ? buildings.value : []
  let filtered = [...buildingsArray]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(building => {
      const name = (building.name || '').toLowerCase()
      const builder = Array.isArray(building.builder) 
        ? building.builder.join(' ').toLowerCase()
        : (building.builder || '').toLowerCase()
      const category = Array.isArray(building.category) 
        ? building.category.join(' ').toLowerCase()
        : (building.category || '').toLowerCase()
      const summary = (building.summary || '').toLowerCase()
      
      return name.includes(query) ||
             builder.includes(query) ||
             category.includes(query) ||
             summary.includes(query)
    })
  }
  
  // Apply category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(building => {
      if (Array.isArray(building.category)) {
        return building.category.includes(selectedCategory.value)
      }
      return building.category === selectedCategory.value
    })
  }
  
  return filtered
})

const paginatedBuildings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredBuildings.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredBuildings.value.length / itemsPerPage.value)
})

const uniqueBuilders = computed(() => {
  const buildingsArray = Array.isArray(buildings.value) ? buildings.value : []
  const builders = new Set()
  buildingsArray.forEach(building => {
    if (building.builder) {
      if (Array.isArray(building.builder)) {
        building.builder.forEach(builder => builders.add(builder))
      } else {
        builders.add(building.builder)
      }
    }
  })
  return Array.from(builders)
})

const uniqueCategories = computed(() => {
  const buildingsArray = Array.isArray(buildings.value) ? buildings.value : []
  const cats = new Set()
  buildingsArray.forEach(building => {
    if (building.category) {
      if (Array.isArray(building.category)) {
        building.category.forEach(cat => cats.add(cat))
      } else {
        cats.add(building.category)
      }
    }
  })
  return Array.from(cats)
})

const categories = computed(() => {
  return uniqueCategories.value.map(cat => ({
    title: cat,
    value: cat
  }))
})

// Methods
const loadBuildings = async () => {
  try {
    loading.value = true
    const response = await fetch(`${API_BASE}/api/cms/buildings`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()

    if (data.status === 'success') {
      // The buildings are nested under data.buildings, not directly in data
      const buildingsData = data.data?.buildings || data.data || []
      buildings.value = Array.isArray(buildingsData) ? buildingsData : []
    } else {
      throw new Error(data.message || 'Failed to load buildings')
    }
  } catch (error) {
    console.error('Error loading buildings:', error)
    buildings.value = [] // Ensure it's always an array
  } finally {
    loading.value = false
  }
}

const onSearchChange = () => {
  currentPage.value = 1
  searchLoading.value = true
  
  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchLoading.value = false
  }, 300)
}

const onCategoryChange = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  currentPage.value = 1
}

const goToBuildingDetail = (slug) => {
  router.push(`/buildings/${slug}`)
}

const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'error'
    default: return 'info'
  }
}

// Watch for filter changes to reset pagination
watch([searchQuery, selectedCategory], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(() => {
  loadBuildings()
})
</script>

<style scoped>
.building-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
}

.building-card:hover {
  transform: translateY(-2px);
}

.image-container {
  position: relative;
}

.category-chips {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.category-chip {
  backdrop-filter: blur(8px);
}

.building-image {
  transition: transform 0.3s ease-in-out;
}

.building-card:hover .building-image {
  transform: scale(1.05);
}

.building-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
</style>