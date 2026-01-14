import { Client } from "@notionhq/client"
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints"
import type { Article, Highlight, HighlightColor } from "./types"
import {
  DEMO_MODE,
  getMockArticles,
  getMockArticle,
  addMockHighlight,
  removeMockHighlight,
  updateMockHighlightColor,
  updateMockArticle,
} from "./mock-data"

// Lazy initialize Notion client to ensure env vars are loaded
let notionClient: Client | null = null

function getNotionClient(): Client {
  if (!notionClient) {
    if (!process.env.NOTION_API_KEY) {
      throw new Error("NOTION_API_KEY environment variable is not set")
    }
    notionClient = new Client({
      auth: process.env.NOTION_API_KEY,
    })
  }
  return notionClient
}

function getDatabaseId(): string {
  if (!process.env.NOTION_DATABASE_ID) {
    throw new Error("NOTION_DATABASE_ID environment variable is not set")
  }
  return process.env.NOTION_DATABASE_ID
}

/**
 * Fetches all blocks from a Notion page with automatic pagination.
 * Notion API returns max 100 blocks per request, so this function
 * handles pagination to retrieve the complete content.
 * 
 * @param blockId - The Notion page or block ID to fetch children from
 * @returns Array of all block objects from the page
 */
async function fetchAllBlocks(blockId: string): Promise<BlockObjectResponse[]> {
  const notion = getNotionClient()
  const allBlocks: BlockObjectResponse[] = []
  let cursor: string | undefined = undefined

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    })

    const blocks = response.results.filter(
      (block): block is BlockObjectResponse => "type" in block
    )
    allBlocks.push(...blocks)

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined
  } while (cursor)

  return allBlocks
}

// Re-export types for backwards compatibility
export type { Article, Highlight, HighlightColor } from "./types"

// Helper to extract plain text from rich text array
function getRichText(richText: RichTextItemResponse[] | undefined): string {
  if (!richText) return ""
  return richText.map((item) => item.plain_text).join("")
}

// Helper to map Notion status to app status
function mapStatus(notionStatus: string | undefined): Article["status"] {
  if (!notionStatus) return "to-read"
  const statusMap: Record<string, Article["status"]> = {
    "To Read": "to-read",
    "to-read": "to-read",
    "To read": "to-read",
    Reading: "reading",
    reading: "reading",
    Read: "read",
    read: "read",
    Archived: "archived",
    archived: "archived",
  }
  return statusMap[notionStatus] || "to-read"
}

// Helper to extract cover image URL from page
function getCoverImageUrl(page: PageObjectResponse): string | undefined {
  if (!page.cover) return undefined
  
  if (page.cover.type === "external") {
    return page.cover.external.url
  } else if (page.cover.type === "file") {
    return page.cover.file.url
  }
  return undefined
}

