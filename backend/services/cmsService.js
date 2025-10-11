const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const chokidar = require('chokidar');
const logger = require('../utils/logger');
const marked = import('marked');
const dotenv = require('dotenv');

class CmsService {
  constructor() {
    this.buildingsDir = path.join(process.cwd(), 'buildings');
    this.cache = new Map(); // Use Map for persistent cache
    this.watcher = null;
    this.isInitialized = false;
    this.log = logger.createLogger('CMS');
  }

  /**
   * Initialize the CMS service - preload cache and start file watching
   */
  async initialize() {
    if (this.isInitialized) {
      this.log.warn('CMS Service already initialized');
      return;
    }

    try {
      this.log.info('Initializing CMS Service...');
      
      // Ensure buildings directory exists
      if (!fs.existsSync(this.buildingsDir)) {
        this.log.info(`Creating buildings directory: ${this.buildingsDir}`);
        fs.mkdirSync(this.buildingsDir, { recursive: true});
      }

      // Preload all buildings into cache
      await this.preloadCache();
      
      // Start file watching
      this.startFileWatcher();
      
      this.isInitialized = true;
      this.log.info('CMS Service initialized successfully');
    } catch (error) {
      this.log.error('Failed to initialize CMS Service:', error);
      throw error;
    }
  }

