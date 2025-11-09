/**
 * Generate audio using voice cloning API
 * Returns base64 encoded audio string
 */
export async function generateAudioFromVoiceAPI(
  text: string,
  language: string = 'en',
  maxRetries: number = 5
): Promise<string> {
  const apiUrl = process.env.VOICE_CLONE_API_URL;
  
  if (!apiUrl) {
    throw new Error('VOICE_CLONE_API_URL environment variable is not set');
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [text, language]
        }),
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
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to generate audio after ${maxRetries} attempts: ${lastError?.message}`);
}