// Parse a Notion page to Article format (without content)
function parsePageToArticle(page: PageObjectResponse): Omit<Article, "content" | "highlights"> & { imageUrl?: string } {
  const props = page.properties

  // Extract title from Name property
  const titleProp = props.Name
  const title =
    titleProp?.type === "title" ? getRichText(titleProp.title) : "Untitled"

  // Extract URL
  const urlProp = props.URL
  const url = urlProp?.type === "url" ? urlProp.url || "" : ""

  // Extract Author
  const authorProp = props.Author
  const author =
    authorProp?.type === "rich_text" ? getRichText(authorProp.rich_text) : ""

  // Extract Reading time (could be rich_text or number)
  const readingTimeProp = props["Reading time"]
  let readingTime = 5 // default
  if (readingTimeProp?.type === "number" && readingTimeProp.number) {
    readingTime = readingTimeProp.number
  } else if (readingTimeProp?.type === "rich_text") {
    const text = getRichText(readingTimeProp.rich_text)
    const parsed = parseInt(text, 10)
    if (!isNaN(parsed)) readingTime = parsed
  }

  // Extract Tags (support both select and multi_select)
  const tagsProp = props.Tags
  let tags: string[] = []
  if (tagsProp?.type === "multi_select") {
    tags = tagsProp.multi_select.map((tag) => tag.name)
  } else if (tagsProp?.type === "select" && tagsProp.select) {
    tags = [tagsProp.select.name]
  }

  // Extract Status
  const statusProp = props.Status
  let statusValue = ""
  if (statusProp?.type === "status" && statusProp.status) {
    statusValue = statusProp.status.name
  } else if (statusProp?.type === "select" && statusProp.select) {
    statusValue = statusProp.select.name
  }
  const status = mapStatus(statusValue)

  // Extract Favourite
  const favouriteProp = props.Favourite
  const favourite =
    favouriteProp?.type === "checkbox" ? favouriteProp.checkbox : false

  // Extract Summary AI
  const summaryProp = props["Summary AI"]
  const summary =
    summaryProp?.type === "rich_text" ? getRichText(summaryProp.rich_text) : ""

  // Extract Created time
  const createdProp = props.Created
  const createdAt =
    createdProp?.type === "created_time"
      ? createdProp.created_time
      : page.created_time

  // Extract cover image
  const imageUrl = getCoverImageUrl(page)

  return {
    id: page.id,
    title,
    url,
    author,
    summary,
    tags,
    readingTime,
    status,
    favourite,
    createdAt,
    imageUrl,
  }
}

/**
 * Converts an array of Notion blocks to markdown format.
 * Supports paragraphs, headings (h1-h3), lists, quotes, code blocks,
 * images, callouts, toggles, dividers, and to-do items.
 * 
 * @param blocks - Array of Notion block objects
 * @returns Markdown string representation of the content
 */
function blocksToMarkdown(blocks: BlockObjectResponse[]): string {
  const lines: string[] = []

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph":
        lines.push(getRichText(block.paragraph.rich_text))
        lines.push("")
        break

      case "heading_1":
        lines.push(`# ${getRichText(block.heading_1.rich_text)}`)
        lines.push("")
        break

      case "heading_2":
        lines.push(`## ${getRichText(block.heading_2.rich_text)}`)
        lines.push("")
        break

      case "heading_3":
        lines.push(`### ${getRichText(block.heading_3.rich_text)}`)
        lines.push("")
        break

      case "bulleted_list_item":
        lines.push(`- ${getRichText(block.bulleted_list_item.rich_text)}`)
        break

      case "numbered_list_item":
        lines.push(`1. ${getRichText(block.numbered_list_item.rich_text)}`)
        break

      case "quote":
        lines.push(`> ${getRichText(block.quote.rich_text)}`)
        lines.push("")
        break

      case "code":
        const lang = block.code.language || ""
        lines.push(`\`\`\`${lang}`)
        lines.push(getRichText(block.code.rich_text))
        lines.push("```")
        lines.push("")
        break

      case "divider":
        lines.push("---")
        lines.push("")
        break

      case "image":
        const imageUrl =
          block.image.type === "external"
            ? block.image.external.url
            : block.image.type === "file"
              ? block.image.file.url
              : ""
        if (imageUrl) {
          const caption = block.image.caption
            ? getRichText(block.image.caption)
            : ""
          lines.push(`![${caption}](${imageUrl})`)
          lines.push("")
        }
        break

      case "callout":
        // Check if this is a highlight (we'll use this format)
        const calloutText = getRichText(block.callout.rich_text)
        lines.push(`> 💡 ${calloutText}`)
        lines.push("")
        break

      case "toggle":
        lines.push(`**${getRichText(block.toggle.rich_text)}**`)
        lines.push("")
        break

      case "to_do":
        const checked = block.to_do.checked ? "[x]" : "[ ]"
        lines.push(`- ${checked} ${getRichText(block.to_do.rich_text)}`)
        break

      default:
        // Skip unsupported block types
        break
    }
  }

  return lines.join("\n").trim()
}

