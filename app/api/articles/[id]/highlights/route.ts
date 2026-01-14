import { type NextRequest, NextResponse } from "next/server"
import { addHighlight } from "@/lib/notion"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  try {
    // Add highlight to Notion (directly in content + fallback to callout)
    const highlight = await addHighlight(id, body.text, body.color || "yellow")

    if (!highlight) {
      return NextResponse.json({ error: "Failed to add highlight" }, { status: 500 })
    }

    return NextResponse.json(highlight, { status: 201 })
  } catch (error) {
    console.error("Error adding highlight:", error)
    return NextResponse.json({ error: "Failed to add highlight" }, { status: 500 })
  }
}
