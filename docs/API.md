# Notion Reader - API Documentation

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`

## Authentication

All API routes (except `/api/auth/*`) require authentication via session cookie.

The `auth-token` cookie is set upon successful login and validated by middleware on each request.

---

## Articles

### List All Articles

```http
GET /api/articles
```

Returns all articles from the Notion database (without content).

**Response** `200 OK`
```json
[
  {
    "id": "page-uuid",
    "title": "Article Title",
    "url": "https://example.com/article",
    "author": "Author Name",
    "summary": "AI-generated summary...",
    "tags": ["tech", "ai"],
    "readingTime": 5,
    "status": "to-read",
    "favourite": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "imageUrl": "https://notion.so/image..."
  }
]
```

**Error Response** `500 Internal Server Error`
```json
{
  "error": "Failed to fetch articles"
}
```

---

### Get Single Article

```http
GET /api/articles/:id
```

Returns a single article with full content and highlights.

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| `id` | string | Notion page UUID |

**Response** `200 OK`
```json
{
  "id": "page-uuid",
  "title": "Article Title",
  "url": "https://example.com/article",
  "author": "Author Name",
  "content": "# Markdown content...\n\nParagraph text...",
  "summary": "AI-generated summary...",
  "tags": ["tech", "ai"],
  "readingTime": 5,
  "status": "reading",
  "favourite": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "highlights": [
    {
      "id": "block-uuid",
      "articleId": "page-uuid",
      "text": "Highlighted text",
      "startOffset": 0,
      "endOffset": 16,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "color": "yellow"
    }
  ]
}
```

**Error Responses**
- `404 Not Found`: Article doesn't exist
- `500 Internal Server Error`: Fetch failed

---

### Update Article

```http
PATCH /api/articles/:id
```

Updates article properties (status, favourite).

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| `id` | string | Notion page UUID |

**Request Body**
```json
{
  "status": "read",
  "favourite": true
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `status` | string | No | `"to-read"`, `"reading"`, `"read"`, `"archived"` |
| `favourite` | boolean | No | `true` or `false` |

**Response** `200 OK`

Returns the updated article object.

**Error Responses**
- `500 Internal Server Error`: Update failed

---

## Highlights

### Add Highlight

```http
POST /api/articles/:id/highlights
```

Adds a highlight to an article. The highlight is applied directly to the text in Notion (inline background color). If the text isn't found in the content, a callout block is created as fallback.

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| `id` | string | Article (page) UUID |

**Request Body**
```json
{
  "text": "Text to highlight",
  "color": "yellow"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `text` | string | Yes | The exact text to highlight |
| `color` | string | No | `"yellow"`, `"green"`, `"blue"`, `"pink"`, `"orange"` (default: `"yellow"`) |

**Response** `201 Created`
```json
{
  "id": "block-uuid-or-inline-id",
  "articleId": "page-uuid",
  "text": "Text to highlight",
  "startOffset": 0,
  "endOffset": 17,
  "createdAt": "2024-01-15T11:00:00.000Z",
  "color": "yellow"
}
```

**Error Response** `500 Internal Server Error`
```json
{
  "error": "Failed to add highlight"
}
```

---

### Delete Highlight

```http
DELETE /api/articles/:id/highlights/:highlightId
```

Removes a highlight from an article.

- For inline highlights: Removes the background color from the text
- For callout highlights: Deletes the callout block

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| `id` | string | Article (page) UUID |
| `highlightId` | string | Highlight ID (block UUID or inline ID) |

**Response** `200 OK`
```json
{
  "success": true
}
```

**Error Responses**
- `404 Not Found`: Highlight doesn't exist
- `500 Internal Server Error`: Deletion failed

---

### Update Highlight Color

```http
PATCH /api/articles/:id/highlights/:highlightId
```

Changes the color of an existing highlight.

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| `id` | string | Article (page) UUID |
| `highlightId` | string | Highlight ID |

**Request Body**
```json
{
  "color": "green"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `color` | string | Yes | `"yellow"`, `"green"`, `"blue"`, `"pink"`, `"orange"` |

**Response** `200 OK`
```json
{
  "success": true
}
```

**Error Response** `500 Internal Server Error`
```json
{
  "error": "Failed to update highlight"
}
```

---

## Authentication

### Login

```http
POST /api/auth/login
```

Authenticates a user and creates a session.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Response** `200 OK`
```json
{
  "success": true
}
```

Sets `auth-token` HTTP-only cookie (expires in 7 days).

**Error Responses**
- `400 Bad Request`: Missing email or password
- `200 OK` with error:
  ```json
  {
    "success": false,
    "error": "Invalid credentials"
  }
  ```

---

### Logout

```http
POST /api/auth/logout
```

Ends the current session and clears the auth cookie.

**Response** `200 OK`
```json
{
  "success": true
}
```

---

## TypeScript Types

### Article

```typescript
interface Article {
  id: string
  title: string
  url: string
  author: string
  content: string
  summary: string
  tags: string[]
  readingTime: number
  status: "to-read" | "reading" | "read" | "archived"
  favourite: boolean
  createdAt: string
  highlights: Highlight[]
  imageUrl?: string
}
```

### ArticlePreview

```typescript
// Article without content (used in list views)
interface ArticlePreview {
  id: string
  title: string
  url: string
  author: string
  summary: string
  tags: string[]
  readingTime: number
  status: ArticleStatus
  favourite: boolean
  createdAt: string
  imageUrl?: string
}
```

### Highlight

```typescript
interface Highlight {
  id: string
  articleId: string
  text: string
  startOffset: number
  endOffset: number
  createdAt: string
  color?: "yellow" | "green" | "blue" | "pink" | "orange"
}
```

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently no rate limiting is implemented. The Notion API has its own rate limits:
- 3 requests per second per integration
- Automatic retry with exponential backoff recommended

