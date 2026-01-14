"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Article, Highlight, HighlightColor } from "@/lib/types"
import { ArrowLeft, Star, ExternalLink, Clock, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Highlight color configurations
const HIGHLIGHT_COLORS: { value: HighlightColor; bg: string; label: string }[] = [
  { value: "yellow", bg: "bg-yellow-200 dark:bg-yellow-500/40", label: "Giallo" },
  { value: "green", bg: "bg-green-200 dark:bg-green-500/40", label: "Verde" },
  { value: "blue", bg: "bg-blue-200 dark:bg-blue-500/40", label: "Blu" },
  { value: "pink", bg: "bg-pink-200 dark:bg-pink-500/40", label: "Rosa" },
  { value: "orange", bg: "bg-orange-200 dark:bg-orange-500/40", label: "Arancione" },
]

function getHighlightClass(color?: HighlightColor): string {
  const colorMap: Record<HighlightColor, string> = {
    yellow: "bg-yellow-200 dark:bg-yellow-500/40",
    green: "bg-green-200 dark:bg-green-500/40",
    blue: "bg-blue-200 dark:bg-blue-500/40",
    pink: "bg-pink-200 dark:bg-pink-500/40",
    orange: "bg-orange-200 dark:bg-orange-500/40",
  }
  return colorMap[color || "yellow"]
}

interface ArticleReaderProps {
  article: Article
  onToggleFavourite: (id: string) => void
  onUpdateStatus: (id: string, status: Article["status"]) => void
  onAddHighlight: (highlight: Omit<Highlight, "id" | "createdAt">) => void
  onRemoveHighlight: (highlightId: string) => void
  onUpdateHighlightColor?: (highlightId: string, color: HighlightColor) => void
}

export function ArticleReader({
  article,
  onToggleFavourite,
  onUpdateStatus,
  onAddHighlight,
  onRemoveHighlight,
  onUpdateHighlightColor,
}: ArticleReaderProps) {
  const [showSummary, setShowSummary] = useState(false)
  const [highlightMenu, setHighlightMenu] = useState<{
    highlightId: string
    x: number
    y: number
  } | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const statusOptions: { value: Article["status"]; label: string }[] = [
    { value: "to-read", label: "To Read" },
    { value: "reading", label: "Reading" },
    { value: "read", label: "Read" },
    { value: "archived", label: "Archived" },
  ]

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const text = selection.toString().trim()
    // Minimum 10 characters to avoid accidental highlights from clicks
    if (text.length > 10 && contentRef.current?.contains(selection.anchorNode)) {
      // Instantly highlight (Kindle-style) - default yellow color
      onAddHighlight({
        articleId: article.id,
        text,
        startOffset: 0,
        endOffset: text.length,
        color: "yellow",
      })
      selection.removeAllRanges()
    }
  }, [article.id, onAddHighlight])

  useEffect(() => {
    document.addEventListener("mouseup", handleTextSelection)
    document.addEventListener("touchend", handleTextSelection)
    document.addEventListener("keyup", handleTextSelection)
    return () => {
      document.removeEventListener("mouseup", handleTextSelection)
      document.removeEventListener("touchend", handleTextSelection)
      document.removeEventListener("keyup", handleTextSelection)
    }
  }, [handleTextSelection])

  // Close highlight menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setHighlightMenu(null)
      }
    }
    if (highlightMenu) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [highlightMenu])

  const renderContent = () => {
    let content = article.content

    // Sort highlights by length (longest first) to avoid nested replacement issues
    const sortedHighlights = [...article.highlights].sort((a, b) => b.text.length - a.text.length)

    // Replace highlighted text with marked spans
    sortedHighlights.forEach((highlight) => {
      const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(`(${escapedText})`, "g")
      const colorClass = getHighlightClass(highlight.color)
      content = content.replace(
        regex,
        `<mark data-highlight-id="${highlight.id}" data-highlight-color="${highlight.color || "yellow"}" class="${colorClass} text-foreground cursor-pointer px-0.5 rounded-sm hover:opacity-80 transition-all">$1</mark>`,
      )
    })

    return content
  }

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === "MARK") {
      e.preventDefault()
      e.stopPropagation()
      const highlightId = target.getAttribute("data-highlight-id")
      if (highlightId) {
        const rect = target.getBoundingClientRect()
        setHighlightMenu({
          highlightId,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        })
      }
    }
  }

  const handleColorChange = (color: HighlightColor) => {
    if (highlightMenu && onUpdateHighlightColor) {
      onUpdateHighlightColor(highlightMenu.highlightId, color)
    }
    setHighlightMenu(null)
  }

  const handleDeleteHighlight = () => {
    if (highlightMenu) {
      onRemoveHighlight(highlightMenu.highlightId)
      setHighlightMenu(null)
    }
  }

  const parseMarkdown = (text: string): string => {
    return (
      text
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mt-6 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
        // Code blocks
        .replace(
          /```(\w+)?\n([\s\S]*?)```/g,
          '<pre class="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto my-4"><code>$2</code></pre>',
        )
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // Links
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 hover:no-underline">$1</a>',
        )
        // Unordered lists
        .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
        // Ordered lists
        .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
        // Blockquotes
        .replace(
          /^> (.*$)/gim,
          '<blockquote class="border-l-4 border-accent pl-4 italic my-4 text-muted-foreground">$1</blockquote>',
        )
        // Images
        .replace(
          /!\[([^\]]*)\]\(([^)]+)\)/g,
          '<img src="$2" alt="$1" class="w-full rounded-lg my-6 shadow-sm" loading="lazy" />',
        )
        // Paragraphs (double newlines create separate paragraphs)
        .split("\n\n")
        .map((para) => {
          // Skip empty paragraphs
          if (!para.trim()) return ""
          // Preserve single line breaks within paragraphs with <br>
          const withBreaks = para.replace(/\n/g, "<br />")
          // Don't wrap headers, lists, blockquotes, code blocks in <p> tags
          if (
            withBreaks.startsWith("<h") ||
            withBreaks.startsWith("<li") ||
            withBreaks.startsWith("<blockquote") ||
            withBreaks.startsWith("<pre") ||
            withBreaks.startsWith("<img")
          ) {
            return withBreaks
          }
          return `<p class="leading-relaxed mb-4">${withBreaks}</p>`
        })
        .join("")
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Highlight menu popup */}
      {highlightMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
          style={{
            left: `${highlightMenu.x}px`,
            top: `${highlightMenu.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex items-center gap-1 p-2 bg-popover border border-border rounded-lg shadow-lg">
            {/* Color options */}
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className={`w-6 h-6 rounded-full ${color.bg} hover:ring-2 hover:ring-offset-2 hover:ring-foreground/20 transition-all`}
                title={color.label}
              />
            ))}
            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1" />
            {/* Delete button */}
            <button
              onClick={handleDeleteHighlight}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
              title="Elimina"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onToggleFavourite(article.id)}>
              <Star className={`h-4 w-4 ${article.favourite ? "fill-accent text-accent" : ""}`} />
            </Button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Article content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Meta info */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={article.status}
              onChange={(e) => onUpdateStatus(article.id, e.target.value as Article["status"])}
              className="px-2 py-1 text-xs font-medium rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{article.readingTime} min read</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
            {article.title}
          </h1>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{article.author}</span>
            <span>·</span>
            <span>
              {new Date(article.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {article.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Summary toggle */}
        {article.summary && (
          <div className="mb-8">
            <Button variant="outline" size="sm" onClick={() => setShowSummary(!showSummary)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {showSummary ? "Hide Summary" : "Show AI Summary"}
            </Button>
            {showSummary && (
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">{article.summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Article body */}
        <article className="text-foreground">
          <div
            ref={contentRef}
            className="prose prose-neutral dark:prose-invert max-w-none"
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{
              __html: parseMarkdown(renderContent()),
            }}
          />
        </article>
      </main>
    </div>
  )
}
