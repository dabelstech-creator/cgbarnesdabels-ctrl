import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { logs } = await req.json();

    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json({ error: "Logs array is required for analysis." }, { status: 400 });
    }

    // Safe retrieval of the Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Graceful fallback when the key is not set
      return NextResponse.json({
        success: false,
        analysis: "### Gemini AI Analysis Suspended\n\nNo **GEMINI_API_KEY** detected in server environment. Please set this variable in your Settings menu to enable advanced AI-powered compliance analysis.",
        isDemo: true
      });
    }

    // Initialize the official @google/genai SDK
    const ai = new GoogleGenAI({ apiKey });

    // Format logs into a human-readable stream for analysis
    const logSummary = logs
      .map((l: any) => `[${l.timestamp}] [${l.type.toUpperCase()}] [${l.level.toUpperCase()}] ${l.message} - ${l.details}`)
      .join("\n");

    const prompt = `You are an expert Google Workspace Enterprise Security & Compliance auditor.
Analyze the following live integration audit trail logs for security threats, rate limits, OAuth leaks, and compliance anomalies.

${logSummary}

Provide a well-structured, professional, executive compliance audit report in Markdown format.
Include:
1. **Threat Assessment**: High, Medium, or Low security/sync risk level.
2. **Key Compliance Findings**: Specific observations regarding OAuth tokens, rate limits, or syncing events.
3. **Actionable Remediation**: Specific steps the administrator can take.
Keep your tone highly professional, concise, and executive-ready.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return NextResponse.json({
      success: true,
      analysis: response.text || "No response generated from model.",
      isDemo: false
    });
  } catch (error: any) {
    console.error("AI Compliance Audit Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error during Gemini analysis.",
      analysis: "### AI Analysis Error\n\nFailed to connect to Gemini services. Proceeding with offline compliance state."
    }, { status: 500 });
  }
}
