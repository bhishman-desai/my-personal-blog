/**
 * Split text into chunks that are safe for the API (max 400 tokens)
 * Using very conservative 249 chars to stay well under the 400 token limit
 * Token count can vary significantly, so we use a smaller chunk size
 * Tries to split at sentence boundaries when possible
 */
function splitTextIntoChunks(text: string, maxChars: number = 249): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    
    if (remainingText.length <= maxChars) {
      chunks.push(remainingText);
      break;
    }

    // Try to find a sentence boundary (., !, ?) within the chunk
    const chunk = remainingText.slice(0, maxChars);
    const lastSentenceEnd = Math.max(
      chunk.lastIndexOf('. '),
      chunk.lastIndexOf('! '),
      chunk.lastIndexOf('? ')
    );

    if (lastSentenceEnd > maxChars * 0.5) {
      // Found a sentence boundary in the second half of the chunk
      const endIndex = currentIndex + lastSentenceEnd + 1;
      chunks.push(text.slice(currentIndex, endIndex).trim());
      currentIndex = endIndex;
    } else {
      // No good sentence boundary, split at word boundary
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > maxChars * 0.5) {
        const endIndex = currentIndex + lastSpace;
        chunks.push(text.slice(currentIndex, endIndex).trim());
        currentIndex = endIndex + 1;
      } else {
        // Fallback: hard split
        const endIndex = currentIndex + maxChars;
        chunks.push(text.slice(currentIndex, endIndex).trim());
        currentIndex = endIndex;
      }
    }
  }

  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Generate audio for a single text chunk
 */
async function generateAudioChunk(
  text: string,
  apiUrl: string,
  maxRetries: number = 5
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const requestBody = {
        data: [text]
      };

      const jsonBody = JSON.stringify(requestBody);

      // No timeout - let Vercel's platform timeout handle it (configured to 15 minutes in vercel.json)
      // Audio generation can take a long time, so we rely on platform-level timeouts
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonBody,
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      
      // Modelbit API returns: {"data": "base64 string"}
      let base64Audio: string;
      
      if (result.data && typeof result.data === 'string') {
        base64Audio = result.data;
      } else {
        console.error('API Response structure:', JSON.stringify(result, null, 2));
        throw new Error('Unable to extract audio from API response. Expected format: {"data": "base64string"}');
      }

      if (!base64Audio || base64Audio.length < 100) {
        throw new Error('Invalid audio data received from API');
      }

      return base64Audio;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Log more detailed error information
      const errorDetails = {
        message: lastError.message,
        name: lastError instanceof Error ? lastError.name : 'Unknown',
        stack: lastError instanceof Error ? lastError.stack : undefined,
        url: apiUrl,
        chunkLength: text.length,
      };
      
      console.error(`Chunk attempt ${attempt}/${maxRetries} failed:`, JSON.stringify(errorDetails, null, 2));
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to generate audio chunk after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Merge multiple base64 audio strings into a single base64 audio string
 */
function mergeBase64Audio(audioChunks: string[]): string {
  if (audioChunks.length === 0) {
    throw new Error('No audio chunks to merge');
  }

  if (audioChunks.length === 1) {
    return audioChunks[0];
  }

  // Convert base64 strings to buffers
  const buffers = audioChunks.map(chunk => {
    // Remove data URI prefix if present
    const base64Data = chunk.replace(/^data:audio\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    return new Uint8Array(buffer);
  });

  // Concatenate all buffers
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
  const mergedBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    mergedBuffer.set(buf, offset);
    offset += buf.length;
  }

  // Convert back to base64
  return Buffer.from(mergedBuffer).toString('base64');
}

/**
 * Generate audio using voice cloning API with chunking support
 * Splits text into chunks if it exceeds 400 tokens, generates audio for each chunk, and merges them
 * Returns base64 encoded audio string
 */
export async function generateAudioFromVoiceAPI(
  text: string,
  maxRetries: number = 5
): Promise<string> {
  const apiUrl = process.env.VOICE_CLONE_API_URL;
  
  if (!apiUrl) {
    throw new Error('VOICE_CLONE_API_URL environment variable is not set');
  }

  // Split text into chunks (max 249 chars per chunk to stay well under 400 tokens)
  const chunks = splitTextIntoChunks(text, 249);
  
  console.log(`[VoiceAPI] Splitting text into ${chunks.length} chunk(s)`);

  // Generate audio for each chunk sequentially to avoid overwhelming the API
  const audioChunks: string[] = [];
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    console.log(`[VoiceAPI] Generating audio for chunk ${index + 1}/${chunks.length} (${chunk.length} chars)`);
    const audioChunk = await generateAudioChunk(chunk, apiUrl, maxRetries);
    audioChunks.push(audioChunk);
  }

  // Merge all audio chunks
  console.log(`[VoiceAPI] Merging ${audioChunks.length} audio chunk(s)`);
  const mergedAudio = mergeBase64Audio(audioChunks);

  return mergedAudio;
}

