<template>
  <v-app>
    <AppNavigation />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import AppNavigation from '@/components/AppNavigation.vue'
</script>
