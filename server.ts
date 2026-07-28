import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import jwt from "jsonwebtoken";
import dns from "dns";
import tls from "tls";
import crypto from "crypto";


const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const CONFIG_PATH = path.join(DATA_DIR, "config.json");

const GOOGLE_CLIENT_ID = "588707402683-1v3gn52fnsnlisgo8e50eo1bpmqp521n.apps.googleusercontent.com";
const AUTHORIZED_EMAIL = "info@kyberit.tech";
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-kyberit-jwt-key-2026";
const RP_ID = process.env.NODE_ENV === "production" ? "kyberit.tech" : "localhost";
const RP_NAME = "Kyberit AI Studio";
const expectedOrigin = process.env.NODE_ENV === "production" ? ["https://kyberit.tech", "https://www.kyberit.tech"] : ["http://localhost:3000", "http://localhost:5173"];

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

interface PasskeyDevice {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  transports?: string[];
}

interface DiagnosticReport {
  id: string;
  timestamp: string;
  url: string;
  email: string;
  score: number;
  status: string;
  summary: string;
  report: any;
}

interface SiteConfig {
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    contactEmail: string;
  };
  sanity: {
    projectId: string;
    dataset: string;
    organizationId?: string;
  };
  turnstile: {
    siteKey: string;
    secretKey: string;
  };
  diagnostics: DiagnosticReport[];
  passkeys: PasskeyDevice[];
  currentChallenge?: string;
}

const getConfig = (): SiteConfig => {
  const defaults: SiteConfig = {
    smtp: { host: "", port: 587, user: "", pass: "", from: "", contactEmail: "" },
    sanity: { projectId: "", dataset: "production", organizationId: "" },
    turnstile: { siteKey: "", secretKey: "" },
    diagnostics: [],
    passkeys: []
  };

  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      return {
        smtp: { ...defaults.smtp, ...saved.smtp },
        sanity: { ...defaults.sanity, ...saved.sanity },
        turnstile: { ...defaults.turnstile, ...saved.turnstile },
        diagnostics: saved.diagnostics || defaults.diagnostics,
        passkeys: saved.passkeys || [],
        currentChallenge: saved.currentChallenge
      };
    } catch (e) {
      console.error("Errore lettura config.json", e);
    }
  }
  return defaults;
};

const saveConfig = (config: SiteConfig) => {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
};

const isValidEmail = (email: string) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

