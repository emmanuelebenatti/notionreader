"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import type { Article, Highlight, HighlightColor } from "@/lib/types"
import { ArticleReader } from "@/components/article-reader"
import { Loader2 } from "lucide-react"

export default function ArticlePage() {
  const params = useParams()
  const id = params.id as string
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/articles/${id}`)
        if (!res.ok) throw new Error("Article not found")
        const data = await res.json()
        setArticle(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load article")
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [id])

  const handleToggleFavourite = async (articleId: string) => {
    if (!article) return
    const updated = { ...article, favourite: !article.favourite }
    setArticle(updated)

    await fetch(`/api/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favourite: updated.favourite }),
    })
  }

  const handleUpdateStatus = async (articleId: string, status: Article["status"]) => {
    if (!article) return
    const updated = { ...article, status }
    setArticle(updated)

    await fetch(`/api/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
  }

  const handleAddHighlight = async (highlight: Omit<Highlight, "id" | "createdAt">) => {
    if (!article) return

    // Optimistic update: show highlight immediately with temporary ID
    const tempId = `temp-${Date.now()}`
    const optimisticHighlight: Highlight = {
      ...highlight,
      id: tempId,
      createdAt: new Date().toISOString(),
      color: highlight.color || "yellow",
    }

    // Update UI immediately
    setArticle({
      ...article,
      highlights: [...article.highlights, optimisticHighlight],
    })

    // Then sync with Notion in background (highlights text directly in Notion!)
    const res = await fetch(`/api/articles/${id}/highlights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...highlight,
        color: highlight.color || "yellow",
      }),
    })

    if (res.ok) {
      const newHighlight = await res.json()
      // Replace temp highlight with real one from API
      setArticle((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          highlights: prev.highlights.map((h) =>
            h.id === tempId ? newHighlight : h
          ),
        }
      })
    } else {
      // Rollback on error
      setArticle((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          highlights: prev.highlights.filter((h) => h.id !== tempId),
        }
      })
      console.error("Failed to save highlight to Notion")
    }
  }

  const handleRemoveHighlight = async (highlightId: string) => {
    if (!article) return

    // Optimistic update
    setArticle({
      ...article,
      highlights: article.highlights.filter((h) => h.id !== highlightId),
    })

    await fetch(`/api/articles/${id}/highlights/${highlightId}`, {
      method: "DELETE",
    })
  }

  const handleUpdateHighlightColor = async (highlightId: string, color: HighlightColor) => {
    if (!article) return

    // Optimistic update
    setArticle({
      ...article,
      highlights: article.highlights.map((h) =>
        h.id === highlightId ? { ...h, color } : h
      ),
    })

    // Update in Notion (color is stored locally for now, could be synced to Notion later)
    await fetch(`/api/articles/${id}/highlights/${highlightId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">{error || "Article not found"}</p>
        <a href="/" className="text-accent hover:underline">
          Back to reading list
        </a>
      </div>
    )
  }

  return (
    <ArticleReader
      article={article}
      onToggleFavourite={handleToggleFavourite}
      onUpdateStatus={handleUpdateStatus}
      onAddHighlight={handleAddHighlight}
      onRemoveHighlight={handleRemoveHighlight}
      onUpdateHighlightColor={handleUpdateHighlightColor}
    />
  )
}