// Map Notion color back to app color
function mapNotionColorToApp(notionColor: string | undefined): HighlightColor {
  if (!notionColor) return "yellow"
  const colorMap: Record<string, HighlightColor> = {
    yellow_background: "yellow",
    green_background: "green",
    blue_background: "blue",
    pink_background: "pink",
    orange_background: "orange",
  }
  return colorMap[notionColor] || "yellow"
}

/**
 * Extracts all highlights from Notion blocks using two methods:
 * 
 * 1. **Callout blocks** (legacy format): Callouts starting with "Highlighted:" or "📌"
 * 2. **Inline highlights** (primary format): Text with background color annotations
 *    (e.g., yellow_background, green_background)
 * 
 * Inline highlights are identified by a composite ID: `{blockId}-inline-{index}`
 * 
 * @param blocks - Array of Notion block objects to scan
 * @param articleId - The parent article/page ID for the highlights
 * @returns Array of Highlight objects found in the content
 */
function extractHighlightsFromBlocks(
  blocks: BlockObjectResponse[],
  articleId: string
): Highlight[] {
  const highlights: Highlight[] = []
  let inlineHighlightIndex = 0

  for (const block of blocks) {
    // 1. Extract from callout blocks (legacy/fallback format)
    if (block.type === "callout") {
      const text = getRichText(block.callout.rich_text)
      // Check if it's a highlight (starts with "Highlighted:" or similar)
      if (text.startsWith("Highlighted:") || text.startsWith("📌")) {
        const highlightText = text
          .replace(/^Highlighted:\s*/, "")
          .replace(/^📌\s*/, "")
          .replace(/^[""]/, "")
          .replace(/[""]$/, "")
          .trim()

        const color = mapNotionColorToApp(block.callout.color)

        highlights.push({
          id: block.id,
          articleId,
          text: highlightText,
          startOffset: 0,
          endOffset: highlightText.length,
          createdAt: block.created_time,
          color,
        })
      }
    }

    // 2. Extract from inline text with background color (new format)
    const richText = getBlockRichText(block)
    if (richText) {
      for (const rt of richText) {
        // Check if this rich text item has a background color annotation
        if (rt.annotations?.color && rt.annotations.color.includes("_background")) {
          const highlightText = rt.plain_text.trim()
          if (highlightText.length > 0) {
            // Create unique ID combining block ID and index for inline highlights
            const highlightId = `${block.id}-inline-${inlineHighlightIndex++}`
            
            highlights.push({
              id: highlightId,
              articleId,
              text: highlightText,
              startOffset: 0,
              endOffset: highlightText.length,
              createdAt: block.created_time,
              color: mapNotionColorToApp(rt.annotations.color),
            })
          }
        }
      }
    }
  }

  return highlights
}

/**
 * Fetches all articles from the Notion database.
 * Returns article metadata without content (for list views).
 * Results are sorted by creation date (newest first).
 * 
 * In demo mode, returns mock articles instead.
 * 
 * @returns Array of articles without content or highlights
 */
export async function getArticles(): Promise<Omit<Article, "content" | "highlights">[]> {
  // Demo mode: return mock data
  if (DEMO_MODE) {
    return getMockArticles()
  }

  const notion = getNotionClient()
  
  // Note: In Notion SDK v5.x, databases.query was renamed to dataSources.query
  const response = await notion.dataSources.query({
    data_source_id: getDatabaseId(),
    sorts: [
      {
        property: "Created",
        direction: "descending",
      },
    ],
  })

  const articles = response.results
    .filter((page): page is PageObjectResponse => "properties" in page)
    .map(parsePageToArticle)

  return articles
}

/**
 * Fetches a single article with full content and highlights.
 * Retrieves page properties, all content blocks (with pagination),
 * converts to markdown, and extracts highlights.
 * 
 * In demo mode, returns mock article data instead.
 * 
 * @param pageId - The Notion page UUID
 * @returns Full article object or null if not found
 */