async function verifyTurnstile(token: string) {
  const config = getConfig();
  const secretKey = config.turnstile.secretKey || process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) return true; // Skip if no secret key configured
  if (!token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for express-rate-limit and other middleware
  app.set('trust proxy', 1);

  app.use(express.json());

  // Basic Anti-Fuzzer / Bad Bot Blocker
  app.use((req, res, next) => {
    const ua = req.get('User-Agent') || '';
    const badBots = ['fuzzer', 'nikto', 'sqlmap', 'nmap', 'zgrab', 'masscan'];
    if (!ua || badBots.some(bot => ua.toLowerCase().includes(bot))) {
      return res.status(403).send('Forbidden: Invalid User-Agent');
    }
    next();
  });

  // Security Headers Middleware (Helmet)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "blob:", "https://challenges.cloudflare.com", "https://*.cloudflare.com", "https://*.cloudflareinsights.com", "https://*.google.com", "https://*.googleapis.com", "https://*.gstatic.com", "https://cdn.jsdelivr.net"],
        scriptSrcElem: ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com", "https://*.cloudflare.com", "https://*.google.com", "https://*.gstatic.com", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://challenges.cloudflare.com", "https://*.cloudflare.com", "https://*.gstatic.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://picsum.photos", "https://*.picsum.photos", "https://cdn.sanity.io", "https://challenges.cloudflare.com", "https://*.cloudflare.com", "https://*.google.com", "https://*.gstatic.com"],
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://*.sanity.io", "https://challenges.cloudflare.com", "https://*.cloudflare.com", "https://*.cloudflareinsights.com", "https://*.google.com", "https://*.googleapis.com"],
        frameSrc: ["'self'", "https://challenges.cloudflare.com", "https://*.cloudflare.com", "https://*.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }));

  // CORS Middleware
  app.use(cors({
    origin: ["https://kyberit.tech", "https://www.kyberit.tech", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  // Rate Limiters
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Troppi tentativi di accesso. Riprova tra 15 minuti." }
  });

  const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Troppe richieste. Riprova tra un'ora." }
  });

  // Middleware to check auth via JWT
  const checkAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
      if (decoded.email !== AUTHORIZED_EMAIL) throw new Error("Invalid email");
      next();
    } catch (e) {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // Google SSO Auth
  app.post("/api/auth/google", authLimiter, async (req, res) => {
    try {
      const { credential } = req.body;
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || payload.email !== AUTHORIZED_EMAIL) {
        return res.status(403).json({ error: "Email non autorizzata." });
      }
      const token = jwt.sign({ email: payload.email }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ success: true, token });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: "Login fallito." });
    }
  });

  // WebAuthn Passkeys Endpoints
  app.get("/api/webauthn/generate-authentication-options", authLimiter, async (req, res) => {
    const config = getConfig();
    if (config.passkeys.length === 0) {
      return res.status(400).json({ error: "Nessuna passkey registrata." });
    }
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: config.passkeys.map(dev => ({
        id: dev.credentialID,
        type: 'public-key',
        transports: dev.transports as any,
      })),
      userVerification: 'preferred',
    });
    config.currentChallenge = options.challenge;
    saveConfig(config);
    res.json(options);
  });

  app.post("/api/webauthn/verify-authentication", authLimiter, async (req, res) => {
    const body = req.body;
    const config = getConfig();
    if (!config.currentChallenge) return res.status(400).json({ error: "Sfida non trovata" });
    const authenticator = config.passkeys.find(p => p.credentialID === body.id);
    if (!authenticator) return res.status(400).json({ error: "Passkey non trovata" });
    
    try {
      const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge: config.currentChallenge,
        expectedOrigin,
        expectedRPID: RP_ID,
        credential: {
          id: authenticator.credentialID,
          publicKey: new Uint8Array(Buffer.from(authenticator.credentialPublicKey, 'base64')),
          counter: authenticator.counter,
          transports: authenticator.transports as any,
        }
      });
      if (verification.verified) {
        config.currentChallenge = undefined;
        authenticator.counter = verification.authenticationInfo.newCounter;
        saveConfig(config);
        const token = jwt.sign({ email: AUTHORIZED_EMAIL }, JWT_SECRET, { expiresIn: "24h" });
        return res.json({ verified: true, token });
      }
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: "Verifica fallita" });
  });

  app.get("/api/webauthn/generate-registration-options", checkAuth, async (req, res) => {
    const config = getConfig();
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: Buffer.from(AUTHORIZED_EMAIL),
      userName: AUTHORIZED_EMAIL,
      attestationType: 'none',
      excludeCredentials: config.passkeys.map(dev => ({
        id: dev.credentialID,
        type: 'public-key',
        transports: dev.transports as any,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      }
    });
    config.currentChallenge = options.challenge;
    saveConfig(config);
    res.json(options);
  });

  app.post("/api/webauthn/verify-registration", checkAuth, async (req, res) => {
    const body = req.body;
    const config = getConfig();
    if (!config.currentChallenge) return res.status(400).json({ error: "Sfida non trovata" });
    try {
      const verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: config.currentChallenge,
        expectedOrigin,
        expectedRPID: RP_ID,
      });
      if (verification.verified && verification.registrationInfo) {
        const newDevice: PasskeyDevice = {
          credentialID: verification.registrationInfo.credential.id,
          credentialPublicKey: Buffer.from(verification.registrationInfo.credential.publicKey).toString('base64'),
          counter: verification.registrationInfo.credential.counter,
          transports: body.response.transports,
        };
        config.passkeys.push(newDevice);
        config.currentChallenge = undefined;
        saveConfig(config);
        return res.json({ verified: true });
      }
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: "Registrazione fallita" });
  });

  // API Route to get public config (Sanity, Iubenda, Turnstile keys)
  app.get("/api/config/public", (req, res) => {
    const config = getConfig();
    res.json({
      sanity: { projectId: config.sanity.projectId, dataset: config.sanity.dataset },
      turnstile: { siteKey: config.turnstile.siteKey }
    });
  });

  // API Route to get full current config (Requires Auth)
  app.get("/api/config", authLimiter, checkAuth, (req, res) => {
    res.json(getConfig());
  });

  // API Route to save config
  app.post("/api/config", authLimiter, checkAuth, (req, res) => {
    const currentConfig = getConfig();
    const newConfig = req.body;
    saveConfig({ ...currentConfig, ...newConfig });
    res.json({ success: true });
  });

  // Gemini API Proxy
const geminiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppe richieste. Riprova tra un'ora." }
});

