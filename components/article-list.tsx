"use client"

import { useState } from "react"
import type { Article, ArticlePreview, ArticleStatus } from "@/lib/types"
import { ArticleCard } from "./article-card"
import { LayoutGrid, List, Search, Filter, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ArticleListProps {
  articles: (Article | ArticlePreview)[]
}

const statusOptions: { value: ArticleStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "to-read", label: "To Read" },
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
]

export function ArticleList({ articles }: ArticleListProps) {
  const [view, setView] = useState<"grid" | "list">("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all")
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false)

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.author.toLowerCase().includes(search.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === "all" || article.status === statusFilter
    const matchesFavourite = !showFavouritesOnly || article.favourite
    return matchesSearch && matchesStatus && matchesFavourite
  })

  const sortedArticles = [...filteredArticles].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles, authors, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFavouritesOnly ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFavouritesOnly(!showFavouritesOnly)}
            className="gap-2"
          >
            <Star className={`h-4 w-4 ${showFavouritesOnly ? "fill-current" : ""}`} />
            <span className="hidden sm:inline">Favourites</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{statusOptions.find((s) => s.value === statusFilter)?.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={statusFilter === option.value}
                  onCheckedChange={() => setStatusFilter(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center border border-border rounded-md">
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("grid")}
              className="rounded-l-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Showing {sortedArticles.length} of {articles.length} articles
      </p>

      {sortedArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No articles found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedArticles.map((article) => (
            <ArticleCard key={article.id} article={article} view="grid" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {sortedArticles.map((article) => (
            <ArticleCard key={article.id} article={article} view="list" />
          ))}
        </div>
      )}
    </div>
  )
}
