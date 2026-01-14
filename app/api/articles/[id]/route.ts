import { type NextRequest, NextResponse } from "next/server"
import { getArticle, updateArticle } from "@/lib/notion"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const article = await getArticle(id)

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error("Error fetching article:", error)
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  try {
    // Map frontend field names to our function expectations
    const updates: { status?: any; favourite?: boolean } = {}
    
    if (body.status !== undefined) {
      updates.status = body.status
    }
    if (body.favourite !== undefined) {
      updates.favourite = body.favourite
    }

    const success = await updateArticle(id, updates)

    if (!success) {
      return NextResponse.json({ error: "Failed to update article" }, { status: 500 })
    }

    // Fetch and return the updated article
    const article = await getArticle(id)
    return NextResponse.json(article)
  } catch (error) {
    console.error("Error updating article:", error)
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 })
  }
}
