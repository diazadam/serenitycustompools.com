import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class ImageUploadService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'server/public/uploads');
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://serenitycustompools.com' 
      : 'http://localhost:5000';
    
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadBase64Image(base64Data: string, originalFilename?: string): Promise<ImageUploadResult> {
    try {
      // Extract image format and data
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) {
        return {
          success: false,
          error: 'Invalid base64 image format'
        };
      }

      const imageFormat = matches[1];
      const imageBuffer = Buffer.from(matches[2], 'base64');
      
      // Generate unique filename
      const filename = `${uuidv4()}.${imageFormat}`;
      const filePath = path.join(this.uploadDir, filename);
      
      // Write file to disk
      fs.writeFileSync(filePath, imageBuffer);
      
      // Return public URL
      const imageUrl = `${this.baseUrl}/api/uploads/${filename}`;
      
      return {
        success: true,
        imageUrl
      };

    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: 'Failed to upload image'
      };
    }
  }

  async cleanupOldImages(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = fs.readdirSync(this.uploadDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old image: ${file}`);
        }
      }
    } catch (error) {
      console.error('Image cleanup error:', error);
    }
  }
}

export const imageUploadService = new ImageUploadService();