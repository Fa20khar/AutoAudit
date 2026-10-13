import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const geminiRouter = Router();

// Initialize the GoogleGenAI instance on the server with standard telemetry User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface ChatRoleConfig {
  id: 'advisor' | 'fast-decoder' | 'damage-analyst';
  name: string;
  badge: string;
  description: string;
  model: string;
  tagline: string;
  systemInstruction: string;
  suggestedQuestions: string[];
}

export const CHAT_ROLES: Record<string, ChatRoleConfig> = {
  'advisor': {
    id: 'advisor',
    name: 'Vehicle History Advisor',
    badge: 'General & Advisory Tasks',
    model: 'gemini-3.1-flash-lite',
    tagline: 'General vehicle history, title brands, odometer checks, and buyer advice',
    systemInstruction: `You are the AutoAudit Senior Vehicle History & Automotive Advisory Specialist. AutoAudit is a premier vehicle history report ordering and automotive intelligence platform that provides NMVTIS verified records, insurance salvage flags, title brand checks, lien checks, NHTSA recall notices, and odometer verification.

Your role:
- Provide friendly, expert, and practical advice for used-car shoppers, vehicle owners, and automotive enthusiasts.
- Explain vehicle history concepts clearly: salvage vs rebuilt titles, flood brands, odometer rollbacks, frame/structural damage, lemon law buybacks, lien releases, and previous ownership records.
- Advise on what to inspect physically when a report flags an accident or minor damage.
- Help customers understand AutoAudit report tiers when asked:
  * Basic VIN Check ($14.99): Title brand status, salvage/junk records, total loss check, stolen vehicle check.
  * Complete History ($28.99, Most Popular): Everything in Basic + previous owners, odometer rollback check, accident history, lien & repossession, open recalls, service timeline.
  * Premium Full Inspection ($42.99): Everything in Complete + full NMVTIS records, market valuation, frame check, auction photos where available, and priority fulfillment.
- Maintain a helpful, trustworthy, and conversational tone. Format answers using markdown with bullet points and bold headers for easy reading.`,
    suggestedQuestions: [
      'What is the difference between a Salvage and Rebuilt title?',
      'How do I detect an odometer rollback before buying?',
      'Which AutoAudit report package should I choose?',
      'What red flags should I look for in a vehicle maintenance history?'
    ]
  },
  'fast-decoder': {
    id: 'fast-decoder',
    name: 'Quick VIN Decoder',
    badge: 'Fast Tasks',
    model: 'gemini-3.1-flash-lite',
    tagline: 'High-speed 17-digit VIN breakdown, trim specs, and plant origins',
    systemInstruction: `You are the AutoAudit Ultra-Fast VIN Decoder and Technical Spec Engine. 

Your role:
- Provide rapid, ultra-concise breakdowns of 17-character ISO 3779 Vehicle Identification Numbers (VINs).
- Decode the 3-character WMI (World Manufacturer Identifier) for country and make, the 5-character VDS (Vehicle Descriptor Section) for model/engine/body type, the 9th check digit, the 10th model year character, the 11th assembly plant code, and the sequential production number.
- Instantly explain NHTSA safety recall lookup guidelines and check digit calculations.
- Keep responses fast, snappy, structured, and direct without unnecessary preamble. Present vehicle specifications in clean bulleted lists.`,
    suggestedQuestions: [
      'How is the 10th digit of a VIN used to determine model year?',
      'Can you decode this sample VIN: 1HGCR2F83HA029381?',
      'How does the 9th check digit mathematical formula work?',
      'Where can I find the VIN stamp on my car?'
    ]
  },
  'damage-analyst': {
    id: 'damage-analyst',
    name: 'Damage & Forensics Analyst',
    badge: 'Forensics Tasks',
    model: 'gemini-3.1-flash-lite',
    tagline: 'Deep structural forensics, salvage auction forensics, and diminished value',
    systemInstruction: `You are the AutoAudit Forensic Vehicle Damage, Structural Diagnostics, and Diminished Value Analyst.

Your role:
- Conduct rigorous, in-depth technical analysis of structural unibody/frame damage, collision load-path deformation, A/B/C pillar integrity, suspension mounting distortion, and crumple-zone behavior.
- Diagnose salvage auction history indicators (Copart/IAAI designations such as Primary Damage Front End, Secondary Undercarriage, Biohazard, Fresh Water vs Salt Water Flood).
- Explain airbag deployment trigger thresholds, seatbelt pre-tensioner replacements, and SRS system recertification requirements.
- Calculate post-accident diminished value impact and insurance dispute strategies.
- Provide comprehensive, step-by-step diagnostic inspection checklists for master mechanics and pre-purchase vehicle inspectors.
- Use authoritative, deeply reasoned technical terminology while providing clear conclusions and risk ratings (Low / Moderate / Severe / Unsafe).`,
    suggestedQuestions: [
      'How does structural unibody damage affect used car safety and resale value?',
      'What are the telltale signs of concealed flood damage in electronics?',
      'How do insurance adjusters calculate diminished value after a collision?',
      'What does "Frame Damage - Altered Rail" indicate on an inspection report?'
    ]
  }
};

