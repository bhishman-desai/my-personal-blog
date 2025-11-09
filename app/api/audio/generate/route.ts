import { NextRequest, NextResponse } from "next/server";
import { getPostByName } from "@/lib/posts";
import { extractTextFromMDX, cleanTextForTTS } from "@/lib/textExtraction";
import { generateAudioFromVoiceAPI } from "@/lib/voiceApi";
import { saveAudio, audioExists } from "@/lib/audioStorage";

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Check if audio already exists
    if (await audioExists(postId)) {
      return NextResponse.json({
        success: true,
        message: "Audio already exists",
        postId,
      });
    }

    // Get post content
    const post = await getPostByName(`${postId}.mdx`);
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Extract text from raw MDX source (better than React tree)
    const rawMDX = post.rawMDX || '';
    let rawText = '';
    
    if (rawMDX) {
      // Extract text from raw MDX
      rawText = extractTextFromMDX(rawMDX);
    } else {
      // Fallback: try to extract from React content if rawMDX not available
      const { extractTextFromReactNode } = await import('@/lib/textExtraction');
      rawText = extractTextFromReactNode(post.content);
    }
    
    const titleText = post.meta.title;
    const fullText = `${titleText}. ${rawText}`;
    const cleanText = cleanTextForTTS(fullText);

    if (!cleanText || cleanText.length < 10) {
      return NextResponse.json(
        { error: "Could not extract sufficient text from post" },
        { status: 400 }
      );
    }

    // Generate audio using voice API
    const base64Audio = await generateAudioFromVoiceAPI(cleanText);

    // Save audio file
    await saveAudio(postId, base64Audio);

    return NextResponse.json({
      success: true,
      message: "Audio generated successfully",
      postId,
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    return NextResponse.json(
      {
        error: "Failed to generate audio",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

