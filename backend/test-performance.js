// Test script for performance service
const performanceService = require('./services/performanceService');

// Sample TabTPS response for testing (with Minecraft color codes)
const sampleTabTpsResponse = `§f[§9T§x§5§5§7§7§f§fa§x§5§5§9§9§f§fb§x§5§5§b§b§f§fT§x§5§5§d§d§f§fP§bS§f]§r §7§oServer Tick Information
§7TPS§f:§r §a2§x§4§4§e§e§4§40§x§3§3§d§d§3§3.§x§2§2§c§c§2§20§x§1§1§b§b§1§10§r §7§o(1m)§f,§r §a2§x§4§4§e§e§4§40§x§3§3§d§d§3§3.§x§2§2§c§c§2§20§x§1§1§b§b§1§10§r §7§o(5m)§f,§r §a2§x§4§4§e§e§4§40§x§3§3§d§d§3§3.§x§2§2§c§c§2§20§x§1§1§b§b§1§10§r §7§o(15m)
§7MSPT§f - §7Average§f, §7Minimum§f, §7Maximum
 §f├─§r §75s§f - §a5§x§4§0§e§a§4§0.§x§2§b§d§5§2§b5§x§1§5§b§f§1§56§f, §a1§x§4§0§e§a§4§0.§x§2§b§d§5§2§b5§x§1§5§b§f§1§53§f, §a1§x§4§4§e§e§4§41§x§3§3§d§d§3§3.§x§2§2§c§c§2§25§x§1§1§b§b§1§19
 §f├─§r §710s§f - §a5§x§4§0§e§a§4§0.§x§2§b§d§5§2§b7§x§1§5§b§f§1§58§f, §a1§x§4§0§e§a§4§0.§x§2§b§d§5§2§b5§x§1§5§b§f§1§53§f, §63§x§f§f§b§b§1§19§x§f§f§c§c§2§2.§x§f§f§d§d§3§35§x§f§f§e§e§4§44
 §f└─§r §760s§f - §a5§x§4§0§e§a§4§0.§x§2§b§d§5§2§b6§x§1§5§b§f§1§51§f, §a1§x§4§0§e§a§4§0.§x§2§b§d§5§2§b5§x§1§5§b§f§1§53§f, §c4§x§f§f§6§6§4§45§x§f§f§7§7§3§3.§x§f§f§8§8§2§26§x§f§f§9§9§1§19
§7CPU§f:§r §a3§x§4§0§e§a§4§0.§x§2§b§d§5§2§b4§x§1§5§b§f§1§59§7%§f,§r §a2§x§3§9§e§3§3§9.§x§1§c§c§6§1§c4§7%§r §f(§7sys.§f, §7proc.§f)
§7RAM§f:§r §a3§x§4§0§e§a§4§02§x§2§b§d§5§2§b3§x§1§5§b§f§1§58§7M§f/§a4§x§4§0§e§a§4§00§x§2§b§d§5§2§b9§x§1§5§b§f§1§56§7M§r §f(§7max.§r §a4§x§4§0§e§a§4§00§x§2§b§d§5§2§b9§x§1§5§b§f§1§56§7M§f)`;

console.log('🧪 Testing Performance Service Parser with Color Codes...\n');

// Test the color stripping function
console.log('🧹 Testing Color Stripping:');
const cleanedResponse = performanceService.stripMinecraftColors(sampleTabTpsResponse);
console.log('Cleaned Response:');
console.log(cleanedResponse);
console.log('\n' + '='.repeat(80) + '\n');

// Test the parser
console.log('📊 Testing Parser:');
const parsed = performanceService.parseTabTpsResponse(sampleTabTpsResponse);

console.log('Parsed Performance Data:');
console.log(JSON.stringify(parsed, null, 2));

// Test adding to history
if (parsed) {
  performanceService.addToHistory(parsed);

  // Test getting current metrics
  console.log('\n📈 Current Metrics:');
  console.log(JSON.stringify(performanceService.getCurrentMetrics(), null, 2));

  // Test server health
  console.log('\n🏥 Server Health:');
  console.log(JSON.stringify(performanceService.getServerHealth(), null, 2));
} else {
  console.log('❌ Parsing failed!');
}

console.log('\n✅ Performance Service Test Complete!');