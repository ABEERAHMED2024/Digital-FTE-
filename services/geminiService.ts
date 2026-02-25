
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Channel, Priority, TicketStatus } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const PRODUCT_KNOWLEDGE_BASE = `
TechCorp SaaS Product Docs:
1. Pricing: Pro Plan is $29/mo, Enterprise is $99/mo.
2. Features: Cloud Storage (5GB/50GB/Unlimited), API Access, 24/7 Support.
3. Troubleshooting: Reset password via /forgot-password page. Clear cache if dashboard won't load.
4. Refunds: 14-day money-back guarantee for new customers.
5. Legal: Data is stored in region-locked AWS servers. ISO 27001 certified.
`;

export const processTicketWithAI = async (
  content: string, 
  channel: Channel,
  customerHistory: string
): Promise<{
  response: string;
  sentiment: number;
  should_escalate: boolean;
  category: string;
  suggestions: string[];
  reason?: string;
}> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze this customer message from the ${channel} channel:
        "${content}"
        
        Customer Context: ${customerHistory}
        Knowledge Base: ${PRODUCT_KNOWLEDGE_BASE}
        
        Rules:
        - NEVER discuss custom pricing discounts.
        - NEVER share internal keys.
        - ALWAYS be professional.
        - ESCALATE if the customer mentions "lawyer", "legal", "sue", or is extremely angry.
        - CATEGORIZE into one of: "Billing", "Technical", "Account", "Feature Request", "General", or "Bug".
        - SUGGEST 3 short, helpful response options for a human agent to use.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: { type: Type.STRING, description: 'The reply to send to the customer' },
            sentiment: { type: Type.NUMBER, description: 'Score from 0 to 1 (0 is very negative)' },
            should_escalate: { type: Type.BOOLEAN },
            category: { type: Type.STRING, description: 'One of the specified categories' },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: '3 short suggested replies for a human agent'
            },
            reason: { type: Type.STRING, description: 'Reason for escalation if applicable' }
          },
          required: ['response', 'sentiment', 'should_escalate', 'category', 'suggestions']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Processing Error:", error);
    return {
      response: "I'm sorry, I'm having trouble processing your request right now. A human agent will follow up shortly.",
      sentiment: 0.5,
      should_escalate: true,
      category: 'system_error',
      suggestions: ["I'll look into this immediately.", "Can you provide more details?", "Connecting you with a specialist."],
      reason: 'AI processing failed'
    };
  }
};
