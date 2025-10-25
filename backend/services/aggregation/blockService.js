/**
 * Block Aggregation Service
 * 
 * Handles periodic aggregation of raw data into summary tables.
 * Tracks individual block types, worlds, and both break/place actions.
 */

const cron = require('node-cron');
const { sequelize, BlockBreak, BlockPlace, PlayerBlockStats, AggregationTracker } = require('../../models');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');

const log = logger.createLogger('AGGREGATION');

/**
 * Process block break aggregation with individual block tracking
 */
const processBlockBreakAggregation = async () => {
  log.info('Processing block break aggregation...');

  try {
    const tracker = await AggregationTracker.findOne({ 
      where: { tableName: 'block_break' },
      order: [['lastAggregatedAt', 'DESC']]
    });
    const lastAggregatedAt = tracker ? tracker.lastAggregatedAt : new Date(0);

    // Get new block break data grouped by player, block type, and world
    const newData = await BlockBreak.findAll({
      attributes: [
        'playerName',
        'block',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { date: { [Op.gt]: lastAggregatedAt }, world: { [Op.ne]: 'plots' } },
      group: ['playerName', 'block']
    });

    if (newData.length === 0) {
      log.debug('No new block break data to process');
      return { processed: 0, totalBlocks: 0, message: 'No new block break data' };
    }

    let totalBlocksProcessed = 0;

    // Process each unique combination of player, block, and world
    for (const row of newData) {
      const count = parseInt(row.get('count'));
      totalBlocksProcessed += count;

      await PlayerBlockStats.upsert({
        playerName: row.playerName,
        blockType: row.block,
        world: row.world,
        actionType: 'break',
        count: sequelize.literal(`count + ${count}`)
      });
    }

    // Update tracker
    const latestDate = await BlockBreak.max('date');
    await AggregationTracker.upsert({
      tableName: 'block_break',
      lastAggregatedAt: latestDate
    });

    log.info(`Processed ${newData.length} break combinations, ${totalBlocksProcessed} total blocks up to ${latestDate}`);
    
    return { 
      processed: newData.length, 
      totalBlocks: totalBlocksProcessed,
      latestDate,
      type: 'block_break',
      message: 'Block break aggregation completed successfully' 
    };

  } catch (error) {
    log.error('Block break aggregation failed:', error);
    throw error;
  }
};

/**
 * Process block place aggregation with individual block tracking
 */
const processBlockPlaceAggregation = async () => {
  log.info('Processing block place aggregation...');

  try {
    const tracker = await AggregationTracker.findOne({
      where: { tableName: 'block_place' },
      order: [['lastAggregatedAt', 'DESC']]
    });
    const lastAggregatedAt = tracker ? tracker.lastAggregatedAt : new Date(0);

    // Get new block place data grouped by player, block type, and world
    const newData = await BlockPlace.findAll({
      attributes: [
        'playerName',
        'block',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { date: { [Op.gt]: lastAggregatedAt }, world: { [Op.ne]: 'plots' } },
      group: ['playerName', 'block']
    });

    if (newData.length === 0) {
      log.debug('No new block place data to process');
      return { processed: 0, totalBlocks: 0, message: 'No new block place data' };
    }

    let totalBlocksProcessed = 0;

    // Process each unique combination of player, block, and world
    for (const row of newData) {
      const count = parseInt(row.get('count'));
      totalBlocksProcessed += count;

      await PlayerBlockStats.upsert({
        playerName: row.playerName,
        blockType: row.block,
        world: row.world,
        actionType: 'place',
        count: sequelize.literal(`count + ${count}`)
      });
    }

    // Update tracker
    const latestDate = await BlockPlace.max('date');
    await AggregationTracker.upsert({
      tableName: 'block_place',
      lastAggregatedAt: latestDate
    });

    log.info(`Processed ${newData.length} place combinations, ${totalBlocksProcessed} total blocks up to ${latestDate}`);
    
    return { 
      processed: newData.length, 
      totalBlocks: totalBlocksProcessed,
      latestDate,
      type: 'block_place',
      message: 'Block place aggregation completed successfully' 
    };

  } catch (error) {
    log.error('Block place aggregation failed:', error);
    throw error;
  }
};

/**
 * Combined block aggregation (both break and place)
 */
const processBlockAggregation = async () => {
  log.info('Processing combined block aggregation...');

  try {
    const breakResult = await processBlockBreakAggregation();
    const placeResult = await processBlockPlaceAggregation();

    const totalProcessed = breakResult.processed + placeResult.processed;
    const totalBlocks = breakResult.totalBlocks + placeResult.totalBlocks;

    log.info(`Combined aggregation completed: ${totalProcessed} combinations, ${totalBlocks} total blocks`);

    return {
      breakResult,
      placeResult,
      totalProcessed,
      totalBlocks,
      message: 'Combined block aggregation completed successfully'
    };

  } catch (error) {
    log.error('Combined block aggregation failed:', error);
    throw error;
  }
};

/**
 * Schedule block break aggregation (every 10 minutes)
 */
const scheduleBlockBreakAggregation = () => {
  cron.schedule('*/10 * * * *', async () => {
    try {
      await processBlockBreakAggregation();
    } catch (error) {
      log.error('Scheduled block break aggregation failed:', error);
    }
  });

  log.info('Block break aggregation scheduled (every 10 minutes)');
};

/**
 * Schedule block place aggregation (every 10 minutes)
 */
const scheduleBlockPlaceAggregation = () => {
  cron.schedule('*/10 * * * *', async () => {
    try {
      await processBlockPlaceAggregation();
    } catch (error) {
      log.error('Scheduled block place aggregation failed:', error);
    }
  });

  log.info('Block place aggregation scheduled (every 10 minutes)');
};

/**
 * Schedule combined block aggregation (every 10 minutes)
 */
const scheduleBlockAggregation = () => {
  cron.schedule('*/10 * * * *', async () => {
    try {
      await processBlockAggregation();
    } catch (error) {
      log.error('Scheduled combined block aggregation failed:', error);
    }
  });

  log.info('Combined block aggregation scheduled (every 10 minutes)');
};

/**
 * Initialize all aggregation jobs
 */
const initialize = () => {
  log.info('Initializing block aggregation service...');
  scheduleBlockAggregation(); // Use combined aggregation by default
  log.info('Block aggregation service initialized successfully');
};

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
const shutdown = () => {
  log.info('Stopping block aggregation service...');
  const tasks = cron.getTasks();
  tasks.forEach(task => task.stop());
  log.info(`Stopped ${tasks.size} scheduled tasks`);
};

module.exports = {
  initialize,
  shutdown,
  processBlockBreakAggregation,
  processBlockPlaceAggregation,
  processBlockAggregation,
  scheduleBlockBreakAggregation,
  scheduleBlockPlaceAggregation,
  scheduleBlockAggregation
};