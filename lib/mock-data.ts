import type { Article, Highlight, HighlightColor } from "./types"

/**
 * Demo mode is active when NOTION_API_KEY is not set.
 * In demo mode, the app uses mock data instead of connecting to Notion.
 */
export const DEMO_MODE = !process.env.NOTION_API_KEY

/**
 * In-memory storage for demo mode highlights and article updates.
 * These persist only during the session.
 */
let mockHighlights: Map<string, Highlight[]> = new Map()
let mockArticleUpdates: Map<string, Partial<Article>> = new Map()

// Initialize highlights for articles that have pre-existing highlights
function initializeMockHighlights() {
  if (mockHighlights.size === 0) {
    mockHighlights.set("demo-1", [
      {
        id: "highlight-1",
        articleId: "demo-1",
        text: "Notion is a powerful tool that combines notes, databases, and project management",
        startOffset: 0,
        endOffset: 78,
        createdAt: "2024-01-10T10:00:00.000Z",
        color: "yellow" as HighlightColor,
      },
    ])
    mockHighlights.set("demo-3", [
      {
        id: "highlight-2",
        articleId: "demo-3",
        text: "readable and maintainable code",
        startOffset: 0,
        endOffset: 30,
        createdAt: "2024-01-08T14:00:00.000Z",
        color: "green" as HighlightColor,
      },
    ])
  }
}

/**
 * Sample articles for demo mode.
 */