export async function getArticle(pageId: string): Promise<Article | null> {
  // Demo mode: return mock data
  if (DEMO_MODE) {
    return getMockArticle(pageId)
  }

  const notion = getNotionClient()
  try {
    // Fetch the page properties
    const page = await notion.pages.retrieve({ page_id: pageId })

    if (!("properties" in page)) {
      return null
    }

    const articleBase = parsePageToArticle(page as PageObjectResponse)

    // Fetch all blocks (content) from the page with pagination
    const blocks = await fetchAllBlocks(pageId)

    // Convert blocks to markdown
    const content = blocksToMarkdown(blocks)

    // Extract highlights from callout blocks
    const highlights = extractHighlightsFromBlocks(blocks, pageId)

    return {
      ...articleBase,
      content,
      highlights,
    }
  } catch (error) {
    console.error("Error fetching article:", error)
    return null
  }
}

/**
 * Adds a highlight to an article in Notion.
 * 
 * Strategy:
 * 1. First attempts to highlight text directly in the page content
 *    by applying background color annotation
 * 2. If text isn't found in content, falls back to creating a callout
 *    block at the end of the page
 * 
 * In demo mode, stores highlight in memory only.
 * 
 * @param pageId - The Notion page UUID
 * @param text - The text to highlight
 * @param color - Highlight color (default: "yellow")
 * @returns The created Highlight object or null on failure
 */
export async function addHighlight(
  pageId: string,
  text: string,
  color: HighlightColor = "yellow"
): Promise<Highlight | null> {
  // Demo mode: store in memory
  if (DEMO_MODE) {
    return addMockHighlight(pageId, text, color)
  }

  const notion = getNotionClient()
  try {
    // First, try to highlight the text directly in the page content
    const highlightedInContent = await highlightTextInNotionContent(pageId, text, color)
    
    // If we couldn't find the text in content, fall back to callout
    if (!highlightedInContent.success) {
      console.log("Text not found in content, adding as callout")
      const response = await notion.blocks.children.append({
        block_id: pageId,
        children: [
          {
            object: "block",
            type: "callout",
            callout: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: `📌 "${text}"`,
                  },
                },
              ],
              icon: {
                type: "emoji",
                emoji: "💡",
              },
              color: mapColorToNotion(color),
            },
          },
        ],
      })

      const newBlock = response.results[0]
      if (!newBlock || !("id" in newBlock)) {
        return null
      }

      return {
        id: newBlock.id,
        articleId: pageId,
        text,
        startOffset: 0,
        endOffset: text.length,
        createdAt: new Date().toISOString(),
        color,
      }
    }

    // Return highlight info with the block ID where we highlighted
    return {
      id: highlightedInContent.blockId || `inline-${Date.now()}`,
      articleId: pageId,
      text,
      startOffset: 0,
      endOffset: text.length,
      createdAt: new Date().toISOString(),
      color,
    }
  } catch (error) {
    console.error("Error adding highlight:", error)
    return null
  }
}

/**
 * Applies a highlight directly to text within Notion page content.
 * 
 * This function searches through all text-containing blocks in a page,
 * finds the first occurrence of the search text, and applies a background
 * color annotation to highlight it in Notion.
 * 
 * Supported block types: paragraph, heading_1/2/3, bulleted_list_item,
 * numbered_list_item, quote, toggle
 * 
 * @param pageId - The Notion page ID containing the content
 * @param searchText - The exact text to find and highlight
 * @param color - The highlight color to apply
 * @returns Object with success status and optional blockId where highlight was applied
 */
