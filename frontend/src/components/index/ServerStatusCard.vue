<template>
  <v-card 
    class="server-status-card"
    elevation="4"
    rounded="lg"
    hover
  >
    <v-card-text class="d-flex flex-column align-center justify-center pa-8">
      <!-- Logo Section -->
      <div class="logo-container mb-6">
        <v-img
          src="/serverlogo.svg"
          alt="Server Logo"
          class="server-logo"
          :width="500"
        />
      </div>
      
      <!-- Server Details -->
      <div class="text-center">
        <v-card-title class="server-name justify-center pa-0 mb-2">
          CLE4R Server
        </v-card-title>
        
        <v-card-subtitle class="server-description pa-0 mb-4">
          Another ordinary Minecraft server waiting to be played!
        </v-card-subtitle>
        
        <!-- Status Chip -->
        <v-chip
          color="success"
          size="small"
          prepend-icon="mdi-circle"
          variant="outlined"
          class="status-chip"
        >
          Online
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'ServerStatusCard'
}
</script>

<style scoped>
/* Main card styles */
.server-status-card {
  min-height: 320px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.server-status-card:hover .server-logo {
  transform: scale(1.02);
}

.server-logo:hover {
  transform: scale(1.1);
}

.server-logo {
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  animation: logoShine 4s ease-in-out infinite alternate;
}

/* Smooth shine */
@keyframes logoShine {
  0% {
    filter: brightness(1) saturate(1) drop-shadow(0 0 10px rgba(255, 215, 0, 0.2));
  }
  50% {
    filter: brightness(1.4) saturate(1.2) drop-shadow(0 0 25px rgba(255, 215, 0, 0.6));
  }
  100% {
    filter: brightness(1.2) saturate(1.1) drop-shadow(0 0 15px rgba(255, 215, 0, 0.3));
  }
}

/* Glowing background pulse */
.server-logo::before {
  content: "";
  position: absolute;
  inset: -20%; /* extend beyond edges */
  background: radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%);
  border-radius: inherit;
  z-index: -1;
  animation: bgPulse 6s ease-in-out infinite alternate;
}

@keyframes bgPulse {
  0% {
    opacity: 0.2;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
}



/* True sweeping light effect */
.server-logo::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.8),
    transparent
  );
  animation: sweep-light 3s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
  mix-blend-mode: overlay;
  border-radius: 8px;
}

@keyframes sweep-light {
  0% {
    left: -100%;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    left: 100%;
    opacity: 0;
  }
}

/* Typography */
.server-name {
  font-size: 1.5rem !important;
  font-weight: 600 !important;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
}

.server-description {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)) !important;
}

/* Status chip animation */
.status-chip {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
  }
  50% { 
    opacity: 0.7; 
  }
}

/* Responsive design */
@media (max-width: 600px) {
  .server-logo {
    width: 280px !important;
  }
  
  .server-name {
    font-size: 1.25rem !important;
  }
}
</style>
