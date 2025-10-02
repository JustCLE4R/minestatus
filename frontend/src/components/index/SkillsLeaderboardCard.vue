<template>
  <v-card class="mb-4">
    <v-card-title>Player Skills Leaderboard</v-card-title>
    <v-card-text>
      <!-- Search Bar -->
      <v-text-field
        v-model="search"
        label="Search players..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        single-line
        clearable
        class="mb-4"
      ></v-text-field>
      
      <v-data-table
        :headers="skillHeaders"
        :items="skillsData"
        :items-per-page="5"
        class="elevation-1"
        item-value="user_id"
        show-expand
        :expanded="expanded"
        @update:expanded="expanded = $event"
        @click:row="toggleExpand"
        :search="search"
      >
        <template #item.User.user="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="24" class="mr-2">
              <img :src="`https://mc-heads.net/avatar/${item.User.user}/24`" />
            </v-avatar>
            {{ item.User.user }}
          </div>
        </template>
        <template #item.topSkills="{ item }">
          <div class="text-caption">
            <v-chip 
              v-for="skill in getTopSkills(item)" 
              :key="skill.name"
              size="x-small" 
              class="mr-1 mb-1"
              :class="{ 'legendary-glow': skill.level >= 1000 }"
              :color="getSkillLevelColor(skill.level)"
            >
              {{ skill.name }}: {{ skill.level }}
            </v-chip>
          </div>
        </template>
        <template #item.lastLogin="{ item }">
          {{ formatLastLogin(item.lastLogin) }}
        </template>
        <template #item.total="{ item }">
          <v-chip 
            :color="getTotalColor(item.total)" 
            size="small"
            :class="{ 'legendary-glow': item.total >= 10000 }"
          >
            {{ item.total }}
          </v-chip>
        </template>
        
        <!-- Expanded content showing all skills -->
        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length">
              <v-container class="pa-4">
                <v-row>
                  <v-col cols="12">
                    <h4 class="mb-3">{{ item.User.user }}'s Detailed Skills</h4>
                  </v-col>
                </v-row>
                <v-row>
                  <!-- Combat Skills -->
                  <v-col cols="12" md="4">
                    <v-card variant="outlined" class="mb-3 combat-card">
                      <v-card-title class="text-subtitle-1 pa-3 combat-header">⚔️ Combat</v-card-title>
                      <v-card-text class="pt-0">
                        <v-tooltip text="This skill awards combat bonuses to anyone fighting with a sword." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.swords)]: getTop3SkillNames(item).includes('swords') }]">🗡️ <strong>Swords:</strong> {{ item.swords }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="With the Axes skill you can use your axe for much more than just deforesting! You can hack and chop away at mobs and players to gain XP, hitting mobs with the effect of knockback and inflicting DEADLY criticals on mobs and players. Your axe also becomes a hand-held woodchipper, breaking down the enemy's armor with ease as your level increases." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.axes)]: getTop3SkillNames(item).includes('axes') }]">🪓 <strong>Axes:</strong> {{ item.axes }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="Archery is about shooting with your bow and arrow. It provides various combat bonuses, such as a damage boost that scales with your level and the ability to daze your opponents in PvP. In addition to this, you can retrieve some of your spent arrows from the corpses of your foes." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.archery)]: getTop3SkillNames(item).includes('archery') }]">🏹 <strong>Archery:</strong> {{ item.archery }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="Crossbows is all about shooting with your crossbow." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.crossbows)]: getTop3SkillNames(item).includes('crossbows') }]">🏹 <strong>Crossbows:</strong> {{ item.crossbows }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="The Tridents skill involves impaling foes with your trident." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.tridents)]: getTop3SkillNames(item).includes('tridents') }]">🔱 <strong>Tridents:</strong> {{ item.tridents }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="The Maces skill is great at crushing your foes." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.maces)]: getTop3SkillNames(item).includes('maces') }]">🔨 <strong>Maces:</strong> {{ item.maces }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="Unarmed will give players various combat bonuses when using your fists as a weapon." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.unarmed)]: getTop3SkillNames(item).includes('unarmed') }]">👊 <strong>Unarmed:</strong> {{ item.unarmed }}</div>
                          </template>
                        </v-tooltip>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  
                  <!-- Gathering Skills -->
                  <v-col cols="12" md="4">
                    <v-card variant="outlined" class="mb-3 gathering-card">
                      <v-card-title class="text-subtitle-1 pa-3 gathering-header">⛏️ Gathering</v-card-title>
                      <v-card-text class="pt-0">
                        <v-tooltip text="Mining consists of mining stone and ores. It provides bonuses to the amount of materials dropped while mining." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.mining)]: getTop3SkillNames(item).includes('mining') }]">⛏️ <strong>Mining:</strong> {{ item.mining }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="Woodcutting is all about chopping down trees." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.woodcutting)]: getTop3SkillNames(item).includes('woodcutting') }]">🌲 <strong>Woodcutting:</strong> {{ item.woodcutting }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="Excavation is the act of digging up dirt to find treasures. By excavating the land you will find treasures. The more you do this the more treasures you can find." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.excavation)]: getTop3SkillNames(item).includes('excavation') }]">🏗️ <strong>Excavation:</strong> {{ item.excavation }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="With the Fishing skill, Fishing is exciting again! Find hidden treasures, and shake items off mobs." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.fishing)]: getTop3SkillNames(item).includes('fishing') }]">🎣 <strong>Fishing:</strong> {{ item.fishing }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="Herbalism is about collecting herbs and plants." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.herbalism)]: getTop3SkillNames(item).includes('herbalism') }]">🌿 <strong>Herbalism:</strong> {{ item.herbalism }}</div>
                          </template>
                        </v-tooltip>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  
                  <!-- Other Skills -->
                  <v-col cols="12" md="4">
                    <v-card variant="outlined" class="mb-3 other-card">
                      <v-card-title class="text-subtitle-1 pa-3 other-header">🔧 Other</v-card-title>
                      <v-card-text class="pt-0">
                        <v-tooltip text="Repair allows you to use an iron block to repair armor and tools." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.repair)]: getTop3SkillNames(item).includes('repair') }]">🔧 <strong>Repair:</strong> {{ item.repair }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="Alchemy is about brewing potions. It provides a speed increase in the potion brew time, as well as the addition of new (previously) unobtainable potions." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.alchemy)]: getTop3SkillNames(item).includes('alchemy') }]">🧪 <strong>Alchemy:</strong> {{ item.alchemy }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="Taming will give players various combat bonuses when using tamed wolves." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.taming)]: getTop3SkillNames(item).includes('taming') }]">🐺 <strong>Taming:</strong> {{ item.taming }}</div>
                          </template>
                        </v-tooltip>
                        
                        <v-tooltip text="Acrobatics is the art of moving gracefully. It provides combat bonuses and environment damage bonuses." location="top">
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" :class="['skill-item', { [getHighlightClass(item.acrobatics)]: getTop3SkillNames(item).includes('acrobatics') }]">🤸 <strong>Acrobatics:</strong> {{ item.acrobatics }}</div>
                          </template>
                        </v-tooltip>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-container>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  skillsData: {
    type: Array,
    default: () => []
  }
});

