import { type NextRequest, NextResponse } from "next/server"
import { removeHighlight, updateHighlightColor } from "@/lib/notion"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; highlightId: string }> }
) {
  const { highlightId } = await params

  try {
    const success = await removeHighlight(highlightId)

    if (!success) {
      return NextResponse.json({ error: "Highlight not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing highlight:", error)
    return NextResponse.json({ error: "Failed to remove highlight" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; highlightId: string }> }
) {
  const { highlightId } = await params
  const body = await request.json()

  try {
    const success = await updateHighlightColor(highlightId, body.color)

    if (!success) {
      return NextResponse.json({ error: "Failed to update highlight" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating highlight:", error)
    return NextResponse.json({ error: "Failed to update highlight" }, { status: 500 })
  }
}