app.post("/api/gemini-proxy", geminiLimiter, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return res.status(500).json({ 
      error: "GEMINI_API_KEY non configurata sul server." 
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const { model, ...bodyRest } = req.body;
    const response = await ai.models.generateContent({
      model: model || "gemini-2.0-flash",
      ...bodyRest
    });
    res.json(response);
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    // Provide more context if it's an API key error
    if (error.message?.includes("API key not valid")) {
      return res.status(400).json({ 
        success: false, 
        error: "La chiave API di Gemini non è valida. Verifica la configurazione nei Segreti del progetto.",
        details: error.message 
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

  // API Route to test SMTP connection
  app.post("/api/config/test-smtp", authLimiter, checkAuth, async (req, res) => {
    const { host, port, user, pass } = req.body;
    
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
      connectionTimeout: 5000,
    });

    try {
      await transporter.verify();
      res.json({ success: true, message: "Connessione SMTP verificata con successo!" });
    } catch (error: any) {
      console.error("Errore Test SMTP:", error);
      res.status(500).json({ 
        success: false, 
        error: error.code === 'EAUTH' ? "Credenziali non accettate." : "Errore di connessione.",
        details: error.message 
      });
    }
  });

  // API Route for Contact Form
  app.post("/api/contact", apiLimiter, async (req, res) => {
    const { name, email, subject, message, lang = "it", turnstileToken } = req.body;
    
    // Verify Turnstile
    const isHuman = await verifyTurnstile(turnstileToken);
    if (!isHuman) {
      return res.status(400).json({ success: false, error: "Verifica di sicurezza fallita. Riprova." });
    }

    const config = getConfig();

    // Simple translation map for email labels
    const labels: Record<string, any> = {
      it: { name: "Nome", email: "Email", subject: "Oggetto", message: "Messaggio", title: "Nuovo Messaggio" },
      en: { name: "Name", email: "Email", subject: "Subject", message: "Message", title: "New Message" },
      de: { name: "Name", email: "E-Mail", subject: "Betreff", message: "Nachricht", title: "Neue Nachricht" },
      fr: { name: "Nom", email: "E-mail", subject: "Objet", message: "Message", title: "Nouveau Message" }
    };

    const l = labels[lang] || labels.it;

    // SMTP Configuration (Priority: Local Config > ENV fallback)
    const smtpHost = config.smtp.host || process.env.SMTP_HOST;
    const smtpPort = Number(config.smtp.port || process.env.SMTP_PORT) || 587;
    const smtpUser = config.smtp.user || process.env.SMTP_USER;
    const smtpPass = config.smtp.pass || process.env.SMTP_PASS;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000, 
      greetingTimeout: 10000,
    });

    try {
      const senderEmail = config.smtp.from || process.env.SMTP_FROM || (isValidEmail(smtpUser) ? smtpUser : undefined);
      
      // If config has a specific 'to' address, use it, otherwise use info@kyberit.tech
      const recipient = config.smtp.contactEmail || process.env.CONTACT_RECIPIENT || "info@kyberit.tech";

      if (!senderEmail) {
        console.error("Errore: Mittente email non configurato o non valido.");
        return res.status(500).json({ success: false, error: "Servizio email non configurato." });
      }

      const labels: Record<string, any> = {
        it: { title: "Nuovo Messaggio", name: "Nome", email: "Email", subject: "Oggetto", message: "Messaggio", thanks: "Grazie per averci contattato", thanksMsg: "Abbiamo ricevuto la tua richiesta e ti risponderemo al più presto." },
        en: { title: "New Message", name: "Name", email: "Email", subject: "Subject", message: "Message", thanks: "Thank you for contacting us", thanksMsg: "We have received your request and will get back to you as soon as possible." },
        de: { title: "Neue Nachricht", name: "Name", email: "E-Mail", subject: "Betreff", message: "Nachricht", thanks: "Vielen Dank per Kontakt", thanksMsg: "Wir haben Ihre Anfrage erhalten e werden uns so schnell wie möglich bei Ihnen melden." },
        fr: { title: "Nouveau Message", name: "Nom", email: "E-mail", subject: "Objet", message: "Message", thanks: "Merci de nous avoir contactés", thanksMsg: "Nous abbiamo ricevuto la tua richiesta e ti risponderemo al più presto." }
      };
      const l = labels[lang] || labels.it;

      const emailHtmlAdmin = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; border: 1px solid #1a1a1a; padding: 30px; border-radius: 15px;">
          <h2 style="color: #00f2ff; border-bottom: 1px solid #1a1a1a; padding-bottom: 10px;">${l.title}</h2>
          <p style="margin: 10px 0;"><strong>${l.name}:</strong> ${name}</p>
          <p style="margin: 10px 0;"><strong>${l.email}:</strong> ${email}</p>
          <p style="margin: 10px 0;"><strong>${l.subject}:</strong> ${subject}</p>
          <div style="margin-top: 20px; padding: 15px; background: #111; border-radius: 8px; color: #ccc;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="font-size: 10px; color: #444; margin-top: 30px; font-family: monospace;">
            SENT_VIA: KYBERIT_WEB_CORE<br>
            TIMESTAMP: ${new Date().toISOString()}
          </p>
        </div>
      `;

      const emailHtmlUser = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; border: 1px solid #1a1a1a; padding: 30px; border-radius: 15px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: #00f2ff; color: #000000; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 10px; letter-spacing: 1px;">KYBERIT</div>
          </div>
          <h2 style="color: #ffffff; text-align: center;">${l.thanks}</h2>
          <p style="color: #999; text-align: center; line-height: 1.6;">${l.thanksMsg}</p>
          <div style="margin-top: 30px; padding: 20px; border-top: 1px solid #1a1a1a;">
            <p style="font-size: 12px; color: #555; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Il tuo messaggio:</p>
            <p style="font-size: 14px; color: #ccc; font-style: italic;">"${message}"</p>
          </div>
          <p style="font-size: 10px; color: #888; text-align: center; margin-top: 30px;">
            Kyberit IT Solutions - Digital Infrastructure
          </p>
        </div>
      `;

      // Send to Admin if recipient is valid
      if (isValidEmail(recipient)) {
        await transporter.sendMail({
          from: senderEmail,
          to: recipient,
          replyTo: email,
          subject: `[Kyberit ${lang.toUpperCase()}] ${subject || l.title}`,
          text: `${l.name}: ${name}\n${l.email}: ${email}\n\n${l.message}:\n${message}`,
          html: emailHtmlAdmin
        });
      }

      // Send Confirmation to User if email is valid
      if (isValidEmail(email)) {
        await transporter.sendMail({
          from: senderEmail,
          to: email,
          subject: `Kyberit: ${l.thanks}`,
          html: emailHtmlUser
        });
      }

      res.json({ success: true, message: "Email inviata con successo" });
    } catch (error: any) {
      console.error("Errore SMTP:", error);
      res.status(500).json({ success: false, error: "Errore invio email", details: error.message });
    }
  });

  // API Route for AI Infrastructure Audit Storage and Notification
  app.post("/api/diagnostic/save", apiLimiter, async (req, res) => {
    const { url, email, report, lang = "it", turnstileToken } = req.body;

    // Verify Turnstile
    const isHuman = await verifyTurnstile(turnstileToken);
    if (!isHuman) {
      return res.status(400).json({ success: false, error: "Verifica di sicurezza fallita." });
    }

    const config = getConfig();

    const newDiagnostic: DiagnosticReport = {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
      url,
      email,
      score: report.score,
      status: report.status,
      summary: report.summary,
      report
    };

    // Save to config.json
    config.diagnostics = [newDiagnostic, ...(config.diagnostics || [])].slice(0, 100); // Keep last 100
    saveConfig({
      smtp: config.smtp,
      sanity: config.sanity,
      iubenda: config.iubenda,
      turnstile: config.turnstile,
      diagnostics: config.diagnostics
    });

    // Send Email Notification
    const smtpHost = config.smtp.host || process.env.SMTP_HOST;
    const smtpPort = Number(config.smtp.port || process.env.SMTP_PORT) || 587;
    const smtpUser = config.smtp.user || process.env.SMTP_USER;
    const smtpPass = config.smtp.pass || process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const labels: Record<string, any> = {
        it: { title: "Report Diagnostico AI", score: "Punteggio", status: "Stato", summary: "Riepilogo", recommendations: "Raccomandazioni" },
        en: { title: "AI Diagnostic Report", score: "Score", status: "Status", summary: "Summary", recommendations: "Recommendations" },
        de: { title: "KI-Diagnosebericht", score: "Punktzahl", status: "Status", summary: "Zusammenfassung", recommendations: "Empfehlungen" },
        fr: { title: "Rapport de Diagnostic IA", score: "Score", status: "État", summary: "Synthèse", recommendations: "Recommandations" }
      };
      const l = labels[lang] || labels.it;

      const senderEmail = config.smtp.from || process.env.SMTP_FROM || (isValidEmail(smtpUser) ? smtpUser : undefined);
      const adminRecipient = config.smtp.contactEmail || process.env.CONTACT_RECIPIENT || "info@kyberit.tech";

      if (!senderEmail) {
        console.error("Errore: Mittente email non configurato o non valido.");
        return res.json({ success: true, id: newDiagnostic.id, warning: "Email non inviata: mittente non configurato." });
      }

      const emailHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; border: 1px solid #1a1a1a; padding: 40px; border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: #00f2ff; color: #000000; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 12px; letter-spacing: 2px; margin-bottom: 10px;">KYBERIT AI AUDIT</div>
            <h1 style="color: #ffffff; font-size: 28px; letter-spacing: -1px; margin: 0;">${url}</h1>
          </div>

          <div style="background: linear-gradient(135deg, #111, #000); border: 1px solid #333; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; font-weight: bold; color: ${report.score > 80 ? '#4ade80' : report.score > 50 ? '#fbbf24' : '#f87171'}; margin-bottom: 5px;">${report.score}/100</div>
            <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 2px;">${l.score} Global</div>
            <div style="margin-top: 15px; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: bold; text-transform: uppercase; border: 1px solid ${report.score > 80 ? '#4ade8033' : '#fbbf2433'}; color: ${report.score > 80 ? '#4ade80' : '#fbbf24'}; background: ${report.score > 80 ? '#4ade8011' : '#fbbf2411'};">
              ${report.status}
            </div>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #00f2ff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #1a1a1a; padding-bottom: 10px;">${l.summary}</h3>
            <p style="color: #999; font-size: 14px; line-height: 1.6;">${report.summary}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #00f2ff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #1a1a1a; padding-bottom: 10px;">${l.recommendations}</h3>
            <ul style="padding-left: 20px; color: #ccc; font-size: 14px; line-height: 1.8;">
              ${report.recommendations.map((r: string) => `<li style="margin-bottom: 10px;"><span style="color: #00f2ff;">•</span> ${r}</li>`).join('')}
            </ul>
          </div>

          <div style="border-top: 1px solid #1a1a1a; padding-top: 20px; text-align: center; font-size: 11px; color: #444; font-family: monospace;">
            SYS::AUDIT_LOG // ID: ${newDiagnostic.id}<br>
            REQUESTED_BY: ${email}<br>
            TIMESTAMP: ${new Date().toISOString()}
          </div>
        </div>
      `;

      try {
        // Send to user if email is valid
        if (isValidEmail(email)) {
          await transporter.sendMail({
            from: senderEmail,
            to: email,
            subject: `${l.title}: ${url}`,
            html: emailHtml
          });
        } else {
          console.warn(`Email utente non valida: ${email}`);
        }

        // Send copy to admin if email is valid
        if (isValidEmail(adminRecipient)) {
          await transporter.sendMail({
            from: senderEmail,
            to: adminRecipient,
            subject: `[AUDIT LOG] ${url} - ${email}`,
            html: emailHtml
          });
        } else {
          console.warn(`Email admin non valida: ${adminRecipient}`);
        }
      } catch (err) {
        console.error("Errore invio email diagnostica:", err);
      }
    }

    res.json({ success: true, id: newDiagnostic.id });
  });

  // --- FREE DIAGNOSTIC TOOLS API ENDPOINTS ---

  // 1. Header Security Scan
  app.post("/api/tools/header-security", apiLimiter, async (req, res) => {
    let { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Prepend protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    try {
      const parsedUrl = new URL(url);
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(parsedUrl.href, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 KyberitSecurityScanner/1.0"
        },
        signal: controller.signal
      });
      clearTimeout(id);

      const headers = response.headers;
      const securityHeaders = [
        {
          name: "Strict-Transport-Security",
          present: headers.has("strict-transport-security"),
          value: headers.get("strict-transport-security") || "",
          score: headers.has("strict-transport-security") ? 20 : 0,
          description: "Forza la connessione HTTPS sicura.",
          recommendation: "Aggiungi l'header: max-age=31536000; includeSubDomains; preload"
        },
        {
          name: "Content-Security-Policy",
          present: headers.has("content-security-policy"),
          value: headers.get("content-security-policy") || "",
          score: headers.has("content-security-policy") ? 30 : 0,
          description: "Previene attacchi XSS e iniezione di dati.",
          recommendation: "Configura una policy restrittiva per script, stili e immagini."
        },
        {
          name: "X-Frame-Options",
          present: headers.has("x-frame-options"),
          value: headers.get("x-frame-options") || "",
          score: headers.has("x-frame-options") ? 15 : 0,
          description: "Protegge dal clickjacking impedendo l'incorporamento del sito.",
          recommendation: "Imposta a DENY o SAMEORIGIN."
        },
        {
          name: "X-Content-Type-Options",
          present: headers.has("x-content-type-options"),
          value: headers.get("x-content-type-options") || "",
          score: headers.has("x-content-type-options") ? 15 : 0,
          description: "Previene il MIME type sniffing.",
          recommendation: "Imposta a nosniff."
        },
        {
          name: "Referrer-Policy",
          present: headers.has("referrer-policy"),
          value: headers.get("referrer-policy") || "",
          score: headers.has("referrer-policy") ? 10 : 0,
          description: "Controlla le informazioni di referrer inviate con le richieste.",
          recommendation: "Imposta a strict-origin-when-cross-origin."
        },
        {
          name: "Permissions-Policy",
          present: headers.has("permissions-policy") || headers.has("feature-policy"),
          value: headers.get("permissions-policy") || headers.get("feature-policy") || "",
          score: (headers.has("permissions-policy") || headers.has("feature-policy")) ? 10 : 0,
          description: "Limita l'accesso alle funzionalità del browser (es. fotocamera, geolocalizzazione).",
          recommendation: "Disabilita le API inutilizzate (es. camera=(), microphone=())."
        }
      ];

      const totalScore = securityHeaders.reduce((acc, h) => acc + h.score, 0);

      return res.json({
        url: parsedUrl.href,
        score: totalScore,
        headers: securityHeaders
      });
    } catch (error: any) {
      console.error("Header security scan error:", error);
      return res.status(500).json({ error: "Impossibile contattare l'URL o formato non valido. Assicurati che il sito sia online." });
    }
  });

  // 2. SSL/TLS Checker
  app.post("/api/tools/ssl-checker", apiLimiter, async (req, res) => {
    let { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    // Clean domain name
    let cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].split(":")[0];

    try {
      const checkSSL = () => {
        return new Promise<{
          valid: boolean;
          subject: any;
          issuer: any;
          validFrom: string;
          validTo: string;
          daysRemaining: number;
          protocol: string;
          cipher: string;
        }>((resolve, reject) => {
          const socket = tls.connect({
            host: cleanDomain,
            port: 443,
            servername: cleanDomain,
            rejectUnauthorized: false
          }, () => {
            const cert = socket.getPeerCertificate();
            const protocol = socket.getProtocol() || "Unknown";
            const cipher = socket.getCipher()?.name || "Unknown";
            socket.destroy();

            if (!cert || !cert.valid_to) {
              reject(new Error("Nessun certificato SSL trovato"));
              return;
            }

            const validToDate = new Date(cert.valid_to);
            const now = new Date();
            const daysRemaining = Math.max(0, Math.round((validToDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const valid = daysRemaining > 0 && socket.authorized;

            resolve({
              valid,
              subject: cert.subject,
              issuer: cert.issuer,
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
              daysRemaining,
              protocol,
              cipher
            });
          });

          socket.on("error", (err) => {
            socket.destroy();
            reject(err);
          });

          socket.setTimeout(5000, () => {
            socket.destroy();
            reject(new Error("Timeout di connessione SSL"));
          });
        });
      };

      const result = await checkSSL();
      return res.json(result);
    } catch (error: any) {
      console.error("SSL Check error:", error);
      return res.status(500).json({ error: `Errore verifica SSL per ${cleanDomain}: ${error.message || error}` });
    }
  });

  // 3. Password Breach Check
  app.post("/api/tools/password-breach", apiLimiter, async (req, res) => {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    try {
      const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
      const prefix = sha1.substring(0, 5);
      const suffix = sha1.substring(5);

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        signal: controller.signal
      });
      clearTimeout(id);

      if (!response.ok) {
        throw new Error("Errore API HaveIBeenPwned");
      }

      const text = await response.text();
      const lines = text.split("\n");
      let count = 0;

      for (const line of lines) {
        const [lineSuffix, lineCount] = line.split(":");
        if (lineSuffix.trim() === suffix) {
          count = parseInt(lineCount, 10);
          break;
        }
      }

      return res.json({
        breached: count > 0,
        count
      });
    } catch (error: any) {
      console.error("Password breach check error:", error);
      return res.status(500).json({ error: "Errore durante la verifica del data breach. Riprova più tardi." });
    }
  });

  // 4. Email/DNS Audit
  app.post("/api/tools/dns-audit", apiLimiter, async (req, res) => {
    let { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    // Clean domain name
    let cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].split(":")[0];

    try {
      const dnsResolver = dns.promises;
      
      let spfRecord = "";
      let dmarcRecord = "";
      let mxRecords: any[] = [];

      // SPF check
      try {
        const txtRecords = await dnsResolver.resolveTxt(cleanDomain);
        const spf = txtRecords.flat().find(r => r.startsWith("v=spf1"));
        if (spf) spfRecord = spf;
      } catch (e) {
        // ignore
      }

      // DMARC check
      try {
        const dmarcTxt = await dnsResolver.resolveTxt(`_dmarc.${cleanDomain}`);
        const dmarc = dmarcTxt.flat().find(r => r.startsWith("v=DMARC1"));
        if (dmarc) dmarcRecord = dmarc;
      } catch (e) {
        // ignore
      }

      // MX check
      try {
        mxRecords = await dnsResolver.resolveMx(cleanDomain);
      } catch (e) {
        // ignore
      }

      return res.json({
        domain: cleanDomain,
        spf: {
          present: !!spfRecord,
          record: spfRecord || null,
          description: "Controlla quali server sono autorizzati a inviare email per il tuo dominio.",
          status: spfRecord ? "secure" : "warning"
        },
        dmarc: {
          present: !!dmarcRecord,
          record: dmarcRecord || null,
          description: "Fornisce istruzioni al server ricevente su come gestire le email che falliscono SPF/DKIM.",
          status: dmarcRecord ? "secure" : "warning"
        },
        mx: {
          present: mxRecords.length > 0,
          records: mxRecords,
          description: "Indica i server di posta responsabili della ricezione delle email per il dominio.",
          status: mxRecords.length > 0 ? "secure" : "warning"
        }
      });
    } catch (error: any) {
      console.error("DNS Audit error:", error);
      return res.status(500).json({ error: `Errore durante l'audit DNS: ${error.message || error}` });
    }
  });

  // 5. Send Report via Email
  app.post("/api/tools/send-report", apiLimiter, async (req, res) => {
    const { name, email, company, consent, scanType, scanData, urlOrDomain, lang } = req.body;

    if (!name || !email || !consent) {
      return res.status(400).json({ error: "Nome, email e consenso al trattamento dei dati sono obbligatori." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Indirizzo e-mail non valido." });
    }

    const config = getConfig();
    const smtpHost = config.smtp.host || process.env.SMTP_HOST;
    const smtpPort = Number(config.smtp.port || process.env.SMTP_PORT) || 587;
    const smtpUser = config.smtp.user || process.env.SMTP_USER;
    const smtpPass = config.smtp.pass || process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("Configurazione SMTP mancante per l'invio del report.");
      return res.status(500).json({ error: "Servizio email non configurato sul server." });
    }

    // Localization Dictionary
    const dictionary: any = {
      it: {
        title: "Il tuo Report di Sicurezza",
        subtitle: `Ciao ${name}, ecco i dettagli dell'audit richiesto per la tua infrastruttura digitale.`,
        headerTitle: "Report Sicurezza degli Header HTTP",
        sslTitle: "Report Controllo SSL / TLS",
        passwordTitle: "Report Verifica Violazione Password",
        dnsTitle: "Report Audit Email / DNS",
        scoreLabel: "Punteggio",
        presentLabel: "Presente",
        missingLabel: "Mancante",
        statusLabel: "Stato",
        recommendationLabel: "Raccomandazione / Dettagli",
        issuerLabel: "Emesso da",
        expiresLabel: "Scade il",
        daysRemainingLabel: "giorni rimanenti",
        protocolLabel: "Protocollo",
        cipherLabel: "Cipher Suite",
        passOk: "Sicura (non trovata nei data breach noti)",
        passBreached: `Compromessa (rilevata nei data breach noti)`,
        passNote: "Nota: I controlli avvengono in modo totalmente anonimo tramite k-anonymity (senza mai inviare la password in chiaro al server).",
        configuredLabel: "Configurato",
        missingDnsLabel: "Mancante",
        spfLabel: "Record SPF",
        dmarcLabel: "Record DMARC",
        mxLabel: "Record MX",
        footerCompany: "Azienda",
        footerConsent: "Consenso Trattamento Dati",
        subject: `Kyberit Labs: Report Sicurezza per ${urlOrDomain || 'Audit'}`
      },
      en: {
        title: "Your Security Report",
        subtitle: `Hello ${name}, here are the details of the audit requested for your digital infrastructure.`,
        headerTitle: "HTTP Headers Security Scan Report",
        sslTitle: "SSL / TLS Checker Report",
        passwordTitle: "Password Breach Check Report",
        dnsTitle: "Email / DNS Audit Report",
        scoreLabel: "Score",
        presentLabel: "Present",
        missingLabel: "Missing",
        statusLabel: "Status",
        recommendationLabel: "Recommendation / Details",
        issuerLabel: "Issued by",
        expiresLabel: "Expires on",
        daysRemainingLabel: "days remaining",
        protocolLabel: "Protocol",
        cipherLabel: "Cipher Suite",
        passOk: "Safe (not found in known data breaches)",
        passBreached: `Compromised (detected in known data breaches)`,
        passNote: "Note: Controls are completely anonymous via k-anonymity (without ever sending the plain password to the server).",
        configuredLabel: "Configured",
        missingDnsLabel: "Missing",
        spfLabel: "SPF Record",
        dmarcLabel: "DMARC Record",
        mxLabel: "MX Record",
        footerCompany: "Company",
        footerConsent: "Data Processing Consent",
        subject: `Kyberit Labs: Security Report for ${urlOrDomain || 'Audit'}`
      },
      de: {
        title: "Ihr Sicherheitsbericht",
        subtitle: `Hallo ${name}, hier sind die Details des angeforderten Audits für Ihre digitale Infrastruktur.`,
        headerTitle: "Sicherheitsbericht für HTTP-Header",
        sslTitle: "SSL / TLS Prüfbericht",
        passwordTitle: "Passwort-Sicherheitsbericht",
        dnsTitle: "E-Mail / DNS Auditbericht",
        scoreLabel: "Bewertung",
        presentLabel: "Vorhanden",
        missingLabel: "Fehlend",
        statusLabel: "Status",
        recommendationLabel: "Empfehlung / Details",
        issuerLabel: "Ausgestellt von",
        expiresLabel: "Läuft ab am",
        daysRemainingLabel: "Tage verbleibend",
        protocolLabel: "Protokoll",
        cipherLabel: "Cipher-Suite",
        passOk: "Sicher (in bekannten Datenlecks nicht gefunden)",
        passBreached: `Gefährdet (in bekannten Datenlecks gefunden)`,
        passNote: "Hinweis: Die Prüfungen erfolgen über k-Anonymität vollständig anonym (ohne Übertragung des Passworts im Klartext an den Server).",
        configuredLabel: "Konfiguriert",
        missingDnsLabel: "Fehlend",
        spfLabel: "SPF-Eintrag",
        dmarcLabel: "DMARC-Eintrag",
        mxLabel: "MX-Eintrag",
        footerCompany: "Unternehmen",
        footerConsent: "Einwilligung Datenverarbeitung",
        subject: `Kyberit Labs: Sicherheitsbericht für ${urlOrDomain || 'Audit'}`
      },
      fr: {
        title: "Votre Rapport de Sécurité",
        subtitle: `Bonjour ${name}, voici les détails de l'audit demandé pour votre infrastructure numérique.`,
        headerTitle: "Rapport d'analyse de sécurité des en-têtes HTTP",
        sslTitle: "Rapport de vérification SSL / TLS",
        passwordTitle: "Rapport de compromission de mot de passe",
        dnsTitle: "Rapport d'audit e-mail / DNS",
        scoreLabel: "Score",
        presentLabel: "Présent",
        missingLabel: "Absent",
        statusLabel: "Statut",
        recommendationLabel: "Recommandation / Détails",
        issuerLabel: "Émis par",
        expiresLabel: "Expire le",
        daysRemainingLabel: "jours restants",
        protocolLabel: "Protocole",
        cipherLabel: "Suite de chiffrement",
        passOk: "Sécurisé (non trouvé dans les fuites de données connues)",
        passBreached: `Compromis (détecté dans les fuites de données connues)`,
        passNote: "Remarque : Les contrôles s'effectuent de manière totalement anonyme via la k-anonymat (sans jamais envoyer le mot de passe en clair au serveur).",
        configuredLabel: "Configuré",
        missingDnsLabel: "Manquant",
        spfLabel: "Enregistrement SPF",
        dmarcLabel: "Enregistrement DMARC",
        mxLabel: "Enregistrement MX",
        footerCompany: "Entreprise",
        footerConsent: "Consentement Traitement Données",
        subject: `Kyberit Labs: Rapport de Sécurité pour ${urlOrDomain || 'Audit'}`
      }
    };

    const userLang = lang === "en" || lang === "de" || lang === "fr" ? lang : "it";
    const t = dictionary[userLang];

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const senderEmail = config.smtp.from || process.env.SMTP_FROM || (isValidEmail(smtpUser) ? smtpUser : undefined);
      const adminRecipient = config.smtp.contactEmail || process.env.CONTACT_RECIPIENT || "info@kyberit.tech";

      if (!senderEmail) {
        return res.status(500).json({ error: "Mittente email non configurato." });
      }

      // Generate a detailed report HTML based on scanType and scanData
      let reportDetailsHtml = "";
      if (scanType === "header") {
        reportDetailsHtml = `
          <h3 style="color: #00f2ff; font-family: sans-serif;">${t.headerTitle}</h3>
          <p style="color: #ccc; font-family: sans-serif;">Target: <strong>${urlOrDomain}</strong></p>
          <div style="background: #111; padding: 20px; border-radius: 8px; border: 1px solid #222; margin: 20px 0;">
            <p style="font-size: 24px; font-weight: bold; color: #4ade80; margin: 0; font-family: sans-serif;">${t.scoreLabel}: ${scanData.score}/100</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; color: #eee; font-family: sans-serif;">
            <thead>
              <tr style="border-bottom: 2px solid #333; text-align: left;">
                <th style="padding: 10px;">Header</th>
                <th style="padding: 10px;">${t.statusLabel}</th>
                <th style="padding: 10px;">${t.recommendationLabel}</th>
              </tr>
            </thead>
            <tbody>
              ${scanData.headers.map((h: any) => `
                <tr style="border-bottom: 1px solid #222;">
                  <td style="padding: 12px; font-weight: bold;">${h.name}</td>
                  <td style="padding: 12px; color: ${h.present ? '#4ade80' : '#f87171'}">${h.present ? t.presentLabel : t.missingLabel}</td>
                  <td style="padding: 12px; font-size: 13px; color: #aaa;">
                    ${h.present ? `<code style="background: #222; padding: 2px 4px; border-radius: 4px; font-size: 11px;">${h.value}</code>` : h.recommendation}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (scanType === "ssl") {
        reportDetailsHtml = `
          <h3 style="color: #00f2ff; font-family: sans-serif;">${t.sslTitle}</h3>
          <p style="color: #ccc; font-family: sans-serif;">Target: <strong>${urlOrDomain}</strong></p>
          <div style="background: #111; padding: 20px; border-radius: 8px; border: 1px solid #222; margin: 20px 0; font-family: sans-serif;">
            <p style="font-size: 18px; font-weight: bold; color: ${scanData.valid ? '#4ade80' : '#f87171'}; margin: 0;">
              ${t.statusLabel}: ${scanData.valid ? t.presentLabel : t.missingLabel}
            </p>
          </div>
          <ul style="color: #ccc; line-height: 1.8; font-family: sans-serif;">
            <li><strong>${t.issuerLabel}:</strong> ${scanData.issuer?.O || scanData.issuer?.CN || 'N/A'}</li>
            <li><strong>${t.expiresLabel}:</strong> ${new Date(scanData.validTo).toLocaleDateString()} (${scanData.daysRemaining} ${t.daysRemainingLabel})</li>
            <li><strong>${t.protocolLabel}:</strong> ${scanData.protocol}</li>
            <li><strong>${t.cipherLabel}:</strong> ${scanData.cipher}</li>
          </ul>
        `;
      } else if (scanType === "password") {
        reportDetailsHtml = `
          <h3 style="color: #00f2ff; font-family: sans-serif;">${t.passwordTitle}</h3>
          <div style="background: #111; padding: 20px; border-radius: 8px; border: 1px solid #222; margin: 20px 0; font-family: sans-serif;">
            <p style="font-size: 18px; font-weight: bold; color: ${scanData.breached ? '#f87171' : '#4ade80'}; margin: 0;">
              ${scanData.breached ? `${t.passBreached} (${scanData.count})` : t.passOk}
            </p>
          </div>
          <p style="color: #aaa; font-size: 13px; font-family: sans-serif;">
            ${t.passNote}
          </p>
        `;
      } else if (scanType === "dns") {
        reportDetailsHtml = `
          <h3 style="color: #00f2ff; font-family: sans-serif;">${t.dnsTitle}</h3>
          <p style="color: #ccc; font-family: sans-serif;">Target: <strong>${urlOrDomain}</strong></p>
          <ul style="color: #ccc; line-height: 2; font-family: sans-serif; list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 10px;">
              <strong style="font-size: 15px;">${t.spfLabel}:</strong> ${scanData.spf.present ? `<span style="color: #4ade80;">${t.configuredLabel}</span>` : `<span style="color: #f87171;">${t.missingDnsLabel}</span>`}<br>
              <span style="font-size: 12px; color: #888;">${scanData.spf.description}</span>
              ${scanData.spf.present ? `<br><code style="background: #222; padding: 4px; display: block; margin-top: 5px; font-size: 11px; border-radius: 4px;">${scanData.spf.record}</code>` : ''}
            </li>
            <li style="margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 10px;">
              <strong style="font-size: 15px;">${t.dmarcLabel}:</strong> ${scanData.dmarc.present ? `<span style="color: #4ade80;">${t.configuredLabel}</span>` : `<span style="color: #f87171;">${t.missingDnsLabel}</span>`}<br>
              <span style="font-size: 12px; color: #888;">${scanData.dmarc.description}</span>
              ${scanData.dmarc.present ? `<br><code style="background: #222; padding: 4px; display: block; margin-top: 5px; font-size: 11px; border-radius: 4px;">${scanData.dmarc.record}</code>` : ''}
            </li>
            <li style="margin-bottom: 15px;">
              <strong style="font-size: 15px;">${t.mxLabel}:</strong> ${scanData.mx.present ? `<span style="color: #4ade80;">${t.configuredLabel}</span>` : `<span style="color: #f87171;">${t.missingDnsLabel}</span>`}<br>
              <span style="font-size: 12px; color: #888;">${scanData.mx.description}</span>
            </li>
          </ul>
        `;
      }

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; border: 1px solid #1a1a1a; padding: 30px; border-radius: 15px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: #00f2ff; color: #000000; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 10px; letter-spacing: 1px;">KYBERIT SECURITY LABS</div>
          </div>
          <h2 style="color: #ffffff; text-align: center;">${t.title}</h2>
          <p style="color: #999; text-align: center; line-height: 1.6;">${t.subtitle}</p>
          
          <div style="margin-top: 30px; border-top: 1px solid #1a1a1a; padding-top: 20px;">
            ${reportDetailsHtml}
          </div>

          <div style="border-top: 1px solid #1a1a1a; padding-top: 20px; text-align: center; font-size: 10px; color: #888; margin-top: 30px;">
            Kyberit IT Solutions - Digital Infrastructure<br>
            ${t.footerCompany}: ${company || 'N/A'}<br>
            ${t.footerConsent}: YES (GDPR compliant)<br>
            Timestamp: ${new Date().toISOString()}
          </div>
        </div>
      `;

      // Send to user
      await transporter.sendMail({
        from: senderEmail,
        to: email,
        subject: t.subject,
        html: emailHtml
      });

      // Send copy to admin
      if (isValidEmail(adminRecipient)) {
        await transporter.sendMail({
          from: senderEmail,
          to: adminRecipient,
          subject: `[TOOL REPORT REQUEST] ${scanType.toUpperCase()} - ${urlOrDomain} - ${email}`,
          html: `
            <h3>Nuova richiesta report da strumenti gratuiti</h3>
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email di lavoro:</strong> ${email}</p>
            <p><strong>Azienda:</strong> ${company || 'N/A'}</p>
            <p><strong>Strumento:</strong> ${scanType}</p>
            <p><strong>Target:</strong> ${urlOrDomain}</p>
            <p><strong>Lingua:</strong> ${userLang}</p>
          `
        });
      }

      return res.json({ success: true, message: "Report inviato con successo via email!" });
    } catch (error: any) {
      console.error("Report email error:", error);
      return res.status(500).json({ error: "Errore durante l'invio del report via email. Riprova più tardi." });
    }
  });



  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { 
      dotfiles: 'allow',
      setHeaders: (res, filePath) => {
        // Explicitly set HSTS on all static files
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        
        if (filePath.endsWith('.html') || filePath.endsWith('.xml') || filePath.endsWith('.txt')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          // JS, CSS, images can be cached
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
