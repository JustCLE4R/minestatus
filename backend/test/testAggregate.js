/**
 * Manual Aggregation Trigger
 * 
 * Test script to manually run aggregation processes without waiting for cron schedule.
 * Usage: node test/testAggregate.js
 */

require('dotenv').config();
const { sequelize, BlockBreak, BlockPlace, PlayerBlockStats, AggregationTracker } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const aggregationService = require('../services/aggregation/blockService');

const log = logger.createLogger('TEST-AGGREGATE');

/**
 * Manual combined block aggregation using the service
 */
async function runBlockAggregation() {
  log.info('Triggering manual combined block aggregation...');

  try {
    // Use the service's combined aggregation function
    const result = await aggregationService.processBlockAggregation();
    
    if (result.totalProcessed === 0) {
      log.info('✅ No new data to process');
    } else {
      log.info(`✅ Successfully processed ${result.totalProcessed} combinations, ${result.totalBlocks} total blocks`);
      log.info(`   - Breaks: ${result.breakResult.processed} combinations, ${result.breakResult.totalBlocks} blocks`);
      log.info(`   - Places: ${result.placeResult.processed} combinations, ${result.placeResult.totalBlocks} blocks`);
    }
    
    return result;

  } catch (error) {
    log.error('❌ Combined block aggregation failed:', error);
    throw error;
  }
}

/**
 * Manual block break aggregation using the service
 */
async function runBlockBreakAggregation() {
  log.info('Triggering manual block break aggregation...');

  try {
    const result = await aggregationService.processBlockBreakAggregation();
    
    if (result.processed === 0) {
      log.info('✅ No new break data to process');
    } else {
      log.info(`✅ Successfully processed ${result.processed} combinations, ${result.totalBlocks} break blocks`);
    }
    
    return result;

  } catch (error) {
    log.error('❌ Block break aggregation failed:', error);
    throw error;
  }
}

/**
 * Manual block place aggregation using the service
 */
async function runBlockPlaceAggregation() {
  log.info('Triggering manual block place aggregation...');

  try {
    const result = await aggregationService.processBlockPlaceAggregation();
    
    if (result.processed === 0) {
      log.info('✅ No new place data to process');
    } else {
      log.info(`✅ Successfully processed ${result.processed} combinations, ${result.totalBlocks} placed blocks`);
    }
    
    return result;

  } catch (error) {
    log.error('❌ Block place aggregation failed:', error);
    throw error;
  }
}

/**
 * Show current aggregation status
 */
