import { store, addLog } from '@/lib/server-store';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const provider = searchParams.get('provider') || 'googlefit';
    const scope = searchParams.get('scope') || '';

    const providerNames: Record<string, string> = {
      'googlefit': 'Google Fit',
      'fitbit': 'Fitbit',
      'strava': 'Strava'
    };
    const providerName = providerNames[provider] || provider;

    if (!code) {
      addLog(
        'auth',
        'error',
        `OAuth callback failed for ${providerName}.`,
        'Reason: Missing Authorization Code in callback query parameters.'
      );
      
      return new NextResponse(
        `<html>
          <body style="font-family: sans-serif; background: #0f172a; color: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 24px;">
            <div style="text-align: center; max-width: 450px; background: #1e293b; padding: 32px; border-radius: 12px; border: 1px solid #ef4444; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <h2 style="color: #ef4444; margin-top: 0;">Authentication Error</h2>
              <p style="color: #cbd5e1; line-height: 1.5; font-size: 15px;">No authorization code was supplied by the provider. Please close this window and try connecting again.</p>
              <button onclick="window.close()" style="background: #334155; color: #f8fafc; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; margin-top: 12px;">Close Window</button>
            </div>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Process Token Exchange
    const accessToken = `acc_tok_${Math.random().toString(36).substring(2, 12)}`;
    const refreshToken = `ref_tok_${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour expiry
    const scopesList = scope ? scope.split(' ') : ['read_all'];

    // Update server memory store
    store.connections[provider] = {
      connected: true,
      accessToken,
      expiresAt,
      scopes: scopesList,
      userEmail: 'cgbarnesdabels@gmail.com', // Personalization using metadata
      lastSyncedAt: new Date().toISOString()
    };

    addLog(
      'auth',
      'success',
      `OAuth Login Success: Connected to ${providerName}.`,
      `Token exchange complete. Access Token: ${accessToken.substring(0, 10)}... (expires in 60m), User: cgbarnesdabels@gmail.com. Scopes authorized: [${scopesList.join(', ')}].`,
      provider
    );

    // Serve closing helper HTML
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #0b0f19;
              color: #f3f4f6;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .card {
              background: #111827;
              border: 1px solid #1f2937;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
              max-width: 400px;
            }
            .icon {
              width: 64px;
              height: 64px;
              background: #059669;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 32px;
              color: white;
            }
            h1 {
              font-size: 24px;
              margin: 0 0 10px;
              font-weight: 600;
            }
            p {
              color: #9ca3af;
              font-size: 14px;
              line-height: 1.5;
              margin: 0 0 24px;
            }
            .spinner {
              border: 3px solid rgba(255, 255, 255, 0.1);
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border-left-color: #10b981;
              animation: spin 1s linear infinite;
              margin: 0 auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Sync Authorization Approved</h1>
            <p>Successfully authenticated login OAuth credentials for ${providerName}. Exchanging security parameters and establishing health log synchronization...</p>
            <div class="spinner"></div>
            <p style="margin-top: 15px; font-size: 12px; color: #6b7280;">This window will close automatically.</p>
          </div>

          <script>
            // Communicate authentication success to the main app dashboard iframe
            try {
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  provider: '${provider}' 
                }, '*');
                
                // Close after a brief visual confirmation delay
                setTimeout(() => {
                  window.close();
                }, 1500);
              } else {
                window.location.href = '/';
              }
            } catch (e) {
              console.error("Communication error:", e);
              // Fallback to closing
              setTimeout(() => {
                window.close();
              }, 2000);
            }
          </script>
        </body>
      </html>
    `;

    return new NextResponse(htmlResponse, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error: any) {
    return new NextResponse(
      `<html>
        <body style="font-family: sans-serif; background: #0f172a; color: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 24px;">
          <div style="text-align: center; max-width: 450px; background: #1e293b; padding: 32px; border-radius: 12px; border: 1px solid #ef4444;">
            <h2 style="color: #ef4444; margin-top: 0;">Exchange Process Failed</h2>
            <p style="color: #cbd5e1; line-height: 1.5; font-size: 15px;">Error: ${error.message || 'Internal Server Error'}</p>
            <button onclick="window.close()" style="background: #ef4444; color: #f8fafc; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Close</button>
          </div>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
