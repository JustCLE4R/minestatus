const cmsService = require('../services/cmsService');
const jsend = require('../services/jsendService');
const path = require('path');
const fs = require('fs');

class CmsController {
  /**
   * GET /api/cms/buildings
   * Get all buildings with optional filtering
   */
  async getAllBuildings(req, res) {
    try {
      const { category, search } = req.query;

      let buildings;

      if (search) {
        buildings = await cmsService.searchBuildings(search);
      } else if (category) {
        buildings = await cmsService.getBuildingsByCategory(category);
      } else {
        buildings = await cmsService.getAllBuildings();
      }

      // Transform for API response - exclude raw content for list view
      const apiResponse = buildings.map(building => ({
        slug: building.slug,
        name: building.metadata.name,
        builder: building.metadata.builder,
        category: building.metadata.category,
        coordinates: building.metadata.coordinates,
        thumbnail: building.thumbnail,
        summary: building.content.substring(0, 200) + (building.content.length > 200 ? '...' : ''),
        links: building.links,
        uploadedAt: building.uploadedAt,
      }));

      jsend.success(res, {
        buildings: apiResponse,
        count: apiResponse.length
      });
    } catch (error) {
      console.error('Error in getAllBuildings:', error);
      jsend.error(res, 'Failed to retrieve buildings');
    }
  }

  /**
   * GET /api/cms/buildings/:slug
   * Get single building by slug
   */
  async getBuildingBySlug(req, res) {
    try {
      const { slug } = req.params;

      if (!slug) {
        return jsend.fail(res, {
          slug: "Building slug is required"
        });
      }

      const building = await cmsService.getBuildingBySlug(slug);

      if (!building) {
        return jsend.fail(res, {
          slug: "Building not found"
        }, 404);
      }

      jsend.success(res, building);
    } catch (error) {
      console.error(`Error in getBuildingBySlug for ${req.params.slug}:`, error);
      jsend.error(res, 'Failed to retrieve building');
    }
  }

  /**
   * GET /api/cms/buildings/:slug/images/:imageName
   * Serve building images
   */
  async getBuildingImage(req, res) {
    try {
      const { slug, imageName } = req.params;

      if (!slug || !imageName) {
        return jsend.fail(res, {
          slug: !slug ? "Building slug is required" : undefined,
          imageName: !imageName ? "Image name is required" : undefined
        });
      }

      const imagePath = cmsService.getBuildingImagePath(slug, imageName);

      if (!imagePath) {
        return jsend.fail(res, {
          image: "Image not found"
        }, 404);
      }

      // Set appropriate content type based on file extension
      const ext = path.extname(imageName).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.set('Content-Type', contentType);

      // Set cache headers for images (cache for 1 hour)
      res.set('Cache-Control', 'public, max-age=3600');

      // Stream the image file
      const fileStream = fs.createReadStream(imagePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error(`Error streaming image ${imageName}:`, error);
        if (!res.headersSent) {
          jsend.error(res, 'Failed to serve image');
        }
      });

    } catch (error) {
      console.error(`Error in getBuildingImage for ${req.params.slug}/${req.params.imageName}:`, error);
      jsend.error(res, 'Failed to serve image');
    }
  }

  /**
   * GET /api/cms/categories
   * Get all unique categories
   */
  async getCategories(req, res) {
    try {
      const buildings = await cmsService.getAllBuildings();
      
      const categories = [...new Set(
        buildings
          .map(building => building.metadata.category)
          .filter(category => category && category.trim() !== '')
      )].sort();

      jsend.success(res, {
        categories: categories
      });
    } catch (error) {
      console.error('Error in getCategories:', error);
      jsend.error(res, 'Failed to retrieve categories');
    }
  }

  /**
   * GET /api/cms/builders
   * Get all unique builders
   */
  async getBuilders(req, res) {
    try {
      const buildings = await cmsService.getAllBuildings();
      
      const builders = [...new Set(
        buildings
          .map(building => building.metadata.builder)
          .filter(builder => builder && builder.trim() !== '')
      )].sort();

      jsend.success(res, {
        builders: builders
      });
    } catch (error) {
      console.error('Error in getBuilders:', error);
      jsend.error(res, 'Failed to retrieve builders');
    }
  }

  /**
   * POST /api/cms/cache/clear
   * Clear CMS cache (useful for development)
   */
  async clearCache(req, res) {
    try {
      cmsService.clearCache();
      
      jsend.success(res, {
        message: "CMS cache cleared successfully"
      });
    } catch (error) {
      console.error('Error in clearCache:', error);
      jsend.error(res, 'Failed to clear cache');
    }
  }

  /**
   * GET /api/cms/cache/stats
   * Get cache statistics and status
   */
  async getCacheStats(req, res) {
    try {
      const stats = cmsService.getCacheStats();
      
      jsend.success(res, stats);
    } catch (error) {
      console.error('Error in getCacheStats:', error);
      jsend.error(res, 'Failed to retrieve cache statistics');
    }
  }

  /**
   * GET /api/cms/stats
   * Get CMS statistics
   */
  async getStats(req, res) {
    try {
      const buildings = await cmsService.getAllBuildings();
      
      const stats = {
        totalBuildings: buildings.length,
        categoriesCount: new Set(buildings.map(b => b.metadata.category).filter(Boolean)).size,
        buildersCount: new Set(buildings.map(b => b.metadata.builder).filter(Boolean)).size,
        lastUploaded: buildings.length > 0 ? Math.max(...buildings.map(b => new Date(b.uploadedAt).getTime())) : null
      };

      jsend.success(res, stats);
    } catch (error) {
      console.error('Error in getStats:', error);
      jsend.error(res, 'Failed to retrieve statistics');
    }
  }
}

module.exports = new CmsController();