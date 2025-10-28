import { GoogleGenAI, Modality } from "@google/genai";

// Model configuration for easy migration
const GEMINI_CONFIG = {
  // Current model - will retire October 31, 2025
  PREVIEW_MODEL: 'gemini-2.5-flash-image-preview',
  // Stable production model for future migration
  STABLE_MODEL: 'gemini-2.5-flash-image',
  // Use this to easily switch models
  ACTIVE_MODEL: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image-preview',
  // Advanced generation settings
  GENERATION_CONFIG: {
    temperature: 1.0, // Creativity level (0.0-1.0)
    topP: 0.95, // Nucleus sampling threshold
    useImageOnly: true, // Set to false to include text description with image
  }
};

// Initialize Google AI client with the secure API key from environment
const getAIClient = () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set. Please configure it in your server environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface PoolDesignRequest {
  imageData: string; // Base64 image data
  poolShape: string;
  poolSize: string;
  poolMaterial: string;
  deckMaterial: string;
  design: string;
  landscaping: string;
  angle: string;
  aspectRatio?: string; // Optional aspect ratio
  features: string[];
}

export interface PoolDesignResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}


export async function generatePoolDesign(request: PoolDesignRequest): Promise<PoolDesignResponse> {
  try {
    const ai = getAIClient();
    
    // Build enhanced photorealistic prompt with camera specifications
    const selectedFeatures = request.features.join(', ');
    
    // Camera angle specifications based on selected angle
    const cameraSpecs: Record<string, string> = {
      'Aerial View': 'captured with a drone camera from 50 feet above, wide-angle 24mm lens perspective',
      'Eye-Level': 'photographed at human eye level with an 85mm portrait lens, shallow depth of field',
      'Dramatic Low Angle': 'shot from ground level with a 14mm ultra-wide lens, dramatic perspective',
      'Wide Angle Shot': 'captured with a 24mm wide-angle lens, expansive field of view'
    };
    
    const cameraSpec = cameraSpecs[request.angle] || 'professional architectural photography';
    
    const prompt = `Create a photorealistic transformation of this backyard by installing a luxury swimming pool, ${cameraSpec}.

PRESERVE COMPLETELY: All existing elements - house architecture, trees, lawn, fences, structures, shadows, and lighting conditions from the original photo.

POOL INSTALLATION DETAILS:
- Pool Design: ${request.poolSize} ${request.poolShape} swimming pool with premium ${request.poolMaterial} interior finish
- Pool Deck: ${request.deckMaterial} decking with professional installation, proper drainage slopes
${selectedFeatures ? `- Luxury Features: ${selectedFeatures} - integrated seamlessly with pool design` : ''}
- Architectural Style: ${request.design} aesthetic with sophisticated ${request.landscaping} landscaping
- Lighting: Natural ambient lighting matching the original photo's time of day, with subtle pool underwater LED illumination
- Water: Crystal clear, reflective water surface showing realistic caustics and light refraction
- Materials: High-resolution textures with accurate material properties - wet surfaces, proper reflections, natural weathering

PHOTOGRAPHIC QUALITY:
- Sharp focus on pool and architectural details with appropriate bokeh for ${request.angle}
- Professional color grading maintaining the original photo's color temperature
- Realistic shadows and reflections based on existing sun position
- HDR processing for balanced exposure between bright and shadowed areas
- Maintain original photo's aspect ratio and composition balance

The final image should look like a professional architectural photograph taken after an actual high-end pool installation, not a digital rendering.`;

    // Parse base64 image data 
    // Remove data:image/jpeg;base64, or similar prefix if present
    const base64Data = request.imageData.includes(',') 
      ? request.imageData.split(',')[1] 
      : request.imageData;

    // Determine MIME type from the original data URL or default to jpeg
    const mimeType = request.imageData.includes('data:image/') 
      ? request.imageData.split(';')[0].replace('data:', '') 
      : 'image/jpeg';

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };
    const textPart = { text: prompt };

    // Build advanced configuration
    const responseModalities = GEMINI_CONFIG.GENERATION_CONFIG.useImageOnly 
      ? [Modality.IMAGE] 
      : [Modality.IMAGE, Modality.TEXT];
    
    const config: any = {
      responseModalities: responseModalities,
      temperature: GEMINI_CONFIG.GENERATION_CONFIG.temperature,
      topP: GEMINI_CONFIG.GENERATION_CONFIG.topP,
    };
    
    // Add aspect ratio if specified
    if (request.aspectRatio) {
      config.imageConfig = {
        aspectRatio: request.aspectRatio
      };
    }

    // Use configurable Gemini model for pool visualization
    console.log(`Using Gemini model: ${GEMINI_CONFIG.ACTIVE_MODEL}`);
    const response = await ai.models.generateContent({
      model: GEMINI_CONFIG.ACTIVE_MODEL,
      contents: { parts: [imagePart, textPart] },
      config: config,
    });

    // Extract the generated image from the response
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          return {
            success: true,
            imageUrl: imageUrl
          };
        }
      }
    }

    return {
      success: false,
      error: "No image was generated in the response"
    };

  } catch (error: any) {
    console.error('Google Pool Designer error:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      // Quota exceeded error
      return {
        success: false,
        error: "Service is currently at capacity. Please try again in a few moments. The pool visualizer has high demand!"
      };
    }
    
    if (error.status === 400 && error.message?.includes('safety')) {
      // Safety block error
      return {
        success: false,
        error: "The image could not be processed due to content guidelines. Please try a different photo or adjust your selections."
      };
    }
    
    if (error.message?.includes('SAFETY')) {
      // Content blocked by safety filters
      return {
        success: false,
        error: "The generated content was blocked by safety filters. Please try different customization options."
      };
    }
    
    if (error.status === 403) {
      // API key or permission error
      return {
        success: false,
        error: "Pool visualization service is temporarily unavailable. Our team has been notified."
      };
    }
    
    if (error.message?.includes('timeout')) {
      // Timeout error
      return {
        success: false,
        error: "The generation took too long. Please try again with a smaller image or simpler features."
      };
    }
    
    // Generic error fallback
    return {
      success: false,
      error: "Unable to generate your pool design. Please try again or contact support if the issue persists."
    };
  }
}