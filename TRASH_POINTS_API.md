# Trash Points API Endpoints

Complete API documentation for trash point management.

## Overview

Trash points represent locations where recyclable waste is collected. Only authenticated admin users can create, update, and delete trash points.

## Base URL

```
/api/trash-points
```

## Endpoints

### 1. Create Trash Point

**Endpoint:** `POST /api/trash-points`

**Authentication:** Admin only

**Description:** Create a new trash point with automatic TodayStats initialization.

**Request Body:**

```json
{
  "name": "string (required)",
  "lat": "number (required, -90 to 90)",
  "lng": "number (required, -180 to 180)",
  "detectedObject": "string (required)",
  "detectedImage": "string (required, URL or path)",
  "category": "string (optional: plastico, papel, organico, general)",
  "fillLevel": "number (optional, 0-100, default: 0)",
  "lastCollected": "string (optional, ISO format, default: now)",
  "alert": "string (optional, alert message)"
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/trash-points \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Punto de reciclaje - Entrada Principal",
    "lat": 19.3910,
    "lng": -99.1663,
    "detectedObject": "plastic_bottles",
    "detectedImage": "https://example.com/image.jpg",
    "category": "plastico",
    "fillLevel": 45,
    "lastCollected": "2024-04-15T10:30:00Z"
  }'
```

**Success Response (201):**

```json
{
  "message": "Trash point created successfully",
  "trashPoint": {
    "id": "TP1713179400000",
    "name": "Punto de reciclaje - Entrada Principal",
    "lat": 19.3910,
    "lng": -99.1663,
    "detectedObject": "plastic_bottles",
    "detectedImage": "https://example.com/image.jpg",
    "category": "plastico",
    "fillLevel": 45,
    "lastCollected": "2024-04-15T10:30:00Z",
    "alert": null,
    "todayStats": {
      "id": 1,
      "plastico": 0,
      "papel": 0,
      "organico": 0,
      "general": 0
    }
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid input data
  ```json
  {
    "error": "Invalid input",
    "details": ["lat must be between -90 and 90, lng must be between -180 and 180"]
  }
  ```

- **403 Forbidden:** Not an admin user
- **409 Conflict:** Trash point with this name already exists

---

### 2. List All Trash Points

**Endpoint:** `GET /api/trash-points`

**Authentication:** Not required

**Description:** List all trash points with pagination and optional filters.

**Query Parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| limit | number | 10 | 100 | Items per page |
| offset | number | 0 | - | Starting position |
| category | string | - | - | Filter by category (plastico, papel, organico, general) |
| search | string | - | - | Search trash points by name (case-insensitive) |

**Example Requests:**

```bash
# Get first 10 trash points
curl http://localhost:3000/api/trash-points

# Get trash points with pagination
curl "http://localhost:3000/api/trash-points?limit=20&offset=0"

# Filter by category
curl "http://localhost:3000/api/trash-points?category=plastico"

# Search by name
curl "http://localhost:3000/api/trash-points?search=entrada"

# Combine filters
curl "http://localhost:3000/api/trash-points?category=papel&search=secundaria&limit=5&offset=0"
```

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "TP1713179400000",
      "name": "Punto de reciclaje - Entrada Principal",
      "lat": 19.3910,
      "lng": -99.1663,
      "detectedObject": "plastic_bottles",
      "detectedImage": "https://example.com/image.jpg",
      "category": "plastico",
      "fillLevel": 45,
      "lastCollected": "2024-04-15T10:30:00Z",
      "alert": null,
      "todayStats": {
        "id": 1,
        "plastico": 120,
        "papel": 85,
        "organico": 45,
        "general": 60
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 3. Get Single Trash Point

**Endpoint:** `GET /api/trash-points/[id]`

**Authentication:** Not required

**Description:** Retrieve a single trash point by ID with its TodayStats.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| id | string | Trash point ID (required, path parameter) |

**Example Request:**

```bash
curl http://localhost:3000/api/trash-points/TP1713179400000
```

**Success Response (200):**

```json
{
  "id": "TP1713179400000",
  "name": "Punto de reciclaje - Entrada Principal",
  "lat": 19.3910,
  "lng": -99.1663,
  "detectedObject": "plastic_bottles",
  "detectedImage": "https://example.com/image.jpg",
  "category": "plastico",
  "fillLevel": 45,
  "lastCollected": "2024-04-15T10:30:00Z",
  "alert": null,
  "todayStats": {
    "id": 1,
    "plastico": 120,
    "papel": 85,
    "organico": 45,
    "general": 60
  }
}
```

**Error Response:**

- **404 Not Found:** Trash point does not exist
  ```json
  {
    "error": "Trash point not found"
  }
  ```

---

### 4. Update Trash Point

**Endpoint:** `PATCH /api/trash-points/[id]`

**Authentication:** Admin only

**Description:** Update one or more fields of a trash point.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| id | string | Trash point ID (required, path parameter) |

**Request Body:** (All fields optional)

```json
{
  "name": "string (optional)",
  "lat": "number (optional)",
  "lng": "number (optional)",
  "detectedObject": "string (optional)",
  "detectedImage": "string (optional)",
  "category": "string (optional)",
  "fillLevel": "number (optional, 0-100)",
  "lastCollected": "string (optional, ISO format)",
  "alert": "string or null (optional)"
}
```

**Example Request:**

```bash
curl -X PATCH http://localhost:3000/api/trash-points/TP1713179400000 \
  -H "Content-Type: application/json" \
  -d '{
    "fillLevel": 75,
    "alert": "Nearly full - please collect"
  }'
