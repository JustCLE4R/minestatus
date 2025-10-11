# File-Based CMS System with Real-Time Caching

A modular, file-based CMS system for managing buildings and other content using Markdown files with frontmatter metadata. Features **persistent caching with real-time file watching** for optimal performance.

## Architecture

The CMS system follows the MVC pattern with three main components:

- **Service** (`services/cmsService.js`) - Handles file operations, markdown parsing, caching, and file watching
- **Controller** (`controllers/cmsController.js`) - Manages business logic and API responses
- **Routes** (`routes/cms.js`) - Defines Express.js endpoints

## API Endpoints

### Buildings

#### Get All Buildings
```
GET /api/cms/buildings
```

Query parameters:
- `category`: Filter by category (e.g., "Redstone", "Farm")
- `search`: Search buildings by name, content, builder, or category

Response:
```json
{
  "status": "success",
  "data": {
    "buildings": [
      {
        "slug": "SuperSmelter",
        "name": "Super Smelter",
        "builder": "JustCLE4R",
        "category": "Redstone",
        "coordinates": [120, 65, -300],
        "thumbnail": "/api/cms/buildings/SuperSmelter/images/screenshot1.jpg",
        "uploadedAt": "2025-10-11T15:30:45.123Z",
        "summary": "The **Super Smelter** is an industrial-scale smelting system..."
      }
    ],
    "count": 1
  }
}
```

#### Get Single Building
```
GET /api/cms/buildings/:slug
```

Response includes full HTML content and all metadata.

#### Get Building Image
```
GET /api/cms/buildings/:slug/images/:imageName
```

Serves images with appropriate content-type headers and caching.

### Metadata

#### Get Categories
```
GET /api/cms/categories
```

Returns array of all unique categories.

#### Get Builders
```
GET /api/cms/builders
```

Returns array of all unique builders.

### Utility

#### Get Statistics
```
GET /api/cms/stats
```

Returns CMS statistics like total buildings, categories count, etc.

#### Get Cache Statistics
```
GET /api/cms/cache/stats
```

Returns cache status and performance metrics.

#### Clear Cache
```
POST /api/cms/cache/clear
```

Clears all CMS cache (useful for development).

## Content Structure

### Directory Structure
```
backend/
  buildings/
    SuperSmelter/
      supersmelter.md
      screenshot1.jpg
      screenshot2.jpg
    AnotherBuilding/
      building.md
      image.png
```

### Markdown File Format

Each building should have a markdown file with frontmatter:

```markdown
---
name: Super Smelter
builder: JustCLE4R
finished_at: 2025-09-12
coordinates: [120, 65, -300]
category: Redstone
screenshots: ["screenshot1.jpg", "screenshot2.jpg"]
---

# Building Description

Your markdown content here...

![Image Description](image.jpg)
```

### Supported Frontmatter Fields

- `name`: Display name of the building
- `builder`: Who built it
- `finished_at` or `created_at`: When it was completed
- `coordinates`: Array of [x, y, z] coordinates
- `category`: Category classification
- `screenshots`: Array of image filenames for thumbnails

## Features

- **Automatic Caching**: 10-minute cache for performance
- **Image Serving**: Automatic image serving with proper MIME types
- **Search**: Full-text search across content and metadata
- **Filtering**: Filter by category or search term
- **Thumbnail Detection**: Automatic thumbnail detection from frontmatter or content
- **Error Handling**: Comprehensive error handling and logging

## Usage Examples

### Frontend Integration

```javascript
// Get all buildings
const buildings = await fetch('/api/cms/buildings').then(r => r.json());

// Search buildings
const searchResults = await fetch('/api/cms/buildings?search=smelter').then(r => r.json());

// Get specific building
const building = await fetch('/api/cms/buildings/SuperSmelter').then(r => r.json());

// Get categories for filter dropdown
const categories = await fetch('/api/cms/categories').then(r => r.json());
```

### Adding New Content

1. Create a new folder in `backend/buildings/`
2. Add a markdown file with frontmatter
3. Add any images to the same folder
4. The content will be automatically available via the API

## Dependencies

- `gray-matter`: Frontmatter parsing
- `marked`: Markdown to HTML conversion
- `node-cache`: In-memory caching

## Caching Strategy

The CMS uses **persistent caching with real-time file watching** for optimal performance:

### Initialization
- Cache is preloaded with all buildings when the server starts
- File watcher monitors the `buildings/` directory for changes
- No timeout-based expiration - cache persists until files change

### File Watching
The system monitors:
- **Markdown files** (.md) - content changes
- **Image files** (.jpg, .png, etc.) - asset changes  
- **Directory changes** - new buildings or deletions

### Real-Time Updates
When files change, the cache is automatically updated:
- **File added/changed**: Re-parse and update cache for that building
- **File deleted**: Remove from cache
- **Directory added**: Add new building to cache
- **Directory deleted**: Remove entire building from cache

### Cache Statistics
Monitor cache status via `GET /api/cms/cache/stats`:

```json
{
  "success": true,
  "data": {
    "totalEntries": 5,
    "buildingEntries": 4,
    "hasAllBuildingsList": true,
    "isWatcherActive": true,
    "isInitialized": true
  }
}
```

### Benefits
1. **Instant Updates**: Changes to files are immediately reflected in the API
2. **Better Performance**: No cache expiration means faster response times
3. **Memory Efficient**: Only caches what exists, automatically cleans up
4. **Development Friendly**: Watch files as you edit them
5. **Production Ready**: Graceful shutdown and error handling

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```