const mockArticlesData: Omit<Article, "highlights">[] = [
  {
    id: "demo-1",
    title: "Getting Started with Notion as a Knowledge Base",
    url: "https://notion.so/help/guides/knowledge-base",
    author: "Notion Team",
    content: `# Getting Started with Notion as a Knowledge Base

Notion is a powerful tool that combines notes, databases, and project management into one flexible workspace. In this guide, we'll explore how to use Notion effectively as your personal knowledge base.

## Why Use Notion?

There are several reasons why Notion stands out:

- **Flexibility**: Create any type of content structure you need
- **Databases**: Organize information with powerful filtering and sorting
- **Collaboration**: Share and work together in real-time
- **Integration**: Connect with other tools through APIs

## Setting Up Your Knowledge Base

### 1. Create a Master Database

Start by creating a database to store all your articles, notes, and resources. Add properties like:

- **Tags** (Multi-select): Categorize your content
- **Status** (Select): Track reading progress
- **Source** (URL): Link to original content
- **Date Added** (Date): When you saved it

### 2. Organize with Views

Create different views of your database:

- **All Items**: See everything
- **By Tag**: Group by category
- **Reading List**: Filter by status

## Best Practices

1. **Consistent tagging**: Develop a tagging system and stick to it
2. **Regular reviews**: Schedule time to review and clean up
3. **Use templates**: Create templates for common content types

## Conclusion

Notion can be as simple or complex as you need. Start small and expand your system as you learn what works for you.`,
    summary: "A comprehensive guide to setting up Notion as your personal knowledge base, covering database setup, organization strategies, and best practices.",
    tags: ["productivity", "notion", "guide"],
    readingTime: 5,
    status: "reading",
    favourite: true,
    createdAt: "2024-01-15T10:30:00.000Z",
    imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80",
  },
  {
    id: "demo-2",
    title: "The Art of Deep Work in a Distracted World",
    url: "https://example.com/deep-work",
    author: "Cal Newport",
    content: `# The Art of Deep Work in a Distracted World

In an age of constant connectivity, the ability to focus deeply has become both rare and valuable. Deep work—professional activities performed in a state of distraction-free concentration—is becoming the superpower of the 21st century.

## What is Deep Work?

Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to:

- Quickly master complicated information
- Produce better results in less time
- Create value that's hard to replicate

## The Deep Work Hypothesis

> "The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy."

## Strategies for Deep Work

### 1. Schedule Deep Work Blocks

Treat deep work like an important meeting:

- Block 2-4 hours of uninterrupted time
- Protect this time fiercely
- Start with your most important task

### 2. Create Rituals

Develop routines that signal it's time for deep work:

- Same location
- Same time of day
- Same starting ritual (coffee, music, etc.)

### 3. Embrace Boredom

Train your brain to resist distraction:

- Don't reach for your phone in every idle moment
- Practice being bored
- Build your concentration muscle

## The Four Rules

1. **Work Deeply**: Schedule and protect deep work time
2. **Embrace Boredom**: Resist the urge for constant stimulation
3. **Quit Social Media**: Be selective about your tools
4. **Drain the Shallows**: Minimize low-value tasks

## Conclusion

Deep work isn't just a productivity hack—it's a path to a more meaningful professional life. Start small, build the habit, and watch your output transform.`,
    summary: "Exploring the concept of deep work and strategies to achieve focused, distraction-free productivity in our hyperconnected world.",
    tags: ["productivity", "focus", "work"],
    readingTime: 8,
    status: "to-read",
    favourite: false,
    createdAt: "2024-01-12T14:20:00.000Z",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
  },
  {
    id: "demo-3",
    title: "Clean Code: Writing Software That Lasts",
    url: "https://example.com/clean-code",
    author: "Robert C. Martin",
    content: `# Clean Code: Writing Software That Lasts

Writing code is easy. Writing clean, readable and maintainable code is an art that takes years to master. Let's explore the principles that separate good code from great code.

## Why Clean Code Matters

Code is read far more often than it's written. The ratio of time spent reading versus writing is well over 10:1. Making your code easy to read makes it easier to write.

## Core Principles

### 1. Meaningful Names

Names should reveal intent:

\`\`\`typescript
// Bad
const d = new Date()
const x = getUsers()

// Good
const currentDate = new Date()
const activeUsers = getActiveUsers()
\`\`\`

### 2. Functions Should Do One Thing

Each function should have a single responsibility:

\`\`\`typescript
// Bad
function processUserData(user) {
  validateUser(user)
  saveToDatabase(user)
  sendEmail(user)
  logActivity(user)
}

// Good
function processUserData(user) {
  const validatedUser = validateUser(user)
  return saveUser(validatedUser)
}
\`\`\`

### 3. Comments Are a Last Resort

Good code should be self-documenting:

\`\`\`typescript
// Bad: Comment explains what
// Check if user is adult
if (user.age >= 18) { }

// Good: Code explains itself
const isAdult = user.age >= 18
if (isAdult) { }
\`\`\`

## The Boy Scout Rule

> "Leave the code better than you found it."

Every time you touch code, make a small improvement. Over time, this compounds into significantly cleaner codebases.

## Key Takeaways

1. Write code for humans first, computers second
2. Keep functions small and focused
3. Choose clear names over clever ones
4. Refactor continuously

Remember: Clean code is not about perfection—it's about constant improvement.`,
    summary: "Essential principles for writing clean, maintainable code including naming conventions, function design, and the importance of continuous refactoring.",
    tags: ["programming", "best-practices", "code"],
    readingTime: 6,
    status: "read",
    favourite: true,
    createdAt: "2024-01-08T09:15:00.000Z",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
  },
  {
    id: "demo-4",
    title: "Introduction to TypeScript for JavaScript Developers",
    url: "https://example.com/typescript-intro",
    author: "Microsoft Developer Team",
    content: `# Introduction to TypeScript for JavaScript Developers

TypeScript is JavaScript with syntax for types. It's a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.

## Why TypeScript?

TypeScript adds optional static typing to JavaScript, which helps catch errors early and makes code more maintainable.

### Benefits

- **Early error detection**: Catch bugs at compile time
- **Better IDE support**: Autocomplete, refactoring, navigation
- **Self-documenting code**: Types serve as documentation
- **Safer refactoring**: The compiler catches breaking changes

## Getting Started

### Basic Types

\`\`\`typescript
// Primitives
let name: string = "Alice"
let age: number = 30
let isActive: boolean = true

// Arrays
let numbers: number[] = [1, 2, 3]
let names: Array<string> = ["Alice", "Bob"]

// Objects
interface User {
  id: number
  name: string
  email?: string // Optional property
}

const user: User = {
  id: 1,
  name: "Alice"
}
\`\`\`

### Functions

\`\`\`typescript
// Function with typed parameters and return type
function greet(name: string): string {
  return \`Hello, \${name}!\`
}

// Arrow function with types
const add = (a: number, b: number): number => a + b
\`\`\`

### Generics

\`\`\`typescript
// Generic function
function identity<T>(arg: T): T {
  return arg
}

// Usage
const num = identity<number>(42)
const str = identity<string>("hello")
\`\`\`

## Best Practices

1. **Enable strict mode**: Use \`"strict": true\` in tsconfig.json
2. **Avoid \`any\`**: It defeats the purpose of TypeScript
3. **Use interfaces**: Define clear contracts for your data
4. **Leverage type inference**: Don't over-annotate

## Conclusion

TypeScript makes JavaScript development more predictable and maintainable. Start by adding types to new code, then gradually type your existing codebase.`,
    summary: "A beginner-friendly introduction to TypeScript, covering basic types, interfaces, generics, and best practices for JavaScript developers.",
    tags: ["typescript", "javascript", "programming"],
    readingTime: 7,
    status: "to-read",
    favourite: false,
    createdAt: "2024-01-05T16:45:00.000Z",
    imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80",
  },
  {
    id: "demo-5",
    title: "Building Better Habits: The Science of Behavior Change",
    url: "https://example.com/habits",
    author: "James Clear",
    content: `# Building Better Habits: The Science of Behavior Change

Habits are the compound interest of self-improvement. Small changes, consistently applied, lead to remarkable results over time.

## The Habit Loop

Every habit consists of four stages:

1. **Cue**: The trigger that initiates the behavior
2. **Craving**: The motivation behind the habit
3. **Response**: The actual habit you perform
4. **Reward**: The benefit you gain from the habit

## The Four Laws of Behavior Change

### 1. Make It Obvious (Cue)

- Use implementation intentions: "I will [BEHAVIOR] at [TIME] in [LOCATION]"
- Use habit stacking: "After [CURRENT HABIT], I will [NEW HABIT]"
- Design your environment to make cues visible

### 2. Make It Attractive (Craving)

- Use temptation bundling: Pair habits you need to do with habits you want to do
- Join a culture where your desired behavior is normal
- Create a motivation ritual before difficult habits

### 3. Make It Easy (Response)

- Reduce friction for good habits
- Prime your environment for future use
- Master the decisive moment—optimize the small choices that deliver outsized impact
- Use the Two-Minute Rule: Start with a habit that takes less than two minutes

### 4. Make It Satisfying (Reward)

- Use reinforcement: Give yourself an immediate reward
- Make "doing nothing" enjoyable when breaking bad habits
- Use a habit tracker—never break the chain
- Never miss twice

## The Plateau of Latent Potential

Progress is often not linear. You may work hard for weeks without seeing results, then experience a breakthrough. This is the "Plateau of Latent Potential."

> "Habits are the compound interest of self-improvement. The same way that money multiplies through compound interest, the effects of your habits multiply as you repeat them."

## Key Takeaways

1. Small habits compound over time
2. Focus on systems, not goals
3. Identity drives behavior—become the type of person who does the habit
4. Environment often matters more than motivation

Start with one small habit today. Your future self will thank you.`,
    summary: "An exploration of the science behind habit formation, including the habit loop, the four laws of behavior change, and practical strategies for building lasting habits.",
    tags: ["self-improvement", "habits", "psychology"],
    readingTime: 9,
    status: "archived",
    favourite: false,
    createdAt: "2024-01-02T11:00:00.000Z",
    imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80",
  },
]

