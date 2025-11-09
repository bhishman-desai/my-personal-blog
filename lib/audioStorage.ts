import { put, head, del } from '@vercel/blob';

const BLOB_STORE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';

/**
 * Get audio blob path for a post
 */
function getAudioBlobPath(postId: string): string {
  return `audio/${postId}.mp3`;
}

/**
 * Check if audio file exists for a post
 */
export async function audioExists(postId: string): Promise<boolean> {
  if (!BLOB_STORE_TOKEN) {
    return false;
  }

  try {
    const blobPath = getAudioBlobPath(postId);
    await head(blobPath, { token: BLOB_STORE_TOKEN });
    return true;
  } catch {
    return false;
  }
}

/**
 * Save audio file from base64 string to Vercel Blob Storage
 */
export async function saveAudio(postId: string, base64Audio: string): Promise<void> {
  if (!BLOB_STORE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
  }

  // Remove data URI prefix if present
  const base64Data = base64Audio.replace(/^data:audio\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const uint8Array = new Uint8Array(buffer);
  const audioBlob = new Blob([uint8Array], { type: 'audio/mpeg' });

  const blobPath = getAudioBlobPath(postId);
  await put(blobPath, audioBlob, {
    access: 'public',
    contentType: 'audio/mpeg',
    token: BLOB_STORE_TOKEN,
  });
}

/**
 * Get audio file URL from Vercel Blob Storage
 */
export async function getAudioUrl(postId: string): Promise<string | null> {
  if (!BLOB_STORE_TOKEN) {
    return null;
  }

  try {
    const blobPath = getAudioBlobPath(postId);
    const blob = await head(blobPath, { token: BLOB_STORE_TOKEN });
    return blob.url;
  } catch {
    return null;
  }
}

/**
 * Delete audio file from Vercel Blob Storage
 */
export async function deleteAudio(postId: string): Promise<void> {
  if (!BLOB_STORE_TOKEN) {
    return;
  }

  try {
    const blobPath = getAudioBlobPath(postId);
    await del(blobPath, { token: BLOB_STORE_TOKEN });
  } catch {
    // File doesn't exist, that's okay
  }
}