const expanded = ref([]);
const search = ref('');

// Toggle expand/collapse when row is clicked
function toggleExpand(event, { item }) {
  const userId = item.user_id;
  const expandedIndex = expanded.value.indexOf(userId);
  
  if (expandedIndex === -1) {
    // Not expanded, add to expanded array
    expanded.value.push(userId);
  } else {
    // Already expanded, remove from expanded array
    expanded.value.splice(expandedIndex, 1);
  }
}

// Skills table headers - showing only key columns, rest are in expandable view
const skillHeaders = ref([
  { title: 'Player', key: 'User.user', sortable: true },
  { title: 'Total Level', key: 'total', sortable: true },
  { title: 'Top Skills', key: 'topSkills', sortable: false },
  { title: 'Last Login', key: 'lastLogin', sortable: true },
  { title: '', key: 'data-table-expand', sortable: false }
]);

// Format ISO timestamp to readable date
function formatLastLogin(timestamp) {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp); // ISO string can be parsed directly
  const now = new Date();
  
  // Format date as DD/MM/YYYY
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  
  // Format time as 12-hour format with AM/PM
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  // Calculate time ago with intelligent hour/minute conversion
  const diffMs = now.getTime() - date.getTime();
  const minutesAgo = Math.floor(diffMs / (1000 * 60));
  const hoursAgo = Math.floor(minutesAgo / 60);
  
  let timeAgo;
  if (minutesAgo < 60) {
    // Less than 1 hour - show minutes
    timeAgo = minutesAgo === 1 ? '1 Minute ago' : `${minutesAgo} Minutes ago`;
  } else if (hoursAgo < 24) {
    // Less than 1 day - show hours
    timeAgo = hoursAgo === 1 ? '1 Hour ago' : `${hoursAgo} Hours ago`;
  } else {
    // 1 day or more - show days
    const daysAgo = Math.floor(hoursAgo / 24);
    timeAgo = daysAgo === 1 ? '1 Day ago' : `${daysAgo} Days ago`;
  }
  
  return `${formattedDate} ${formattedTime} (${timeAgo})`;
}

