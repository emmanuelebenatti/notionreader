# Notion Reader

A beautiful reading app powered by Notion. Save articles, highlight text, and organize your reading list.

![Notion Reader](https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&q=80)

## Features

- 📚 **Article Management** - Save and organize articles with status tracking
- ✨ **Text Highlighting** - Highlight text with multiple colors (yellow, green, blue, pink, orange)
- 🏷️ **Tags & Filters** - Organize with tags and filter by status
- ⭐ **Favorites** - Mark your favorite articles
- 🌓 **Dark Mode** - Beautiful light and dark themes
- 📱 **Responsive** - Works on desktop and mobile

## Quick Start (Demo Mode)

Try Notion Reader instantly with sample articles - no setup required!

```bash
# Clone the repository
git clone https://github.com/yourusername/notion-reader.git
cd notion-reader

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll see sample articles ready to read and highlight!

> **Note**: In demo mode, changes are stored in memory and will reset when you restart the server.

## Connect Your Notion Database

To use with your own Notion database:

### 1. Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name (e.g., "Notion Reader")
4. Select the workspace
5. Copy the "Internal Integration Token"

### 2. Set Up Your Database

Create a Notion database with these properties:

| Property | Type | Required |
|----------|------|----------|
| Name | Title | ✓ |
| URL | URL | |
| Author | Rich text | |
| Status | Status | ✓ |
| Tags | Multi-select | |
| Favourite | Checkbox | |
| Summary AI | Rich text | |
| Reading time | Number | |

**Status options**: "To Read", "Reading", "Read", "Archived"

### 3. Share Database with Integration

1. Open your database in Notion
2. Click "..." menu → "Add connections"
3. Select your integration

### 4. Configure Environment Variables

Create a `.env.local` file:

```env
# Required for Notion connection
NOTION_API_KEY=your_integration_token
NOTION_DATABASE_ID=your_database_id

# Optional: Enable authentication
DATABASE_URL=your_neon_postgresql_url
```

**Finding your Database ID**: Open your database in Notion. The URL looks like:
```
https://notion.so/workspace/[DATABASE_ID]?v=...
```

### 5. Restart the Server

```bash
npm run dev
```

Your articles from Notion will now appear in the app!

## Authentication (Optional)

By default, Notion Reader runs in **open mode** (no login required). To add user authentication and protect your reading list:

### How It Works

The app automatically detects which mode to use:
- **No `DATABASE_URL`** → Open mode (anyone can access)
- **`DATABASE_URL` set** → Protected mode (login required)

### Setup Authentication

#### 1. Create a Neon PostgreSQL Database

1. Sign up at [neon.tech](https://neon.tech) (free tier available)
2. Create a new project
3. Copy the connection string (looks like `postgresql://user:pass@host/db?sslmode=require`)

#### 2. Run the Database Setup Script

In your Neon console SQL Editor, run the script from `scripts/001-create-auth-tables.sql`:

```sql
-- Creates users and sessions tables
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Create an Admin User

Run the password reset script to create your first user:

```bash
node scripts/reset-admin-password.js your@email.com yourpassword
```

#### 4. Configure Environment Variable

Add to your `.env.local`:

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

#### 5. Restart the Server

```bash
npm run dev
```

Now you'll be redirected to `/login` when accessing the app. Use the credentials you created in step 3.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Notion API
- **Auth DB**: Neon PostgreSQL (optional)

## Project Structure

```
├── app/                 # Next.js pages and API routes
│   ├── api/            # API endpoints
│   └── article/[id]/   # Article reader page
├── components/         # React components
├── lib/               
│   ├── notion.ts       # Notion API integration
│   ├── mock-data.ts    # Demo mode sample data
│   └── types.ts        # TypeScript types
└── docs/               # Documentation
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [API Reference](docs/API.md) - API endpoints documentation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Vibecoded by Emmanuele Benatti**
