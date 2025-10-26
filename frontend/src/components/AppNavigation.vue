<template>
  <v-app-bar
    dark
    elevation="2"
    app
  >
    <v-app-bar-nav-icon @click="drawer = !drawer" />
    
    <v-toolbar-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-server</v-icon>
      <span class="font-weight-bold">Minestatus</span>
    </v-toolbar-title>

    <v-spacer />

    <!-- Desktop Navigation -->
    <div class="d-none d-md-flex">
      <v-btn
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        variant="text"
        class="mx-1"
        :prepend-icon="item.icon"
      >
        {{ item.title }}
      </v-btn>
    </div>
  </v-app-bar>

  <!-- Mobile Navigation Drawer -->
  <v-navigation-drawer
    v-model="drawer"
    temporary
    location="left"
  >
    <v-list>
      <v-list-item
        prepend-avatar="/favicon.ico"
        title="Minestatus"
        subtitle="Server Dashboard"
      />
    </v-list>

    <v-divider />

    <v-list density="compact" nav>
      <v-list-item
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        :prepend-icon="item.icon"
        :title="item.title"
        :subtitle="item.subtitle"
        @click="drawer = false"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'

const drawer = ref(false)

const menuItems = [
  {
    title: 'Dashboard',
    subtitle: 'Server overview',
    path: '/',
    icon: 'mdi-view-dashboard'
  },
  {
    title: 'Buildings',
    subtitle: 'Community builds',
    path: '/buildings',
    icon: 'mdi-home-city'
  },
  {
    title: 'Sessions',
    subtitle: 'Player activity',
    path: '/sessions',
    icon: 'mdi-history'
  },
  {
    title: 'Insights',
    subtitle: 'Block statistics',
    path: '/insights',
    icon: 'mdi-chart-line'
  }
]
</script>