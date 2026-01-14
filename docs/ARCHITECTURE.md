# Notion Reader - Architecture Documentation

## Overview

Notion Reader is a reading app that allows users to save, read, and highlight articles stored in Notion. The app uses a hybrid backend architecture combining Notion as the primary content database and Neon PostgreSQL for authentication.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Home Page  │  │Article Page │  │      Login Page         │  │
│  │  (SSR)      │  │  (CSR)      │  │        (CSR)            │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     API Routes                               ││
│  │  /api/articles          GET - List articles                  ││
│  │  /api/articles/[id]     GET/PATCH - Single article           ││
│  │  /api/articles/[id]/highlights      POST - Add highlight     ││
│  │  /api/articles/[id]/highlights/[id] DELETE/PATCH - Manage    ││
│  │  /api/auth/login        POST - Authenticate                  ││
│  │  /api/auth/logout       POST - End session                   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │     lib/notion.ts    │  │         lib/auth.ts              │ │
│  │  - getArticles()     │  │  - login()                       │ │
│  │  - getArticle()      │  │  - logout()                      │ │
│  │  - addHighlight()    │  │  - isAuthenticated()             │ │
│  │  - removeHighlight() │  │  - getCurrentUser()              │ │
│  │  - updateArticle()   │  │                                  │ │
│  └──────────┬───────────┘  └───────────────┬──────────────────┘ │
└─────────────┼──────────────────────────────┼────────────────────┘
              │                              │
              ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────────────┐
│      NOTION API         │    │     NEON POSTGRESQL             │
│  ┌───────────────────┐  │    │  ┌───────────────────────────┐  │
│  │ Articles Database │  │    │  │   users                   │  │
│  │ - Name (title)    │  │    │  │   - id                    │  │
│  │ - URL             │  │    │  │   - email                 │  │
│  │ - Author          │  │    │  │   - password_hash         │  │
│  │ - Status          │  │    │  │   - name                  │  │
│  │ - Tags            │  │    │  └───────────────────────────┘  │
│  │ - Favourite       │  │    │  ┌───────────────────────────┐  │
│  │ - Summary AI      │  │    │  │   sessions                │  │
│  │ - Reading time    │  │    │  │   - id                    │  │
│  │ - Created         │  │    │  │   - user_id               │  │
│  │ - Content (blocks)│  │    │  │   - token                 │  │
│  └───────────────────┘  │    │  │   - expires_at            │  │
└─────────────────────────┘    │  └───────────────────────────┘  │
                               └─────────────────────────────────┘
```

## Data Flow

### Reading Articles

```
1. User visits homepage
   └─> Server Component calls getArticles() directly
       └─> Notion API: databases.query()
           └─> Returns article list (without content)

2. User clicks on article
   └─> Client fetches /api/articles/[id]
       └─> getArticle() calls:
           ├─> notion.pages.retrieve() - Get metadata
           └─> fetchAllBlocks() - Get content (paginated)
               └─> blocksToMarkdown() - Convert to readable format
```

### Highlighting Text

```
1. User selects text in article reader
   └─> handleTextSelection() captures selection
       └─> POST /api/articles/[id]/highlights
           └─> addHighlight()
               ├─> highlightTextInNotionContent()
               │   └─> Applies background color to text in Notion
               └─> Falls back to callout block if text not found
```

### Authentication Flow

The app supports two modes based on `DATABASE_URL` environment variable:

```
Request → proxy.ts → DATABASE_URL exists?
                     │
                     ├─ NO  → Demo/Open Mode
                     │        └─> Allow all requests (no login required)
                     │        └─> Redirect /login to /
                     │
                     └─ YES → Protected Mode
                              └─> Check auth-token cookie
                                  ├─> Missing → Redirect to /login
                                  └─> Present → Validate session in PostgreSQL
                                                ├─> Invalid → Redirect to /login
                                                └─> Valid → Allow request
