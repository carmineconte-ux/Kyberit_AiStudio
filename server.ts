import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";

dotenv.config();

import fs from "fs";

const CONFIG_PATH = path.join(process.cwd(), "config.json");

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
  iubenda: {
    siteId: string;
    policyId: string;
  };
  turnstile: {
    siteKey: string;
    secretKey: string;
  };
  diagnostics: DiagnosticReport[];
}

const getConfig = (): SiteConfig => {
  const defaults: SiteConfig = {
    smtp: { host: "", port: 587, user: "", pass: "", from: "", contactEmail: "" },
    sanity: { projectId: "", dataset: "production", organizationId: "" },
    iubenda: { siteId: "", policyId: "" },
    turnstile: { siteKey: "", secretKey: "" },
    diagnostics: []
  };

  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      return {
        smtp: { ...defaults.smtp, ...saved.smtp },
        sanity: { ...defaults.sanity, ...saved.sanity },
        iubenda: { ...defaults.iubenda, ...saved.iubenda },
        turnstile: { ...defaults.turnstile, ...saved.turnstile },
        diagnostics: saved.diagnostics || defaults.diagnostics
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

const SETUP_PASSWORD = process.env.SETUP_PASSWORD || "kyberit2026";
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

  // Security Headers Middleware
  app.use((req, res, next) => {
    // Content Security Policy (CSP)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://challenges.cloudflare.com https://*.cloudflare.com https://*.cloudflareinsights.com https://cdn.iubenda.com https://*.iubenda.com https://www.iubenda.com https://embeds.iubenda.com https://*.google.com https://*.googleapis.com https://*.gstatic.com https://cdn.jsdelivr.net",
      "script-src-elem 'self' 'unsafe-inline' https://challenges.cloudflare.com https://*.cloudflare.com https://cdn.iubenda.com https://*.iubenda.com https://www.iubenda.com https://*.google.com https://*.gstatic.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://challenges.cloudflare.com https://*.cloudflare.com https://cdn.iubenda.com https://*.iubenda.com https://*.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://picsum.photos https://*.picsum.photos https://cdn.sanity.io https://challenges.cloudflare.com https://*.cloudflare.com https://www.iubenda.com https://*.iubenda.com https://*.google.com https://*.gstatic.com",
      "connect-src 'self' https://generativelanguage.googleapis.com https://*.sanity.io https://cdn.iubenda.com https://*.iubenda.com https://challenges.cloudflare.com https://*.cloudflare.com https://*.cloudflareinsights.com https://*.google.com https://*.googleapis.com",
      "frame-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com https://www.iubenda.com https://*.iubenda.com https://cdn.iubenda.com https://*.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join("; ");

    res.setHeader("Content-Security-Policy", csp);
    
    // Permissions Policy
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=(), xr-spatial-tracking=()");
    
    // Cross-Origin-Opener-Policy (COOP)
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    
    // Other security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    
    next();
  });

  // Middleware to check setup password
  const checkAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === SETUP_PASSWORD) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // API Route to get public config (Sanity, Iubenda, Turnstile keys)
  app.get("/api/config/public", (req, res) => {
    const config = getConfig();
    res.json({
      sanity: config.sanity,
      iubenda: { 
        siteId: config.iubenda.siteId,
        policyId: config.iubenda.policyId 
      },
      turnstile: { siteKey: config.turnstile.siteKey }
    });
  });

  // API Route to get full current config (Requires Auth)
  app.get("/api/config", checkAuth, (req, res) => {
    res.json(getConfig());
  });

  // API Route to save config
  app.post("/api/config", checkAuth, (req, res) => {
    saveConfig(req.body);
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
  app.post("/api/config/test-smtp", checkAuth, async (req, res) => {
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
  app.post("/api/contact", async (req, res) => {
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
          <p style="font-size: 10px; color: #333; text-align: center; margin-top: 30px;">
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
  app.post("/api/diagnostic/save", async (req, res) => {
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


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