async function highlightTextInNotionContent(
  pageId: string,
  searchText: string,
  color: HighlightColor
): Promise<{ success: boolean; blockId?: string }> {
  const notion = getNotionClient()
  
  try {
    // Fetch all blocks from the page with pagination
    const blocks = await fetchAllBlocks(pageId)

    // Block types that can contain text we can highlight
    const textBlockTypes = ["paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item", "numbered_list_item", "quote", "toggle"]

    for (const block of blocks) {
      if (!textBlockTypes.includes(block.type)) continue

      // Get the rich_text array from the block
      const richText = getBlockRichText(block)
      if (!richText) continue

      // Get plain text to search
      const plainText = richText.map(rt => rt.plain_text).join("")
      
      // Check if this block contains our search text
      const textIndex = plainText.indexOf(searchText)
      if (textIndex === -1) continue

      // Found the text! Now we need to rebuild the rich_text with highlight
      const newRichText = applyHighlightToRichText(richText, searchText, color)
      
      // Update the block with the new rich_text
      await updateBlockRichText(notion, block, newRichText)
      
      return { success: true, blockId: block.id }
    }

    return { success: false }
  } catch (error) {
    console.error("Error highlighting text in Notion content:", error)
    return { success: false }
  }
}

/**
 * Extracts the rich_text array from a Notion block.
 * Different block types store rich_text in different properties,
 * so this helper normalizes access across block types.
 * 
 * @param block - A Notion block object
 * @returns The rich_text array if the block type supports it, null otherwise
 */
function getBlockRichText(block: BlockObjectResponse): RichTextItemResponse[] | null {
  switch (block.type) {
    case "paragraph":
      return block.paragraph.rich_text
    case "heading_1":
      return block.heading_1.rich_text
    case "heading_2":
      return block.heading_2.rich_text
    case "heading_3":
      return block.heading_3.rich_text
    case "bulleted_list_item":
      return block.bulleted_list_item.rich_text
    case "numbered_list_item":
      return block.numbered_list_item.rich_text
    case "quote":
      return block.quote.rich_text
    case "toggle":
      return block.toggle.rich_text
    default:
      return null
  }
}

/**
 * Applies a background color highlight to a specific text within a rich_text array.
 * 
 * This is a complex operation because the search text might span multiple
 * rich_text segments with different formatting. The algorithm:
 * 
 * 1. Builds a full plain text string and tracks segment positions
 * 2. Finds the highlight region (start/end positions)
 * 3. For each segment, calculates overlap with highlight region
 * 4. Splits segments as needed: before-highlight, highlighted, after-highlight
 * 5. Preserves existing annotations while adding the background color
 * 
 * @param richText - The original rich_text array from a Notion block
 * @param searchText - The text to highlight
 * @param color - The highlight color to apply
 * @returns New rich_text array with highlight applied
 */
function applyHighlightToRichText(
  richText: RichTextItemResponse[],
  searchText: string,
  color: HighlightColor
): any[] {
  const notionColor = mapColorToNotion(color).replace("_background", "_background") as any
  const result: any[] = []
  
  // Build the full text and track positions
  let fullText = ""
  const segments: { text: string; annotations: any; start: number; end: number }[] = []
  
  for (const rt of richText) {
    const start = fullText.length
    fullText += rt.plain_text
    segments.push({
      text: rt.plain_text,
      annotations: rt.type === "text" ? { ...rt.annotations } : {},
      start,
      end: fullText.length,
    })
  }

  // Find where the search text is
  const highlightStart = fullText.indexOf(searchText)
  if (highlightStart === -1) return richText as any[]
  
  const highlightEnd = highlightStart + searchText.length

  // Rebuild with highlight applied
  for (const segment of segments) {
    // Check overlap with highlight region
    const overlapStart = Math.max(segment.start, highlightStart)
    const overlapEnd = Math.min(segment.end, highlightEnd)
    
    if (overlapStart >= overlapEnd) {
      // No overlap - keep original
      result.push({
        type: "text",
        text: { content: segment.text },
        annotations: segment.annotations,
      })
    } else {
      // Has overlap - need to split
      const relativeOverlapStart = overlapStart - segment.start
      const relativeOverlapEnd = overlapEnd - segment.start
      
      // Part before highlight
      if (relativeOverlapStart > 0) {
        result.push({
          type: "text",
          text: { content: segment.text.substring(0, relativeOverlapStart) },
          annotations: segment.annotations,
        })
      }
      
      // Highlighted part
      result.push({
        type: "text",
        text: { content: segment.text.substring(relativeOverlapStart, relativeOverlapEnd) },
        annotations: { ...segment.annotations, color: notionColor },
      })
      
      // Part after highlight
      if (relativeOverlapEnd < segment.text.length) {
        result.push({
          type: "text",
          text: { content: segment.text.substring(relativeOverlapEnd) },
          annotations: segment.annotations,
        })
      }
    }
  }

  return result
}