```

**Success Response (200):**

```json
{
  "message": "Trash point updated successfully",
  "trashPoint": {
    "id": "TP1713179400000",
    "name": "Punto de reciclaje - Entrada Principal",
    "lat": 19.3910,
    "lng": -99.1663,
    "detectedObject": "plastic_bottles",
    "detectedImage": "https://example.com/image.jpg",
    "category": "plastico",
    "fillLevel": 75,
    "lastCollected": "2024-04-15T10:30:00Z",
    "alert": "Nearly full - please collect",
    "todayStats": {
      "id": 1,
      "plastico": 120,
      "papel": 85,
      "organico": 45,
      "general": 60
    }
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid input
- **403 Forbidden:** Not an admin user
- **404 Not Found:** Trash point does not exist

---

### 5. Delete Trash Point

**Endpoint:** `DELETE /api/trash-points/[id]`

**Authentication:** Admin only

**Description:** Delete a trash point and its associated TodayStats.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| id | string | Trash point ID (required, path parameter) |

**Example Request:**

```bash
curl -X DELETE http://localhost:3000/api/trash-points/TP1713179400000
```

**Success Response (200):**

```json
{
  "message": "Trash point deleted successfully"
}
```

**Error Responses:**

- **403 Forbidden:** Not an admin user
- **404 Not Found:** Trash point does not exist
- **500 Internal Server Error:** Failed to delete

---

## Data Types

### TrashPointCategory

Valid category values:

- `plastico` - Plastic waste
- `papel` - Paper waste
- `organico` - Organic waste
- `general` - General waste

### TodayStats

Daily statistics for trash collection:

```json
{
  "id": "number",
  "plastico": "number - plastic items collected today",
  "papel": "number - paper items collected today",
  "organico": "number - organic items collected today",
  "general": "number - general items collected today"
}
```

---

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful GET, PATCH request |
| 201 | Created | Successful POST request |
| 400 | Bad Request | Invalid input data |
| 403 | Forbidden | Not authorized (not admin) |
| 404 | Not Found | Trash point doesn't exist |
| 409 | Conflict | Trash point name already exists |
| 500 | Server Error | Internal server error |

---

## Authentication

Protected endpoints (POST, PATCH, DELETE) require:

1. Valid NextAuth session (logged in)
2. Admin role (`role = 'admin'` in database)

Sessions are stored in httpOnly cookies automatically by NextAuth.

---

## Validation Rules

### Coordinates

- `lat`: Must be a number between -90 and 90
- `lng`: Must be a number between -180 and 180

### Fill Level

- Must be a number between 0 and 100 (percentage)

### Category

- Must be one of: `plastico`, `papel`, `organico`, `general`
- Optional field (can be null)

### Name

- Required for create
- Must be non-empty string
- Currently used as secondary identifier

### Timestamps

- Timestamps use ISO 8601 format: `2024-04-15T10:30:00Z`
- Optional; server uses current time if not provided

---

## Example Workflows

### Workflow 1: Create and Monitor Trash Point

```bash
# 1. Create trash point
curl -X POST http://localhost:3000/api/trash-points \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Punto Principal",
    "lat": 19.3910,
    "lng": -99.1663,
    "detectedObject": "plastic",
    "detectedImage": "image.jpg",
    "category": "plastico"
  }'

# 2. Check its status
curl http://localhost:3000/api/trash-points/TP1234567890

# 3. Update fill level
curl -X PATCH http://localhost:3000/api/trash-points/TP1234567890 \
  -H "Content-Type: application/json" \
  -d '{"fillLevel": 80}'
```

### Workflow 2: Search and Filter

```bash
# Search all plastic waste points
curl "http://localhost:3000/api/trash-points?category=plastico"

# Search by name and paginate
curl "http://localhost:3000/api/trash-points?search=entrada&limit=5&offset=0"
```

---

## Notes

- TodayStats are automatically created when a trash point is created
- TodayStats are cascaded deleted when trash point is deleted
- All coordinates should be decimal degrees format (WGS84)
- Times are stored and returned in ISO 8601 format (UTC)