// GET /api/gemini/roles - Retrieve available chatbot personas and role metadata
geminiRouter.get('/roles', (_req: Request, res: Response) => {
  res.json({
    success: true,
    roles: Object.values(CHAT_ROLES).map(r => ({
      id: r.id,
      name: r.name,
      badge: r.badge,
      model: r.model,
      tagline: r.tagline,
      suggestedQuestions: r.suggestedQuestions,
    }))
  });
});

// POST /api/gemini/chat - Multi-turn conversational endpoint powered by Gemini
geminiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, roleId = 'advisor', modelOverride } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid request: messages must be a non-empty array of conversation turns.',
      });
      return;
    }

    const selectedRole = CHAT_ROLES[roleId] || CHAT_ROLES['advisor'];
    // Default to the highly reliable gemini-3.1-flash-lite model, or override if specified
    const selectedModel = modelOverride || selectedRole.model || 'gemini-3.1-flash-lite';

    // Convert messages to Gemini API format
    const formattedContents = messages.map((m: { role: string; content: string }) => {
      const role = m.role === 'user' ? 'user' : 'model';
      return {
        role,
        parts: [{ text: String(m.content || '').trim() }],
      };
    }).filter(turn => turn.parts[0].text.length > 0);

    if (formattedContents.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid text content provided in messages.',
      });
      return;
    }

    let replyText = '';
    let actualModelUsed = selectedModel;

    // Call the server-side @google/genai SDK with resilient fallback
    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: formattedContents,
        config: {
          systemInstruction: selectedRole.systemInstruction,
          temperature: 0.7,
        },
      });
      replyText = response.text || '';
    } catch (primaryError: any) {
      console.warn(`Primary model ${selectedModel} failed (${primaryError?.message}). Falling back to gemini-3.1-flash-lite...`);
      if (selectedModel !== 'gemini-3.1-flash-lite') {
        actualModelUsed = 'gemini-3.1-flash-lite';
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: formattedContents,
          config: {
            systemInstruction: selectedRole.systemInstruction,
            temperature: 0.7,
          },
        });
        replyText = fallbackResponse.text || '';
      } else {
        throw primaryError;
      }
    }

    if (!replyText) {
      replyText = 'I received your inquiry regarding vehicle history records. How can I assist you with checking a VIN or understanding our AutoAudit reports?';
    }

    res.json({
      success: true,
      reply: replyText,
      modelUsed: actualModelUsed,
      roleId: selectedRole.id,
      roleName: selectedRole.name,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating Gemini chat response:', error);
    const errorMessage = error?.message || 'Failed to generate AI response';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
});