```

#### Login Process (Protected Mode)

```
1. User submits login form
   └─> POST /api/auth/login
       └─> login() in lib/auth.ts
           ├─> getUserByEmail() - Fetch from PostgreSQL
           ├─> bcrypt.compare() - Verify password
           ├─> createSession() - Store in PostgreSQL
           └─> Set 'auth-token' cookie

2. Protected route access
   └─> proxy.ts intercepts request
       └─> Verifies session in PostgreSQL
           └─> Redirect to /login if invalid
```

#### Demo Mode Detection

```typescript
// proxy.ts
if (!process.env.DATABASE_URL) {
  // Demo mode: skip authentication
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }
  return NextResponse.next()
}
```

## Notion Database Schema

Your Notion database must have the following properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| Name | Title | Yes | Article title |
| URL | URL | No | Source URL |
| Author | Rich text | No | Article author |
| Status | Status | Yes | "To Read", "Reading", "Read", "Archived" |
| Tags | Multi-select | No | Category tags |
| Favourite | Checkbox | No | Starred articles |
| Summary AI | Rich text | No | AI-generated summary |
| Reading time | Number | No | Estimated reading time (minutes) |
| Created | Created time | Auto | When article was added |

### Status Values
The Status property must be a **Status** type (not Select) with these options:
- `To Read` - Articles to be read
- `Reading` - Currently reading
- `Read` - Finished reading
- `Archived` - Archived articles

### Content Storage
Article content is stored as Notion blocks within each page:
- Paragraphs, headings, lists, code blocks
- Images (external URLs or uploaded)
- Highlights stored as:
  - **Inline**: Text with `*_background` color annotation
  - **Fallback**: Callout blocks with 📌 prefix

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NOTION_API_KEY` | No* | Notion integration API key |
| `NOTION_DATABASE_ID` | No* | ID of the articles database |
| `DATABASE_URL` | No | Neon PostgreSQL connection string for auth |

*Without Notion credentials, the app runs in demo mode with sample articles.

### Setting Up Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration with "Read content" and "Update content" capabilities
3. Copy the API key to `NOTION_API_KEY`
4. Share your articles database with the integration
5. Copy the database ID from the URL: `notion.so/[workspace]/[DATABASE_ID]?v=...`

## Key Components

### Frontend

| Component | Purpose |
|-----------|---------|
| `ArticleReader` | Main reading view with highlighting, markdown rendering |
| `ArticleList` | Grid/list view with search and filters |
| `ArticleCard` | Individual article preview card |
| `Header` | Navigation and theme toggle |

### Backend Libraries

| File | Purpose |
|------|---------|
| `lib/notion.ts` | All Notion API interactions |
| `lib/auth.ts` | Authentication server actions |
| `lib/db.ts` | PostgreSQL queries for auth |
| `lib/types.ts` | Shared TypeScript interfaces |

## Highlight System

The app supports two highlight storage methods in Notion:

### 1. Inline Highlights (Primary)
Text is highlighted directly in the content by applying background color:
```typescript
// Rich text annotation
{ color: "yellow_background" }
```

Supported colors: `yellow`, `green`, `blue`, `pink`, `orange`

### 2. Callout Blocks (Fallback)
If text isn't found in content, a callout block is appended:
```
💡 📌 "Highlighted text here"
```

### Highlight Extraction
On article load, highlights are extracted from:
1. Text with `*_background` annotations
2. Callout blocks starting with "📌" or "Highlighted:"

## Security Considerations

- Passwords hashed with bcrypt (cost factor 10)
- Session tokens are 32-byte random hex strings
- Sessions expire after 7 days
- HTTP-only cookies prevent XSS access
- Middleware validates sessions on protected routes

## Performance Optimizations

- Notion blocks fetched with pagination (100 per request)
- Article list fetched without content (lighter payloads)
- Optimistic UI updates for highlights
- Server Components for initial data fetch
- Client-side caching via React state

