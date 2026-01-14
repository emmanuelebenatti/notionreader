"use client"

import type { Article, ArticlePreview } from "@/lib/types"
import { Clock, Star, ArrowRight, Highlighter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ArticleCardProps {
  article: Article | ArticlePreview
  view: "grid" | "list"
}

export function ArticleCard({ article, view }: ArticleCardProps) {
  const statusColors: Record<string, string> = {
    "to-read": "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    reading: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    read: "bg-green-500/20 text-green-600 dark:text-green-400",
    archived: "bg-muted text-muted-foreground",
  }

  if (view === "list") {
    return (
      <Link
        href={`/article/${article.id}`}
        className="group flex items-center justify-between border-b border-border py-5 transition-colors hover:bg-muted/50"
      >
        <div className="flex flex-1 items-center gap-6">
          {/* Thumbnail in list view */}
          {article.imageUrl && (
            <div className="hidden md:block w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted">
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground hidden sm:block">
            {new Date(article.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">{article.author}</p>
              {"highlights" in article && article.highlights.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Highlighter className="h-3 w-3" />
                  {article.highlights.length}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {article.favourite && <Star className="h-4 w-4 fill-accent text-accent shrink-0" />}
          {article.tags.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {article.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded shrink-0">
                  {tag}
                </span>
              ))}
              {article.tags.length > 2 && (
                <span className="text-xs text-muted-foreground">+{article.tags.length - 2}</span>
              )}
            </div>
          )}
          <span className={`px-2 py-0.5 text-xs font-medium rounded shrink-0 ${statusColors[article.status]}`}>
            {article.status.replace("-", " ")}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/article/${article.id}`}
      className="group flex flex-col rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-accent/50 hover:shadow-md"
    >
      {/* Cover image in grid view */}
      {article.imageUrl && (
        <div className="w-full h-40 bg-muted overflow-hidden">
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="flex flex-col p-5 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {article.tags.length > 0 && article.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded">
                {tag}
              </span>
            ))}
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[article.status]}`}>
              {article.status.replace("-", " ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {"highlights" in article && article.highlights.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Highlighter className="h-3 w-3" />
                {article.highlights.length}
              </span>
            )}
            {article.favourite && <Star className="h-4 w-4 fill-accent text-accent shrink-0" />}
          </div>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-card-foreground group-hover:text-accent transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{article.summary || "No summary available"}</p>
        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>{article.author}</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{article.readingTime} min</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
