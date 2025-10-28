import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export async function generateChatbotResponse(userMessage: string): Promise<string> {
  try {
    const systemPrompt = `You are AquaLux Atlanta's AI assistant, a luxury pool and backyard transformation company serving the Atlanta metro area. You are knowledgeable, professional, and helpful.

Key information about AquaLux Atlanta:
- Luxury pool, spa, and backyard transformation specialists since 2010
- Serving Atlanta metro: Buckhead, Midtown, Sandy Springs, Alpharetta, Roswell, Johns Creek, Marietta, etc.
- Services: Custom pools, spa installations, pool renovations, complete backyard transformations
- Typical project ranges: $50,000 - $300,000+
- Licensed, bonded, and insured
- Offers free design consultations with 3D visualization
- Phone: (404) 555-POOL
- Email: info@aqualuxatlanta.com

Guidelines:
- Be helpful and knowledgeable about luxury pool and spa projects
- Encourage scheduling free consultations for serious inquiries
- Provide general pricing ranges when asked
- Focus on quality, luxury, and customer satisfaction
- If asked about specific technical details, offer to connect them with design team
- Always maintain a professional, luxury brand tone

Respond naturally and conversationally. Keep responses concise but informative.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm sorry, I didn't understand that. Could you please rephrase your question?";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I'm currently experiencing technical difficulties. Please call us at (404) 555-POOL or email info@aqualuxatlanta.com for immediate assistance.";
  }
}

export async function qualifyLead(leadData: any): Promise<{
  score: number;
  priority: 'low' | 'medium' | 'high';
  notes: string;
}> {
  try {
    const prompt = `Analyze this pool/spa lead and provide a qualification score and priority. Consider budget, project type, location, and urgency indicators.

Lead data: ${JSON.stringify(leadData)}

Respond with JSON in this format:
{
  "score": number (1-100),
  "priority": "low" | "medium" | "high",
  "notes": "brief analysis and next steps"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      score: Math.max(1, Math.min(100, result.score || 50)),
      priority: result.priority || 'medium',
      notes: result.notes || 'Lead requires follow-up'
    };
  } catch (error) {
    console.error("Lead qualification error:", error);
    return {
      score: 50,
      priority: 'medium',
      notes: 'Lead requires manual review'
    };
  }
}