/**
 * Returns all mock articles for demo mode.
 */
export function getMockArticles(): Omit<Article, "content" | "highlights">[] {
  initializeMockHighlights()
  
  return mockArticlesData.map((article) => {
    const updates = mockArticleUpdates.get(article.id) || {}
    const { content, ...preview } = { ...article, ...updates }
    return preview
  })
}

/**
 * Returns a single mock article by ID with content and highlights.
 */
export function getMockArticle(id: string): Article | null {
  initializeMockHighlights()
  
  const article = mockArticlesData.find((a) => a.id === id)
  if (!article) return null

  const updates = mockArticleUpdates.get(id) || {}
  const highlights = mockHighlights.get(id) || []

  return {
    ...article,
    ...updates,
    highlights,
  }
}

/**
 * Adds a highlight to mock storage (in-memory only).
 */
export function addMockHighlight(
  articleId: string,
  text: string,
  color: HighlightColor = "yellow"
): Highlight {
  const highlight: Highlight = {
    id: `mock-highlight-${Date.now()}`,
    articleId,
    text,
    startOffset: 0,
    endOffset: text.length,
    createdAt: new Date().toISOString(),
    color,
  }

  const existing = mockHighlights.get(articleId) || []
  mockHighlights.set(articleId, [...existing, highlight])

  return highlight
}

/**
 * Removes a highlight from mock storage.
 */
export function removeMockHighlight(articleId: string, highlightId: string): boolean {
  const existing = mockHighlights.get(articleId) || []
  const filtered = existing.filter((h) => h.id !== highlightId)
  
  if (filtered.length === existing.length) {
    // Highlight not found, try all articles
    for (const [aid, highlights] of mockHighlights.entries()) {
      const newHighlights = highlights.filter((h) => h.id !== highlightId)
      if (newHighlights.length !== highlights.length) {
        mockHighlights.set(aid, newHighlights)
        return true
      }
    }
    return false
  }
  
  mockHighlights.set(articleId, filtered)
  return true
}

/**
 * Updates highlight color in mock storage.
 */
export function updateMockHighlightColor(highlightId: string, color: HighlightColor): boolean {
  for (const [articleId, highlights] of mockHighlights.entries()) {
    const index = highlights.findIndex((h) => h.id === highlightId)
    if (index !== -1) {
      highlights[index] = { ...highlights[index], color }
      mockHighlights.set(articleId, highlights)
      return true
    }
  }
  return false
}

/**
 * Updates article properties in mock storage (in-memory only).
 */
export function updateMockArticle(
  articleId: string,
  updates: { status?: Article["status"]; favourite?: boolean }
): boolean {
  const article = mockArticlesData.find((a) => a.id === articleId)
  if (!article) return false

  const existing = mockArticleUpdates.get(articleId) || {}
  mockArticleUpdates.set(articleId, { ...existing, ...updates })
  return true
}

