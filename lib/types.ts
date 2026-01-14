export type ArticleStatus = "to-read" | "reading" | "read" | "archived"

export interface Article {
  id: string
  title: string
  url: string
  author: string
  content: string
  summary: string
  tags: string[]
  readingTime: number
  status: ArticleStatus
  favourite: boolean
  createdAt: string
  highlights: Highlight[]
  imageUrl?: string
}

// Article without content (for list views)
export interface ArticlePreview {
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

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "orange"

export interface Highlight {
  id: string
  articleId: string
  text: string
  startOffset: number
  endOffset: number
  createdAt: string
  color?: HighlightColor
}
