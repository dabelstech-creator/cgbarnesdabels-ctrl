import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { message, logContext } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        reply: "Hello! I am your Workspace Automation Bot. I notice that the **GEMINI_API_KEY** is not configured in the server environment yet. Please add your key in the **Settings > Secrets** panel. For now, I'm running in local safe-mode, but I can still help you simulate actions!",
        action: "NONE"
      });
    }

    // Initialize the official @google/genai SDK with AI Studio build User-Agent header
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are a Live Workspace Automation Bot integrated directly into the Workspace Sync dashboard.
Your job is to assist the user (cgbarnesdabels@gmail.com) in monitoring, auditing, and automating their Google Workspace pipelines.
You can Conversate intelligently and trigger specific executable workspace automations by selecting one of the actions:
- 'SYNC_SERVICE': Trigger a metadata refresh/sync on a specific service (target can be: 'gmail', 'drive', 'calendar', 'contacts', or 'all').
- 'CLEAR_LOGS': Erase/clear the active audit trail logs.
- 'SPAM_BATCH': Insert a batch of simulated incoming traffic logs.
- 'ADD_SYNC_ITEM': Dynamically inject a new validated record directly into the synced ledger. This is perfect for drafting mock emails, scheduling compliance calendar meetings, index files, or adding organization contacts.
- 'NONE': Simply talk/respond without triggering an action.

Be helpful, concise, and professional. Ensure any ADD_SYNC_ITEM action includes structured, highly realistic content suited to the user's intent.`;

    const prompt = `User Message: "${message}"

Current logs context (for situational awareness):
${JSON.stringify(logContext || [])}

Analyze the user's request and reply in the structured JSON schema format provided.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { 
              type: Type.STRING, 
              description: "A friendly, professional conversational markdown reply describing what you are doing to assist." 
            },
            action: { 
              type: Type.STRING, 
              description: "The automation action to run.",
              enum: ["SYNC_SERVICE", "CLEAR_LOGS", "SPAM_BATCH", "ADD_SYNC_ITEM", "NONE"]
            },
            actionTarget: { 
              type: Type.STRING, 
              description: "The specific service target for SYNC_SERVICE: 'gmail', 'drive', 'calendar', 'contacts', 'all', or empty if not applicable." 
            },
            syncItem: {
              type: Type.OBJECT,
              description: "Structured item parameters if action is 'ADD_SYNC_ITEM'. Otherwise ignore or omit.",
              properties: {
                source: { 
                  type: Type.STRING, 
                  description: "Service source of the sync item. Must be: 'gmail' | 'drive' | 'calendar' | 'contacts'." 
                },
                title: { 
                  type: Type.STRING, 
                  description: "Professional, realistic title (e.g., 'Draft: Q2 Financial follow-up', 'Audit meeting: SOC2 Checkpoint')." 
                },
                subtitle: { 
                  type: Type.STRING, 
                  description: "Short descriptive subtitle (e.g. 'Created via AI automation agent')." 
                },
                details: { 
                  type: Type.STRING, 
                  description: "Longer detailed logs or actions summary." 
                }
              },
              required: ["source", "title", "subtitle", "details"]
            }
          },
          required: ["reply", "action"]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultObj = JSON.parse(resultText);

    return NextResponse.json({
      success: true,
      ...resultObj
    });
  } catch (error: any) {
    console.error("Workspace Bot Automation Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error during bot reasoning.",
      reply: "I encountered a minor error connecting to my Gemini automation circuits. Let's try running your instruction again shortly!",
      action: "NONE"
    }, { status: 500 });
  }
}