  /**
   * Preload all buildings into cache
   */
  async preloadCache() {
    try {
      this.log.debug('Preloading buildings cache...');
      
      const folders = fs.readdirSync(this.buildingsDir).filter(item => {
        const itemPath = path.join(this.buildingsDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

      let loadedCount = 0;
      for (const folder of folders) {
        const building = await this.parseBuilding(folder);
        if (building) {
          this.cache.set(`building_${folder}`, building);
          loadedCount++;
        }
      }

      // Cache the buildings list
      const buildingsList = Array.from(this.cache.values())
        .sort((a, b) => {
          const nameA = a.metadata.name || a.slug;
          const nameB = b.metadata.name || b.slug;
          return nameA.localeCompare(nameB);
        });
      
      this.cache.set('all_buildings', buildingsList);
      
      this.log.info(`Loaded ${loadedCount} buildings into cache`);
    } catch (error) {
      this.log.error('Error preloading cache:', error);
      throw error;
    }
  }

  /**
   * Start file watching with chokidar
   */
  startFileWatcher() {
    if (this.watcher) {
      this.log.warn('File watcher already running');
      return;
    }

    try {
      this.log.debug('Starting file watcher for buildings directory...');
      
      // Watch the buildings directory and all subdirectories
      this.watcher = chokidar.watch(this.buildingsDir, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        depth: 2 // Watch up to 2 levels deep
      });

      // Handle file changes
      this.watcher
        .on('add', (filePath) => this.handleFileChange('add', filePath))
        .on('change', (filePath) => this.handleFileChange('change', filePath))
        .on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
        .on('addDir', (dirPath) => this.handleDirectoryChange('addDir', dirPath))
        .on('unlinkDir', (dirPath) => this.handleDirectoryChange('unlinkDir', dirPath))
        .on('error', (error) => this.log.error('File watcher error:', error))
        .on('ready', () => this.log.debug('File watcher ready'));

    } catch (error) {
      this.log.error('Failed to start file watcher:', error);
      throw error;
    }
  }

  /**
   * Handle file changes
   */
  async handleFileChange(event, filePath) {
    try {
      const relativePath = path.relative(this.buildingsDir, filePath);
      const parts = relativePath.split(path.sep);
      
      if (parts.length < 2) return; // Ignore files in root buildings directory
      
      const buildingSlug = parts[0];
      
      this.log.debug(`File ${event}: ${relativePath}`);
      
      // Update cache for the affected building
      await this.updateBuildingCache(buildingSlug);
      
    } catch (error) {
      this.log.error(`Error handling file change (${event}) for ${filePath}:`, error);
    }
  }

  /**
   * Handle directory changes
   */
  async handleDirectoryChange(event, dirPath) {
    try {
      const relativePath = path.relative(this.buildingsDir, dirPath);
      const parts = relativePath.split(path.sep);
      
      if (parts.length !== 1) return; // Only handle direct subdirectories
      
      const buildingSlug = parts[0];
      
      this.log.debug(`Directory ${event}: ${buildingSlug}`);
      
      if (event === 'addDir') {
        // New building directory added
        await this.updateBuildingCache(buildingSlug);
      } else if (event === 'unlinkDir') {
        // Building directory removed
        this.removeBuildingFromCache(buildingSlug);
      }
      
    } catch (error) {
      this.log.error(`Error handling directory change (${event}) for ${dirPath}:`, error);
    }
  }

  /**
   * Update cache for a specific building
   */
  async updateBuildingCache(buildingSlug) {
    try {
      const building = await this.parseBuilding(buildingSlug);
      
      if (building) {
        this.cache.set(`building_${buildingSlug}`, building);
        this.log.debug(`Updated cache for building: ${buildingSlug}`);
      } else {
        this.cache.delete(`building_${buildingSlug}`);
        this.log.debug(`Removed invalid building from cache: ${buildingSlug}`);
      }
      
      // Rebuild the all_buildings cache
      this.rebuildBuildingsListCache();
      
    } catch (error) {
      this.log.error(`Error updating cache for building ${buildingSlug}:`, error);
    }
  }

  /**
   * Remove building from cache
   */
  removeBuildingFromCache(buildingSlug) {
    try {
      this.cache.delete(`building_${buildingSlug}`);
      this.log.debug(`Removed building from cache: ${buildingSlug}`);
      
      // Rebuild the all_buildings cache
      this.rebuildBuildingsListCache();
      
    } catch (error) {
      this.log.error(`Error removing building from cache ${buildingSlug}:`, error);
    }
  }

  /**
   * Rebuild the buildings list cache
   */
  rebuildBuildingsListCache() {
    try {
      const buildingsList = Array.from(this.cache.entries())
        .filter(([key]) => key.startsWith('building_'))
        .map(([, building]) => building)
        .sort((a, b) => {
          const nameA = a.metadata.name || a.slug;
          const nameB = b.metadata.name || b.slug;
          return nameA.localeCompare(nameB);
        });
      
      this.cache.set('all_buildings', buildingsList);
      this.log.debug(`Rebuilt buildings list cache (${buildingsList.length} buildings)`);
      
    } catch (error) {
      this.log.error('Error rebuilding buildings list cache:', error);
    }
  }

  /**
   * Parse a single building folder and extract metadata and content
   * @param {string} folderName - Name of the building folder
   * @returns {Object|null} Building data or null if invalid
   */
  async parseBuilding(folderName) {
    try {
      // Load marked module
      const markedModule = await marked;
      const folderPath = path.join(this.buildingsDir, folderName);
      
      if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        return null;
      }

      // Find markdown files in the folder
      const files = fs.readdirSync(folderPath);
      const mdFiles = files.filter(file => file.endsWith('.md'));

      if (mdFiles.length === 0) {
        return null;
      }

      // Use the first markdown file found
      const mdPath = path.join(folderPath, mdFiles[0]);
      const fileContent = fs.readFileSync(mdPath, 'utf8');

      // Parse frontmatter and markdown content
      const { data: metadata, content } = matter(fileContent);
      
      // Process markdown content to fix image paths before converting to HTML
      const processedContent = content.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        (match, alt, src) => {
          // If it's just a filename (no path), convert to full URL
          if (!src.startsWith('http') && !src.startsWith('/') && !src.includes('://')) {
            const fullUrl = `${process.env.DOMAIN || 'http://localhost:3000'}/api/cms/buildings/${folderName}/images/${src}`;
            return `![${alt}](${fullUrl})`;
          }
          return match;
        }
      );
      
      const htmlContent = markedModule.marked.parse(processedContent);

      // Get all image files in the folder
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      );

      // Determine thumbnail
      let thumbnail = null;
      if (metadata.screenshots && metadata.screenshots.length > 0) {
        // Use screenshots from frontmatter if specified
        thumbnail = `${process.env.DOMAIN || 'http://localhost:3000'}/api/cms/buildings/${folderName}/images/${metadata.screenshots[0]}`;
      } else if (imageFiles.length > 0) {
        // Use first image file found
        thumbnail = `${process.env.DOMAIN || 'http://localhost:3000'}/api/cms/buildings/${folderName}/images/${imageFiles[0]}`;
      } else {
        // Try to extract image from markdown content
        const imageMatch = content.match(/!\[.*?\]\(([^)]+)\)/);
        if (imageMatch) {
          thumbnail = `${process.env.DOMAIN || 'http://localhost:3000'}/api/cms/buildings/${folderName}/images/${imageMatch[1]}`;
        }
      }