async function showAggregationStatus() {
  log.info('Checking aggregation status...');

  try {
    // Check tracker status for both break and place
    const breakTracker = await AggregationTracker.findOne({ where: { tableName: 'block_break' }, order: [['lastAggregatedAt', 'DESC']] });
    const placeTracker = await AggregationTracker.findOne({ where: { tableName: 'block_place' }, order: [['lastAggregatedAt', 'DESC']] });

    const lastBreakAggregatedAt = breakTracker ? breakTracker.lastAggregatedAt : 'Never';
    const lastPlaceAggregatedAt = placeTracker ? placeTracker.lastAggregatedAt : 'Never';

    // Count raw data
    const totalRawBreaks = await BlockBreak.count();
    const totalRawPlaces = await BlockPlace.count();
    
    const newBreaks = await BlockBreak.count({
      where: {
        date: { [Op.gt]: breakTracker ? breakTracker.lastAggregatedAt : new Date(0) }
      }
    });
    
    const newPlaces = await BlockPlace.count({
      where: {
        date: { [Op.gt]: placeTracker ? placeTracker.lastAggregatedAt : new Date(0) }
      }
    });

    // Count aggregated data with new granular structure
    const totalStatsRecords = await PlayerBlockStats.count();
    const totalBreakRecords = await PlayerBlockStats.count({ where: { action_type: 'break' } });
    const totalPlaceRecords = await PlayerBlockStats.count({ where: { action_type: 'place' } });
    
    const totalAggregatedBreaks = await PlayerBlockStats.sum('count', { where: { action_type: 'break' } }) || 0;
    const totalAggregatedPlaces = await PlayerBlockStats.sum('count', { where: { action_type: 'place' } }) || 0;

    // Get unique players and block types
    const uniquePlayers = await PlayerBlockStats.count({
      distinct: true,
      col: 'player_name'
    });
    
    const uniqueBlockTypes = await PlayerBlockStats.count({
      distinct: true,
      col: 'block_type'
    });

    log.info('📊 Aggregation Status:');
    log.info(`  Last break aggregation: ${lastBreakAggregatedAt}`);
    log.info(`  Last place aggregation: ${lastPlaceAggregatedAt}`);
    log.info(`  Raw block breaks: ${totalRawBreaks} (${newBreaks} new)`);
    log.info(`  Raw block places: ${totalRawPlaces} (${newPlaces} new)`);
    log.info(`  Total stats records: ${totalStatsRecords} (${totalBreakRecords} breaks, ${totalPlaceRecords} places)`);
    log.info(`  Unique players tracked: ${uniquePlayers}`);
    log.info(`  Unique block types: ${uniqueBlockTypes}`);
    log.info(`  Total aggregated breaks: ${totalAggregatedBreaks}`);
    log.info(`  Total aggregated places: ${totalAggregatedPlaces}`);

    return {
      lastBreakAggregatedAt,
      lastPlaceAggregatedAt,
      totalRawBreaks,
      totalRawPlaces,
      newBreaks,
      newPlaces,
      totalStatsRecords,
      totalBreakRecords,
      totalPlaceRecords,
      uniquePlayers,
      uniqueBlockTypes,
      totalAggregatedBreaks,
      totalAggregatedPlaces
    };

  } catch (error) {
    log.error('❌ Failed to get aggregation status:', error);
    throw error;
  }
}

/**
 * Reset aggregation (for testing)
 */
async function resetAggregation() {
  log.warn('⚠️  Resetting aggregation data...');

  try {
    // Clear aggregated data
    await PlayerBlockStats.destroy({ where: {} });
    
    // Reset trackers for both break and place
    await AggregationTracker.destroy({ where: { tableName: 'block_break' } });
    await AggregationTracker.destroy({ where: { tableName: 'block_place' } });

    log.info('✅ Aggregation data reset successfully');
    return { message: 'Aggregation reset completed' };

  } catch (error) {
    log.error('❌ Failed to reset aggregation:', error);
    throw error;
  }
}

/**
 * Main function - handles command line arguments
 */
async function main() {
  const command = process.argv[2] || 'run';

  try {
    // Ensure database connection
    await sequelize.authenticate();
    log.info('Database connected successfully');

    switch (command.toLowerCase()) {
      case 'run':
      case 'aggregate':
        await runBlockAggregation();
        break;

      case 'breaks':
        await runBlockBreakAggregation();
        break;

      case 'places':
        await runBlockPlaceAggregation();
        break;

      case 'status':
      case 'check':
        await showAggregationStatus();
        break;

      case 'reset':
        const confirm = process.argv[3];
        if (confirm !== '--confirm') {
          log.warn('⚠️  To reset aggregation data, use: node test/testAggregate.js reset --confirm');
          process.exit(1);
        }
        await resetAggregation();
        break;

      default:
        log.info('Available commands:');
        log.info('  run|aggregate - Run combined aggregation manually');
        log.info('  breaks        - Run break aggregation only');
        log.info('  places        - Run place aggregation only');
        log.info('  status|check  - Show current aggregation status');
        log.info('  reset --confirm - Reset all aggregation data (DESTRUCTIVE)');
        process.exit(1);
    }

  } catch (error) {
    log.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    log.info('Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runBlockAggregation,
  runBlockBreakAggregation,
  runBlockPlaceAggregation,
  showAggregationStatus,
  resetAggregation
};