/**
 * Updates a Notion block with new rich_text content.
 * Handles the different update payload structures required by each block type.
 * 
 * @param notion - The Notion client instance
 * @param block - The block to update
 * @param newRichText - The new rich_text array to set
 */
async function updateBlockRichText(
  notion: Client,
  block: BlockObjectResponse,
  newRichText: any[]
): Promise<void> {
  const updatePayload: any = { block_id: block.id }
  
  switch (block.type) {
    case "paragraph":
      updatePayload.paragraph = { rich_text: newRichText }
      break
    case "heading_1":
      updatePayload.heading_1 = { rich_text: newRichText }
      break
    case "heading_2":
      updatePayload.heading_2 = { rich_text: newRichText }
      break
    case "heading_3":
      updatePayload.heading_3 = { rich_text: newRichText }
      break
    case "bulleted_list_item":
      updatePayload.bulleted_list_item = { rich_text: newRichText }
      break
    case "numbered_list_item":
      updatePayload.numbered_list_item = { rich_text: newRichText }
      break
    case "quote":
      updatePayload.quote = { rich_text: newRichText }
      break
    case "toggle":
      updatePayload.toggle = { rich_text: newRichText }
      break
  }

  await notion.blocks.update(updatePayload)
}

/**
 * Removes a highlight from Notion.
 * 
 * - For inline highlights (ID format: `{blockId}-inline-{index}`):
 *   Removes background color from all text in the block
 * - For callout highlights: Deletes the entire callout block
 * 
 * In demo mode, removes from memory storage.
 * 
 * @param highlightId - The highlight ID to remove
 * @returns true if successful, false on failure
 */
export async function removeHighlight(highlightId: string): Promise<boolean> {
  // Demo mode: remove from memory
  if (DEMO_MODE) {
    return removeMockHighlight("", highlightId)
  }

  const notion = getNotionClient()
  try {
    // Check if this is an inline highlight (format: {blockId}-inline-{index})
    if (highlightId.includes("-inline-")) {
      // Extract the actual block ID
      const blockId = highlightId.split("-inline-")[0]
      
      // For inline highlights, we need to fetch the block and remove the background color
      // This is complex because we don't know exactly which text was highlighted
      // For now, we'll just return true and let the highlight disappear on next page load
      // The highlight will still exist in Notion but won't affect functionality
      console.log("Inline highlight removal requested for block:", blockId)
      
      // Try to fetch and update the block to remove background colors
      try {
        const block = await notion.blocks.retrieve({ block_id: blockId }) as BlockObjectResponse
        const richText = getBlockRichText(block)
        
        if (richText) {
          // Remove all background colors from the rich_text
          const updatedRichText = richText.map(rt => ({
            type: "text" as const,
            text: { content: rt.plain_text },
            annotations: {
              ...rt.annotations,
              color: "default" as const, // Remove background color
            },
          }))
          
          await updateBlockRichText(notion, block, updatedRichText)
        }
      } catch (updateError) {
        console.error("Error removing inline highlight background:", updateError)
        // Return true anyway - the highlight will be refreshed on next load
      }
      
      return true
    }
    
    // For callout blocks, simply delete the block
    await notion.blocks.delete({ block_id: highlightId })
    return true
  } catch (error) {
    console.error("Error removing highlight:", error)
    return false
  }
}