// Get color based on skill level - unified function for consistent colors
function getSkillLevelColor(level) {
  if (level >= 1000) return 'legendary-gold';
  if (level >= 800) return 'red';
  if (level >= 500) return 'purple';
  if (level >= 300) return 'blue';
  if (level >= 200) return 'green';
  if (level >= 100) return 'orange';
  if (level > 0) return 'grey';
  return 'default';
}

// Get color based on total skill level (divided by 10 because it accumulates skills level)
function getTotalColor(total) {
  return getSkillLevelColor(Math.floor(total / 10));
}

// Get top 3 skills for a player (excluding total)
function getTopSkills(player) {
  const skills = [
    { name: 'Mining', displayName: 'mining', level: player.mining },
    { name: 'Woodcut', displayName: 'woodcutting', level: player.woodcutting },
    { name: 'Excav', displayName: 'excavation', level: player.excavation },
    { name: 'Herb', displayName: 'herbalism', level: player.herbalism },
    { name: 'Archery', displayName: 'archery', level: player.archery },
    { name: 'Swords', displayName: 'swords', level: player.swords },
    { name: 'Axes', displayName: 'axes', level: player.axes },
    { name: 'Unarmed', displayName: 'unarmed', level: player.unarmed },
    { name: 'Repair', displayName: 'repair', level: player.repair },
    { name: 'Fishing', displayName: 'fishing', level: player.fishing },
    { name: 'Alchemy', displayName: 'alchemy', level: player.alchemy },
    { name: 'Taming', displayName: 'taming', level: player.taming },
    { name: 'Acrobat', displayName: 'acrobatics', level: player.acrobatics },
    { name: 'Crossbow', displayName: 'crossbows', level: player.crossbows },
    { name: 'Trident', displayName: 'tridents', level: player.tridents },
    { name: 'Maces', displayName: 'maces', level: player.maces }
  ];
  
  return skills
    .filter(skill => skill.level > 0)
    .sort((a, b) => b.level - a.level)
    .slice(0, 3);
}

// Get top 3 highest skills property names for highlighting (reuses getTopSkills)
function getTop3SkillNames(player) {
  return getTopSkills(player).map(skill => skill.displayName);
}

// Get highlight class based on skill level
function getHighlightClass(level) {
  const color = getSkillLevelColor(level);
  return `highlight-${color}`;
}
</script>

<style scoped>
.skill-item {
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.87);
}

.skill-item:last-child {
  border-bottom: none;
}

/* Category-specific card styling */
.combat-card {
  border: 2px solid #ef5350;
  background: linear-gradient(135deg, rgba(239, 83, 80, 0.15), rgba(33, 33, 33, 0.95));
  transition: all 0.3s ease;
}

.combat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 83, 80, 0.4);
}

.combat-header {
  background: linear-gradient(90deg, #c62828, #ef5350);
  color: white !important;
  margin: -12px -12px 12px -12px;
  border-radius: 4px 4px 0 0;
}

.gathering-card {
  border: 2px solid #66bb6a;
  background: linear-gradient(135deg, rgba(102, 187, 106, 0.15), rgba(33, 33, 33, 0.95));
  transition: all 0.3s ease;
}

.gathering-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 187, 106, 0.4);
}

.gathering-header {
  background: linear-gradient(90deg, #388e3c, #66bb6a);
  color: white !important;
  margin: -12px -12px 12px -12px;
  border-radius: 4px 4px 0 0;
}

.other-card {
  border: 2px solid #ffb74d;
  background: linear-gradient(135deg, rgba(255, 183, 77, 0.15), rgba(33, 33, 33, 0.95));
  transition: all 0.3s ease;
}

.other-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 183, 77, 0.4);
}

