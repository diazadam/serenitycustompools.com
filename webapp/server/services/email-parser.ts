import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI for advanced parsing
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Gemini 2.5 Flash for higher quotas

export interface ExtractedLeadData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  projectType?: string;
  budgetRange?: string;
  message?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  timeframe?: string;
  propertySize?: string;
  poolType?: string;
  features?: string[];
  confidence: number;
  rawData?: any;
}

// Regular expression patterns for extracting information
const patterns = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  phone: /(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g,
  budget: /\$[\d,]+(?:k|K)?|\$[\d,]+(?:\s*-\s*\$?[\d,]+)?|budget\s*:?\s*\$?[\d,]+/gi,
  zip: /\b\d{5}(-\d{4})?\b/g,
  name: /(?:name|from|sender)\s*:?\s*([A-Za-z]+\s+[A-Za-z]+)/gi,
  city: /(?:city|location)\s*:?\s*([A-Za-z\s]+)(?:,|\.|$)/gi,
  state: /\b(GA|Georgia|Alabama|AL|Tennessee|TN|Florida|FL|South Carolina|SC|North Carolina|NC)\b/gi,
};

// Pool-specific patterns
const poolPatterns = {
  poolTypes: /\b(inground|above ground|infinity|lap pool|plunge pool|natural pool|saltwater|chlorine)\b/gi,
  features: /\b(hot tub|spa|waterfall|slide|diving board|lighting|heating|deck|patio|landscaping|fire pit|outdoor kitchen|pergola|gazebo)\b/gi,
  sizes: /\b(\d+)\s*(?:x|\*)\s*(\d+)\s*(?:feet|ft|\')?|\b(\d+)\s*(?:feet|ft|\')\s*(?:x|\*)\s*(\d+)\s*(?:feet|ft|\')?/gi,
  timeframes: /\b(asap|immediately|urgent|this month|next month|spring|summer|fall|winter|this year|next year|\d+\s*(?:weeks?|months?))\b/gi,
  projectTypes: /\b(new pool|pool renovation|pool repair|pool maintenance|pool remodel|resurfacing|replaster|retile|equipment upgrade)\b/gi,
};

// Extract lead data using regex patterns
function extractWithPatterns(text: string): Partial<ExtractedLeadData> {
  const extracted: Partial<ExtractedLeadData> = {};

  // Extract email
  const emailMatch = text.match(patterns.email);
  if (emailMatch && emailMatch[0]) {
    extracted.email = emailMatch[0].toLowerCase();
  }

  // Extract phone
  const phoneMatch = text.match(patterns.phone);
  if (phoneMatch && phoneMatch[0]) {
    // Clean up phone number
    const cleanPhone = phoneMatch[0].replace(/[^\d]/g, '');
    if (cleanPhone.length >= 10) {
      extracted.phone = cleanPhone.slice(-10);
      if (cleanPhone.length === 11 && cleanPhone[0] === '1') {
        extracted.phone = cleanPhone.slice(1);
      }
      // Format as (XXX) XXX-XXXX
      extracted.phone = `(${extracted.phone.slice(0, 3)}) ${extracted.phone.slice(3, 6)}-${extracted.phone.slice(6)}`;
    }
  }

  // Extract budget
  const budgetMatch = text.match(patterns.budget);
  if (budgetMatch && budgetMatch[0]) {
    let budget = budgetMatch[0];
    // Convert shorthand (e.g., $150k to $150,000)
    budget = budget.replace(/(\d+)k/gi, '$1,000');
    extracted.budgetRange = budget;
  }

  // Extract location info
  const zipMatch = text.match(patterns.zip);
  if (zipMatch && zipMatch[0]) {
    extracted.zipCode = zipMatch[0];
  }

  const stateMatch = text.match(patterns.state);
  if (stateMatch && stateMatch[0]) {
    extracted.state = stateMatch[0];
  }

  // Extract pool-specific information
  const poolTypeMatches = text.match(poolPatterns.poolTypes);
  if (poolTypeMatches && poolTypeMatches[0]) {
    extracted.poolType = poolTypeMatches[0];
  }

  const featureMatches = text.match(poolPatterns.features);
  if (featureMatches) {
    extracted.features = Array.from(new Set(featureMatches.map(f => f.toLowerCase())));
  }

  const timeframeMatch = text.match(poolPatterns.timeframes);
  if (timeframeMatch && timeframeMatch[0]) {
    extracted.timeframe = timeframeMatch[0];
  }

  const projectTypeMatch = text.match(poolPatterns.projectTypes);
  if (projectTypeMatch && projectTypeMatch[0]) {
    extracted.projectType = projectTypeMatch[0];
  }

  const sizeMatch = text.match(poolPatterns.sizes);
  if (sizeMatch && sizeMatch[0]) {
    extracted.propertySize = sizeMatch[0];
  }

  return extracted;
}

// Use AI to extract and structure lead data
async function extractWithAI(emailContent: string, fromEmail: string, subject: string): Promise<ExtractedLeadData> {
  try {
    const prompt = `
    Extract lead information from this email for a pool construction company.
    
    Email From: ${fromEmail}
    Subject: ${subject}
    Content: ${emailContent}
    
    Extract and structure the following information (if available):
    1. First name and last name (parse from email address if not in content)
    2. Email address
    3. Phone number
    4. City, state, zip code
    5. Project type (new pool, renovation, repair, etc.)
    6. Budget range
    7. Timeframe for project
    8. Pool type preferences (inground, infinity, etc.)
    9. Desired features (hot tub, waterfall, etc.)
    10. Property size or pool dimensions
    11. Any specific requirements or concerns
    
    Return as JSON with these fields: firstName, lastName, email, phone, city, state, zipCode, projectType, budgetRange, timeframe, poolType, features (array), propertySize, message (summary of requirements), confidence (0-1 score of data quality)
    
    If information is not available, omit the field. Always try to extract name from the email address if not found in content.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const aiExtracted = JSON.parse(jsonMatch[0]);
      
      // Parse name from email if not found
      if (!aiExtracted.firstName && fromEmail) {
        const emailParts = fromEmail.split('@')[0].split(/[._-]/);
        if (emailParts.length >= 2) {
          aiExtracted.firstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
          aiExtracted.lastName = emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1);
        } else if (emailParts[0]) {
          aiExtracted.firstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
        }
      }
      
      return {
        ...aiExtracted,
        confidence: aiExtracted.confidence || 0.5,
      };
    }
  } catch (error) {
    console.error('AI extraction error:', error);
  }

  // Fallback to pattern extraction
  return {
    confidence: 0.3,
  };
}

// Main function to parse email and extract lead data
export async function parseEmailForLeadData(
  emailContent: string,
  fromEmail: string,
  subject: string,
  isHtml: boolean = false
): Promise<ExtractedLeadData> {
  try {
    // Clean HTML if needed
    let cleanContent = emailContent;
    if (isHtml) {
      // Basic HTML stripping (remove tags)
      cleanContent = emailContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Combine subject and content for better context
    const fullText = `Subject: ${subject}\n\n${cleanContent}`;

    // Try AI extraction first for better accuracy
    let extracted: ExtractedLeadData;
    
    if (process.env.GEMINI_API_KEY) {
      extracted = await extractWithAI(fullText, fromEmail, subject);
    } else {
      // Fallback to pattern matching
      const patternData = extractWithPatterns(fullText);
      extracted = {
        ...patternData,
        confidence: 0.5,
      };
    }

    // Always ensure we have the from email
    if (!extracted.email && fromEmail) {
      extracted.email = fromEmail;
    }

    // Set the message as the original email content if not extracted
    if (!extracted.message) {
      extracted.message = cleanContent.slice(0, 1000); // First 1000 chars
    }

    // Calculate confidence based on completeness
    const fields = ['firstName', 'lastName', 'email', 'phone', 'projectType', 'budgetRange'];
    const filledFields = fields.filter(f => extracted[f as keyof ExtractedLeadData]).length;
    extracted.confidence = Math.max(extracted.confidence || 0, filledFields / fields.length);

    console.log(`Extracted lead data with ${Math.round(extracted.confidence * 100)}% confidence`);

    return extracted;
  } catch (error) {
    console.error('Error parsing email for lead data:', error);
    
    // Return minimal data on error
    return {
      email: fromEmail,
      message: emailContent.slice(0, 1000),
      confidence: 0.1,
      rawData: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}

// Determine lead priority based on extracted data
export function determineLeadPriority(leadData: ExtractedLeadData): 'Hot' | 'Warm' | 'Cold' {
  let score = 0;

  // High-value indicators
  if (leadData.budgetRange && (
    leadData.budgetRange.includes('200') ||
    leadData.budgetRange.includes('300') ||
    leadData.budgetRange.includes('400') ||
    leadData.budgetRange.includes('500')
  )) {
    score += 3;
  } else if (leadData.budgetRange) {
    score += 1;
  }

  // Urgency indicators
  if (leadData.timeframe && (
    leadData.timeframe.toLowerCase().includes('asap') ||
    leadData.timeframe.toLowerCase().includes('immediate') ||
    leadData.timeframe.toLowerCase().includes('urgent') ||
    leadData.timeframe.toLowerCase().includes('this month')
  )) {
    score += 2;
  }

  // Complete information
  if (leadData.phone) score += 1;
  if (leadData.firstName && leadData.lastName) score += 1;
  if (leadData.city || leadData.zipCode) score += 1;
  if (leadData.projectType) score += 1;
  
  // Premium features
  if (leadData.features && leadData.features.length > 3) score += 1;
  if (leadData.poolType && leadData.poolType.includes('infinity')) score += 1;

  // High confidence in data extraction
  if (leadData.confidence > 0.7) score += 1;

  // Determine priority
  if (score >= 7) return 'Hot';
  if (score >= 4) return 'Warm';
  return 'Cold';
}

// Format extracted lead data for database insertion
export function formatLeadDataForDb(leadData: ExtractedLeadData, source: string = 'email') {
  const location = [leadData.city, leadData.state, leadData.zipCode]
    .filter(Boolean)
    .join(', ');

  return {
    firstName: leadData.firstName || 'Unknown',
    lastName: leadData.lastName || null,
    email: leadData.email || '',
    phone: leadData.phone || null,
    city: leadData.city || location || null,
    projectType: leadData.projectType || null,
    budgetRange: leadData.budgetRange || null,
    message: leadData.message || null,
    source,
    metadata: {
      timeframe: leadData.timeframe,
      poolType: leadData.poolType,
      features: leadData.features,
      propertySize: leadData.propertySize,
      extractionConfidence: leadData.confidence,
      state: leadData.state,
      zipCode: leadData.zipCode,
    },
  };
}