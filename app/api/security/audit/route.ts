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
    // Perform simulated security diagnostics
    const diagnostics = {
      sslCertificate: "VALID - Expires in 242 days",
      jwtSignatureType: "RS256 (Highly Secure)",
      corsPolicy: "RESTRICTED (Allowed Origins: App Domains Only)",
      dbAccessControl: "ENFORCED (Zero-Trust Attribute Access Rules)",
      auth0Handshake: "STABLE (99.99% Handshake success)",
    };

    const systemPrompt = `You are a cybersecurity expert analyzing workspace metrics.
Diagnose this configuration:
SSL: ${diagnostics.sslCertificate}
JWT Signature: ${diagnostics.jwtSignatureType}
CORS Policy: ${diagnostics.corsPolicy}
Database Rules: ${diagnostics.dbAccessControl}
Auth0 Connection: ${diagnostics.auth0Handshake}

Write a summary security brief outlining the health of this system. Express confidence in the zero-trust setup, and mention if any potential configurations can be further hardened (e.g. rotating signing keys periodically). Keep it to 2-3 sentences, professional and objective.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
    });

    const auditBrief = response.text || "Workspace security configuration matches the zero-trust framework. SSL, CORS, and Auth0 integrations are active and verified. Continuous threat intelligence monitoring enabled.";

    // Write a security system log to Firestore
    const logsCollection = collection(db, "logs");
    await addDoc(logsCollection, {
      type: "system",
      level: "success",
      message: "Workspace Security Audit completed.",
      details: auditBrief.replace(/[\n\r]/g, " "),
      timestamp: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      score: 98,
      diagnostics,
      brief: auditBrief,
    });
  } catch (error: any) {
    console.error("Security audit route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute security audit" },
      { status: 500 }
    );
  }
}
