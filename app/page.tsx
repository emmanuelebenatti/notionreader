import { Header } from "@/components/header"
import { ArticleList } from "@/components/article-list"
import { getArticles } from "@/lib/notion"

export const dynamic = "force-dynamic" // Always fetch fresh data

export default async function HomePage() {
  const articles = await getArticles()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reading List</h1>
          <p className="mt-1 text-muted-foreground">{articles.length} articles saved</p>
        </div>
        <ArticleList articles={articles} />
      </main>
    </div>
  )
}