      return {
        slug: folderName,
        metadata,
        content: htmlContent,
        rawContent: content,
        thumbnail,
        uploadedAt: fs.statSync(mdPath).mtime,
        links: {
          images: imageFiles.map(img => `${process.env.DOMAIN || 'http://localhost:3000'}/api/cms/buildings/${folderName}/images/${img}`),
          self: `${process.env.DOMAIN || 'http://localhost:3000'}/api/cms/buildings/${folderName}`,
        }
      };
    } catch (error) {
      this.log.error(`Error parsing building ${folderName}:`, error);
      return null;
    }
  }

  /**
   * Get all buildings with caching
   * @returns {Array} Array of building objects
   */
  async getAllBuildings() {
    if (!this.isInitialized) {
      throw new Error('CMS Service not initialized. Call initialize() first.');
    }

    // Return from cache
    const cached = this.cache.get('all_buildings');
    if (cached) {
      return cached;
    }

    // If cache is empty, rebuild it
    await this.preloadCache();
    return this.cache.get('all_buildings') || [];
  }

  /**
   * Get a single building by slug
   * @param {string} slug - Building slug (folder name)
   * @returns {Object|null} Building object or null if not found
   */
  async getBuildingBySlug(slug) {
    if (!this.isInitialized) {
      throw new Error('CMS Service not initialized. Call initialize() first.');
    }

    // Return from cache
    const cached = this.cache.get(`building_${slug}`);
    if (cached) {
      return cached;
    }

    // If not in cache, try to parse and cache it
    const building = await this.parseBuilding(slug);
    if (building) {
      this.cache.set(`building_${slug}`, building);
      this.rebuildBuildingsListCache();
    }
    
    return building;
  }

  /**
   * Get image file from building folder
   * @param {string} slug - Building slug
   * @param {string} imageName - Image filename
   * @returns {string|null} Full path to image or null if not found
   */
  getBuildingImagePath(slug, imageName) {
    try {
      const imagePath = path.join(this.buildingsDir, slug, imageName);
      
      if (fs.existsSync(imagePath) && fs.statSync(imagePath).isFile()) {
        return imagePath;
      }
      
      return null;
    } catch (error) {
      this.log.error(`Error getting image ${imageName} for building ${slug}:`, error);
      return null;
    }
  }

  /**
   * Get buildings by category
   * @param {string} category - Category to filter by
   * @returns {Array} Filtered buildings
   */
  async getBuildingsByCategory(category) {
    const allBuildings = await this.getAllBuildings();
    return allBuildings.filter(building => 
      building.metadata.category && 
      building.metadata.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Search buildings by name or content
   * @param {string} query - Search query
   * @returns {Array} Matching buildings
   */
  async searchBuildings(query) {
    const allBuildings = await this.getAllBuildings();
    const searchTerm = query.toLowerCase();
    
    return allBuildings.filter(building => {
      const name = (building.metadata.name || '').toLowerCase();
      const content = building.rawContent.toLowerCase();
      const builder = (building.metadata.builder || '').toLowerCase();
      const category = (building.metadata.category || '').toLowerCase();
      
      return name.includes(searchTerm) || 
             content.includes(searchTerm) || 
             builder.includes(searchTerm) ||
             category.includes(searchTerm);
    });
  }

  /**
   * Clear cache for buildings
   */
  clearCache() {
    const keys = Array.from(this.cache.keys());
    const cmsKeys = keys.filter(key => key.startsWith('building_') || key === 'all_buildings');
    
    cmsKeys.forEach(key => this.cache.delete(key));
    
    this.log.info(`Cleared ${cmsKeys.length} CMS cache entries`);
  }

  /**
   * Gracefully shutdown the service
   */
  async shutdown() {
    if (this.watcher) {
      this.log.info('Stopping file watcher...');
      await this.watcher.close();
      this.watcher = null;
    }
    
    this.clearCache();
    this.isInitialized = false;
    this.log.info('CMS Service shutdown complete');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalEntries = this.cache.size;
    const buildingEntries = Array.from(this.cache.keys()).filter(key => key.startsWith('building_')).length;
    
    return {
      totalEntries,
      buildingEntries,
      hasAllBuildingsList: this.cache.has('all_buildings'),
      isWatcherActive: this.watcher !== null,
      isInitialized: this.isInitialized
    };
  }
}

module.exports = new CmsService();