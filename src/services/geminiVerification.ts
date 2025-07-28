import { GoogleGenerativeAI } from '@google/generative-ai';

interface VerificationResult {
  isMatch: boolean;
  confidence: number;
  reason: string;
}

export class GeminiVerificationService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.setApiKey(apiKey);
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private convertImageToBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async verifyIdentity(referenceImageBlob: Blob, currentImageBlob: Blob): Promise<VerificationResult> {
    if (!this.genAI || !this.apiKey) {
      throw new Error('Gemini API key not set');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const [referenceBase64, currentBase64] = await Promise.all([
        this.convertImageToBase64(referenceImageBlob),
        this.convertImageToBase64(currentImageBlob)
      ]);

      const prompt = `
        Compare these two images to determine if they show the same person. 
        
        Please analyze facial features, structure, and distinctive characteristics.
        
        Respond with a JSON object containing:
        - isMatch: boolean (true if same person, false if different)
        - confidence: number (0-100, how confident you are in the match)
        - reason: string (brief explanation of your decision)
        
        Be strict in verification - only return true if you're confident it's the same person.
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: referenceBase64,
            mimeType: 'image/jpeg'
          }
        },
        {
          inlineData: {
            data: currentBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();

      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const verification = JSON.parse(jsonMatch[0]);
        return {
          isMatch: verification.isMatch || false,
          confidence: verification.confidence || 0,
          reason: verification.reason || 'Unable to determine match'
        };
      }

      // Fallback parsing
      const isMatch = text.toLowerCase().includes('true') && 
                     !text.toLowerCase().includes('false');
      
      return {
        isMatch,
        confidence: isMatch ? 85 : 15,
        reason: text.substring(0, 200)
      };

    } catch (error) {
      console.error('Verification error:', error);
      return {
        isMatch: false,
        confidence: 0,
        reason: 'Verification failed due to technical error'
      };
    }
  }

  async captureImageFromVideo(videoElement: HTMLVideoElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      ctx.drawImage(videoElement, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to capture image'));
        }
      }, 'image/jpeg', 0.8);
    });
  }
}

export const geminiVerification = new GeminiVerificationService();