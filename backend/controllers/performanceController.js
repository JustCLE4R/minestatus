const performanceService = require('../services/performanceService');
const rconService = require('../services/rconService');

class PerformanceController {
  
  /**
   * Get current performance metrics and health status
   */
  async getCurrentMetrics(req, res) {
    try {
      const current = performanceService.getCurrentMetrics();
      const health = performanceService.getServerHealth();
      
      res.json({
        success: true,
        data: {
          current,
          health
        }
      });
    } catch (error) {
      console.error('Error getting current performance:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get performance history for specified hours
   */
  async getPerformanceHistory(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const history = performanceService.getPerformanceHistory(hours);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error getting performance history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get performance statistics for specified hours
   */
  async getPerformanceStats(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const stats = performanceService.getPerformanceStats(hours);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting performance stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Manually refresh performance data from server
   */
  async refreshPerformanceData(req, res) {
    try {
      const metrics = await rconService.getServerPerformance();
      
      if (metrics) {
        performanceService.addToHistory(metrics);
        res.json({
          success: true,
          data: metrics
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve performance data from server'
        });
      }
    } catch (error) {
      console.error('Error refreshing performance data:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get server health status with detailed information
   */
  async getServerHealth(req, res) {
    try {
      const health = performanceService.getServerHealth();
      const current = performanceService.getCurrentMetrics();
      
      // Add additional health context
      const healthDetails = {
        ...health,
        lastUpdate: current?.timestamp || null,
        dataAvailable: current !== null,
        recommendations: this.getHealthRecommendations(health, current)
      };
      
      res.json({
        success: true,
        data: healthDetails
      });
    } catch (error) {
      console.error('Error getting server health:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get performance summary with key metrics
   */
  async getPerformanceSummary(req, res) {
    try {
      const current = performanceService.getCurrentMetrics();
      const stats24h = performanceService.getPerformanceStats(24);
      const health = performanceService.getServerHealth();
      
      const summary = {
        current: {
          tps: current?.tps?.oneMinute || null,
          cpu: current?.cpu?.process || null,
          memory: current?.memory?.usedPercentage || null,
          mspt: current?.mspt?.fiveSecond?.avg || null
        },
        trends24h: stats24h ? {
          averageTps: stats24h.averageTps,
          lagSpikes: stats24h.lagSpikes,
          uptimePercentage: stats24h.uptimePercentage,
          peakMemory: stats24h.maxMemoryUsage
        } : null,
        health: {
          status: health.status,
          issues: health.issues?.length || 0
        },
        lastUpdate: current?.timestamp || null
      };
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting performance summary:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get performance recommendations based on current health
   * @private
   */
  getHealthRecommendations(health, current) {
    const recommendations = [];
    
    if (!current) {
      recommendations.push('Enable performance monitoring to get server optimization suggestions');
      return recommendations;
    }

    // TPS recommendations
    if (current.tps?.oneMinute < 15) {
      recommendations.push('Critical: Consider reducing world size, limiting entities, or upgrading server hardware');
    } else if (current.tps?.oneMinute < 18) {
      recommendations.push('Warning: Monitor plugin performance and consider optimizing heavy operations');
    }

    // CPU recommendations
    if (current.cpu?.process > 80) {
      recommendations.push('High CPU usage detected: Consider optimizing plugins or reducing concurrent operations');
    }

    // Memory recommendations
    if (current.memory?.usedPercentage > 90) {
      recommendations.push('Critical memory usage: Restart server or increase allocated RAM');
    } else if (current.memory?.usedPercentage > 75) {
      recommendations.push('High memory usage: Consider increasing heap size or optimizing memory-intensive plugins');
    }

    // MSPT recommendations
    if (current.mspt?.fiveSecond?.avg > 100) {
      recommendations.push('High tick time detected: Check for laggy plugins or intensive world generation');
    }

    if (recommendations.length === 0) {
      recommendations.push('Server performance is optimal - no immediate action required');
    }

    return recommendations;
  }

  /**
   * Clear performance history (admin function)
   */
  async clearPerformanceHistory(req, res) {
    try {
      // Add admin check here if needed
      performanceService.clearHistory();
      
      res.json({
        success: true,
        message: 'Performance history cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing performance history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new PerformanceController();