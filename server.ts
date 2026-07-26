
import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: 'digital-fte-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: true, 
      sameSite: 'none',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Google OAuth Setup
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  let oauth2Client: any = null;
  
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${appUrl}/auth/google/callback`
    );
  }

  const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/auth/google/url", (req, res) => {
    if (!oauth2Client) {
      return res.status(500).json({ error: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
    }
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMAIL_SCOPES,
      prompt: 'consent'
    });
    res.json({ url });
  });

  app.get(["/auth/google/callback", "/auth/google/callback/"], async (req, res) => {
    if (!oauth2Client) {
      return res.status(500).send("Google OAuth not configured.");
    }
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      // In a real app, you'd save these to a database associated with the user
      // For this demo, we'll store them in the session
      (req.session as any).tokens = tokens;
      
      res.send(`
        <html>
          <body style="background: #0a0a0a; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center;">
              <h2 style="color: #00f2ff;">NEURAL LINK ESTABLISHED</h2>
              <p>Gmail integration successful. Closing uplink...</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
                  setTimeout(() => window.close(), 1000);
                } else {
                  window.location.href = '/';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/gmail/status", (req, res) => {
    const tokens = (req.session as any).tokens;
    res.json({ connected: !!tokens });
  });

  app.post("/api/gmail/disconnect", (req, res) => {
    (req.session as any).tokens = null;
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
