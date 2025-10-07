class PerformanceService {
  constructor() {
    this.performanceHistory = [];
    this.maxHistoryLength = 288; // Store 24 hours of data (5-minute intervals)
    
    // Start collecting performance data every 5 minutes
    this.startPerformanceCollection();
  }

  /**
   * Strip Minecraft color codes from text
   * @param {string} text - Text with Minecraft color codes
   * @returns {string} Clean text without color codes
   */
  stripMinecraftColors(text) {
    if (!text) return '';
    
    // Remove Minecraft color codes (§ followed by any character) and hex color codes (§x followed by 12 characters)
    return text
      .replace(/§x[0-9a-f]{12}/gi, '') // Remove hex color codes (§x followed by 12 hex chars)
      .replace(/§[0-9a-fk-or]/gi, '')  // Remove standard color codes
      .replace(/§./g, '')              // Remove any remaining § followed by any character
      .trim();
  }

  /**
   * Parse TabTPS response into structured data
   * @param {string} response - Raw RCON response from tabtps:tps command
   * @returns {Object} Parsed performance metrics
   */
  parseTabTpsResponse(response) {
    try {
      // First, strip all Minecraft color codes
      const cleanResponse = this.stripMinecraftColors(response);
      
      const lines = cleanResponse.split('\n').map(line => line.trim()).filter(line => line);
      
      const metrics = {
        timestamp: new Date(),
        tps: {
          oneMinute: null,
          fiveMinute: null,
          fifteenMinute: null
        },
        mspt: {
          fiveSecond: { avg: null, min: null, max: null },
          tenSecond: { avg: null, min: null, max: null },
          sixtySecond: { avg: null, min: null, max: null }
        },
        cpu: {
          system: null,
          process: null
        },
        memory: {
          used: null,
          allocated: null,
          max: null,
          usedPercentage: null
        }
      };

      // Parse TPS line: "TPS: 20.00 (1m), 20.00 (5m), 20.00 (15m)"
      const tpsLine = lines.find(line => line.startsWith('TPS:'));
      if (tpsLine) {
        const tpsMatch = tpsLine.match(/TPS: ([\d.]+) \(1m\), ([\d.]+) \(5m\), ([\d.]+) \(15m\)/);
        if (tpsMatch) {
          metrics.tps.oneMinute = parseFloat(tpsMatch[1]);
          metrics.tps.fiveMinute = parseFloat(tpsMatch[2]);
          metrics.tps.fifteenMinute = parseFloat(tpsMatch[3]);
        }
      }

      // Parse MSPT lines
      const msptLines = lines.filter(line => line.includes('s -'));
      msptLines.forEach(line => {
        const msptMatch = line.match(/([\d]+)s - ([\d.]+), ([\d.]+), ([\d.]+)/);
        if (msptMatch) {
          const duration = msptMatch[1];
          const avg = parseFloat(msptMatch[2]);
          const min = parseFloat(msptMatch[3]);
          const max = parseFloat(msptMatch[4]);

          if (duration === '5') {
            metrics.mspt.fiveSecond = { avg, min, max };
          } else if (duration === '10') {
            metrics.mspt.tenSecond = { avg, min, max };
          } else if (duration === '60') {
            metrics.mspt.sixtySecond = { avg, min, max };
          }
        }
      });

      // Parse CPU line: "CPU: 4.35%, 2.86% (sys., proc.)"
      const cpuLine = lines.find(line => line.startsWith('CPU:'));
      if (cpuLine) {
        const cpuMatch = cpuLine.match(/CPU: ([\d.]+)%, ([\d.]+)% \(sys\., proc\.\)/);
        if (cpuMatch) {
          metrics.cpu.system = parseFloat(cpuMatch[1]);
          metrics.cpu.process = parseFloat(cpuMatch[2]);
        }
      }

      // Parse RAM line: "RAM: 3341M/4096M (max. 4096M)"
      const ramLine = lines.find(line => line.startsWith('RAM:'));
      if (ramLine) {
        const ramMatch = ramLine.match(/RAM: ([\d]+)M\/([\d]+)M \(max\. ([\d]+)M\)/);
        if (ramMatch) {
          metrics.memory.used = parseInt(ramMatch[1]);
          metrics.memory.allocated = parseInt(ramMatch[2]);
          metrics.memory.max = parseInt(ramMatch[3]);
          metrics.memory.usedPercentage = Math.round((metrics.memory.used / metrics.memory.allocated) * 100);
        }
      }

      return metrics;
    } catch (error) {
      console.error('❌ Error parsing TabTPS response:', error);
      return null;
    }
  }

  /**
   * Add performance data to history
   * @param {Object} metrics - Performance metrics
   */
  addToHistory(metrics) {
    if (!metrics) return;

    this.performanceHistory.push(metrics);

    // Keep only the last maxHistoryLength entries
    if (this.performanceHistory.length > this.maxHistoryLength) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistoryLength);
    }

    console.log(`📊 Performance metrics collected - TPS: ${metrics.tps.oneMinute}, CPU: ${metrics.cpu.process}%, RAM: ${metrics.memory.usedPercentage}%`);
  }

  /**
   * Get current performance metrics
   * @returns {Object|null} Latest performance data
   */
  getCurrentMetrics() {
    return this.performanceHistory.length > 0 
      ? this.performanceHistory[this.performanceHistory.length - 1] 
      : null;
  }

  /**
   * Get performance history for a specific time range
   * @param {number} hours - Number of hours to retrieve (default: 24)
   * @returns {Array} Performance history
   */
  getPerformanceHistory(hours = 24) {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.performanceHistory.filter(entry => 
      new Date(entry.timestamp) >= cutoffTime
    );
  }

  /**
   * Get performance statistics for a time range
   * @param {number} hours - Number of hours to analyze
   * @returns {Object} Performance statistics
   */
  getPerformanceStats(hours = 24) {
    const history = this.getPerformanceHistory(hours);
    if (history.length === 0) return null;

    const stats = {
      averageTps: 0,
      minTps: Infinity,
      maxTps: -Infinity,
      averageCpu: 0,
      maxCpu: -Infinity,
      averageMemoryUsage: 0,
      maxMemoryUsage: -Infinity,
      uptimePercentage: 0,
      lagSpikes: 0 // TPS drops below 15
    };

    let validEntries = 0;
    let lagSpikes = 0;

    history.forEach(entry => {
      if (entry.tps.oneMinute !== null) {
        stats.averageTps += entry.tps.oneMinute;
        stats.minTps = Math.min(stats.minTps, entry.tps.oneMinute);
        stats.maxTps = Math.max(stats.maxTps, entry.tps.oneMinute);
        
        if (entry.tps.oneMinute < 15) {
          lagSpikes++;
        }
      }

      if (entry.cpu.process !== null) {
        stats.averageCpu += entry.cpu.process;
        stats.maxCpu = Math.max(stats.maxCpu, entry.cpu.process);
      }

      if (entry.memory.usedPercentage !== null) {
        stats.averageMemoryUsage += entry.memory.usedPercentage;
        stats.maxMemoryUsage = Math.max(stats.maxMemoryUsage, entry.memory.usedPercentage);
      }

      validEntries++;
    });

    if (validEntries > 0) {
      stats.averageTps = Math.round((stats.averageTps / validEntries) * 100) / 100;
      stats.averageCpu = Math.round((stats.averageCpu / validEntries) * 100) / 100;
      stats.averageMemoryUsage = Math.round((stats.averageMemoryUsage / validEntries) * 100) / 100;
      stats.uptimePercentage = Math.round(((validEntries - lagSpikes) / validEntries) * 100);
      stats.lagSpikes = lagSpikes;
    }

    return stats;
  }

  /**
   * Start automatic performance data collection
   */
  startPerformanceCollection() {
    const RconService = require('./rconService');
    
    // Collect performance data every 5 minutes
    this.performanceInterval = setInterval(async () => {
      try {
        const metrics = await RconService.getServerPerformance();
        if (metrics) {
          this.addToHistory(metrics);
        }
      } catch (error) {
        console.error('❌ Error collecting performance data:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('📊 Performance monitoring started (5-minute intervals)');
  }

  /**
   * Stop automatic performance data collection
   */
  stopPerformanceCollection() {
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
      console.log('📊 Performance monitoring stopped');
    }
  }

  /**
   * Get server health status based on current metrics
   * @returns {Object} Health status
   */
  getServerHealth() {
    const current = this.getCurrentMetrics();
    if (!current) {
      return { status: 'unknown', message: 'No performance data available' };
    }

    const health = {
      status: 'excellent',
      message: 'Server is running optimally',
      issues: []
    };

    // Check TPS
    if (current.tps.oneMinute < 15) {
      health.status = 'critical';
      health.issues.push('Server is experiencing severe lag (TPS < 15)');
    } else if (current.tps.oneMinute < 18) {
      health.status = 'warning';
      health.issues.push('Server is experiencing moderate lag (TPS < 18)');
    }

    // Check CPU
    if (current.cpu.process > 80) {
      health.status = health.status === 'critical' ? 'critical' : 'warning';
      health.issues.push('High CPU usage detected');
    }

    // Check Memory
    if (current.memory.usedPercentage > 90) {
      health.status = 'critical';
      health.issues.push('Memory usage is critically high');
    } else if (current.memory.usedPercentage > 75) {
      health.status = health.status === 'critical' ? 'critical' : 'warning';
      health.issues.push('Memory usage is high');
    }

    if (health.issues.length === 0) {
      health.message = 'Server is running optimally';
    } else {
      health.message = `${health.issues.length} issue(s) detected`;
    }

    return health;
  }

  /**
   * Clear performance history (admin function)
   */
  clearHistory() {
    const previousLength = this.performanceHistory.length;
    this.performanceHistory = [];
    console.log(`🧹 Performance history cleared (${previousLength} entries removed)`);
  }
}

module.exports = new PerformanceService();