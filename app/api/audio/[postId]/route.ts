import { NextRequest, NextResponse } from "next/server";
import { audioExists, getAudioUrl } from "@/lib/audioStorage";

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Check if audio exists
    if (!(await audioExists(postId))) {
      return NextResponse.json(
        { error: "Audio not found", available: false },
        { status: 404 }
      );
    }

    // Get audio URL from blob storage
    const audioUrl = await getAudioUrl(postId);
    if (!audioUrl) {
      return NextResponse.json(
        { error: "Audio not found" },
        { status: 404 }
      );
    }

    // Fetch from blob storage and proxy
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch audio" },
        { status: 500 }
      );
    }

    const audioArrayBuffer = await audioResponse.arrayBuffer();

    return new NextResponse(audioArrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioArrayBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error getting audio:", error);
    return NextResponse.json(
      {
        error: "Failed to get audio",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;

    if (!postId) {
      return new NextResponse(null, { status: 400 });
    }

    // Check if audio exists
    const exists = await audioExists(postId);
    if (!exists) {
      return new NextResponse(null, { status: 404 });
    }

    // Get headers from blob storage
    const audioUrl = await getAudioUrl(postId);
    if (!audioUrl) {
      return new NextResponse(null, { status: 404 });
    }

    try {
      const headResponse = await fetch(audioUrl, { method: 'HEAD' });
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": headResponse.headers.get("Content-Length") || "0",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return new NextResponse(null, { status: 200 });
    }
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