.other-header {
  background: linear-gradient(90deg, #f57c00, #ffb74d);
  color: white !important;
  margin: -12px -12px 12px -12px;
  border-radius: 4px 4px 0 0;
}

/* Color-specific highlight animations */
.highlight-legendary-gold {
  animation: highlightLegendary 2s ease-in-out infinite;
  font-weight: bold;
}

.highlight-red {
  animation: highlightRed 2s ease-in-out infinite;
  font-weight: bold;
}

.highlight-purple {
  animation: highlightPurple 2s ease-in-out infinite;
  font-weight: bold;
}

.highlight-blue {
  animation: highlightBlue 2s ease-in-out infinite;
  font-weight: bold;
}

.highlight-green {
  animation: highlightGreen 2s ease-in-out infinite;
  font-weight: bold;
}

.highlight-orange {
  animation: highlightOrange 2s ease-in-out infinite;
  font-weight: bold;
}

.highlight-grey {
  animation: highlightGrey 2s ease-in-out infinite;
  font-weight: bold;
}

.highlight-default {
  animation: highlightDefault 2s ease-in-out infinite;
  font-weight: bold;
}

/* Keyframe animations for each color */
@keyframes highlightLegendary {
  0%, 100% {
    background: rgba(255, 215, 0, 0.1);
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
  }
  50% {
    background: rgba(255, 215, 0, 0.3);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
  }
}

@keyframes highlightRed {
  0%, 100% {
    background: rgba(244, 67, 54, 0.1);
    box-shadow: 0 0 5px rgba(244, 67, 54, 0.3);
  }
  50% {
    background: rgba(244, 67, 54, 0.3);
    box-shadow: 0 0 15px rgba(244, 67, 54, 0.6);
  }
}

@keyframes highlightPurple {
  0%, 100% {
    background: rgba(156, 39, 176, 0.1);
    box-shadow: 0 0 5px rgba(156, 39, 176, 0.3);
  }
  50% {
    background: rgba(156, 39, 176, 0.3);
    box-shadow: 0 0 15px rgba(156, 39, 176, 0.6);
  }
}

@keyframes highlightBlue {
  0%, 100% {
    background: rgba(33, 150, 243, 0.1);
    box-shadow: 0 0 5px rgba(33, 150, 243, 0.3);
  }
  50% {
    background: rgba(33, 150, 243, 0.3);
    box-shadow: 0 0 15px rgba(33, 150, 243, 0.6);
  }
}

@keyframes highlightGreen {
  0%, 100% {
    background: rgba(76, 175, 80, 0.1);
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
  }
  50% {
    background: rgba(76, 175, 80, 0.3);
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.6);
  }
}

@keyframes highlightOrange {
  0%, 100% {
    background: rgba(255, 152, 0, 0.1);
    box-shadow: 0 0 5px rgba(255, 152, 0, 0.3);
  }
  50% {
    background: rgba(255, 152, 0, 0.3);
    box-shadow: 0 0 15px rgba(255, 152, 0, 0.6);
  }
}

@keyframes highlightGrey {
  0%, 100% {
    background: rgba(158, 158, 158, 0.1);
    box-shadow: 0 0 5px rgba(158, 158, 158, 0.3);
  }
  50% {
    background: rgba(158, 158, 158, 0.3);
    box-shadow: 0 0 15px rgba(158, 158, 158, 0.6);
  }
}

@keyframes highlightDefault {
  0%, 100% {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
  }
  50% {
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
  }
}

/* Skill item hover effects */
.combat-card .skill-item:hover {
  background: rgba(239, 83, 80, 0.2);
  transform: translateX(5px);
  border-radius: 4px;
}

.gathering-card .skill-item:hover {
  background: rgba(102, 187, 106, 0.2);
  transform: translateX(5px);
  border-radius: 4px;
}

.other-card .skill-item:hover {
  background: rgba(255, 183, 77, 0.2);
  transform: translateX(5px);
  border-radius: 4px;
}

/* Legendary gold chip styling */
:deep(.v-chip.v-chip--variant-elevated) {
  transition: all 0.3s ease;
}

:deep(.v-chip.legendary-glow) {
  background: linear-gradient(45deg, #ffd700, #ffed4a, #ffd700) !important;
  color: #000 !important;
  font-weight: bold;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
  animation: legendaryPulse 2s ease-in-out infinite;
  border: 2px solid #ffed4a;
}

@keyframes legendaryPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.4);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.6);
    transform: scale(1.05);
  }
}

/* Sparkle effect for legendary chips */
:deep(.v-chip.legendary-glow::before) {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.7), transparent);
  animation: sparkle 3s linear infinite;
  border-radius: inherit;
  pointer-events: none;
}

@keyframes sparkle {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(200%) rotate(45deg);
  }
}
</style>