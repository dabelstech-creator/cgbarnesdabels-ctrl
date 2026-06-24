import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "../../../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const actionText = action || "System Check";
    
    // Generate intelligent description of the automated action using Gemini
    const systemPrompt = `You are "Aero-Bot", an automated workspace operations and orchestration AI bot.
The user triggered the action: "${actionText}".
Describe the detailed technical operations you are performing to execute this action in a highly professional, polite, and reassuring tone.
Keep it concise (2-4 sentences). List a couple of realistic simulated server tasks (e.g. flushing DNS caches, syncing database shards, verifying Auth0 certificates, rotating security salts, checking background processes).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
    });

    const botMessage = response.text || `Executed automated workspace action: ${actionText} successfully. All systems nominal.`;

    // Create system and sync logs based on the action to push to Firestore
    const logsCollection = collection(db, "logs");
    
    // Log 1: Bot action initiated
    await addDoc(logsCollection, {
      type: "system",
      level: "info",
      message: `AI Bot triggered operation: ${actionText}.`,
      details: `Initiated by Workspace Automation Orchestrator. Spinning up background thread...`,
      timestamp: serverTimestamp(),
    });

    // Log 2: Bot execution success details
    const cleanDetails = botMessage.replace(/[\n\r]/g, " ");
    await addDoc(logsCollection, {
      type: actionText.toLowerCase().includes("security") ? "system" : "sync",
      level: "success",
      message: `AI Bot completed: ${actionText}.`,
      details: cleanDetails,
      timestamp: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      bot: {
        name: "Aero-Bot",
        status: "Online",
        lastAction: actionText,
        message: botMessage,
      }
    });
  } catch (error: any) {
    console.error("Error in workspace bot automator route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process automation action" },
      { status: 500 }
    );
  }
}