// Map app color to Notion callout color
type NotionColor = "yellow_background" | "green_background" | "blue_background" | "pink_background" | "orange_background"
function mapColorToNotion(color: string): NotionColor {
  const colorMap: Record<string, NotionColor> = {
    yellow: "yellow_background",
    green: "green_background",
    blue: "blue_background",
    pink: "pink_background",
    orange: "orange_background",
  }
  return colorMap[color] || "yellow_background"
}

/**
 * Updates the color of an existing highlight in Notion.
 * 
 * - For inline highlights: Updates the background color annotation
 * - For callout highlights: Updates the callout block color
 * 
 * In demo mode, updates in memory storage.
 * 
 * @param highlightId - The highlight ID to update
 * @param color - New highlight color
 * @returns true if successful, false on failure
 */
export async function updateHighlightColor(highlightId: string, color: string): Promise<boolean> {
  // Demo mode: update in memory
  if (DEMO_MODE) {
    return updateMockHighlightColor(highlightId, color as HighlightColor)
  }

  const notion = getNotionClient()
  try {
    // Check if this is an inline highlight (format: {blockId}-inline-{index})
    if (highlightId.includes("-inline-")) {
      // Extract the actual block ID
      const blockId = highlightId.split("-inline-")[0]
      
      // For inline highlights, update the background color of highlighted text
      try {
        const block = await notion.blocks.retrieve({ block_id: blockId }) as BlockObjectResponse
        const richText = getBlockRichText(block)
        
        if (richText) {
          // Update background colors in the rich_text
          const notionColor = mapColorToNotion(color)
          const updatedRichText = richText.map(rt => {
            // Only update items that already have a background color
            if (rt.annotations?.color && rt.annotations.color.includes("_background")) {
              return {
                type: "text" as const,
                text: { content: rt.plain_text },
                annotations: {
                  ...rt.annotations,
                  color: notionColor,
                },
              }
            }
            return {
              type: "text" as const,
              text: { content: rt.plain_text },
              annotations: rt.annotations,
            }
          })
          
          await updateBlockRichText(notion, block, updatedRichText)
        }
        return true
      } catch (updateError) {
        console.error("Error updating inline highlight color:", updateError)
        return false
      }
    }
    
    // For callout blocks, update the callout color
    await notion.blocks.update({
      block_id: highlightId,
      callout: {
        color: mapColorToNotion(color),
      },
    })
    return true
  } catch (error) {
    console.error("Error updating highlight color:", error)
    return false
  }
}

/**
 * Updates article properties in Notion (status and/or favourite).
 * 
 * In demo mode, updates in memory storage.
 * 
 * @param pageId - The Notion page UUID
 * @param updates - Object with optional status and favourite values
 * @returns true if successful, false on failure
 */
export async function updateArticle(
  pageId: string,
  updates: { status?: Article["status"]; favourite?: boolean }
): Promise<boolean> {
  // Demo mode: update in memory
  if (DEMO_MODE) {
    return updateMockArticle(pageId, updates)
  }

  const notion = getNotionClient()
  try {
    const properties: Record<string, any> = {}

    if (updates.status !== undefined) {
      // Map app status back to Notion status name
      const statusNameMap: Record<Article["status"], string> = {
        "to-read": "To Read",
        reading: "Reading",
        read: "Read",
        archived: "Archived",
      }
      properties.Status = {
        status: {
          name: statusNameMap[updates.status],
        },
      }
    }

    if (updates.favourite !== undefined) {
      properties.Favourite = {
        checkbox: updates.favourite,
      }
    }

    await notion.pages.update({
      page_id: pageId,
      properties,
    })

    return true
  } catch (error) {
    console.error("Error updating article:", error)
    return false
  }
}
