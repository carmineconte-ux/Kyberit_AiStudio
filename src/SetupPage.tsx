import { useState, FormEvent, useEffect } from "react";
import { Link } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, Mail, Shield, ShieldCheck, Target, ArrowRight } from "lucide-react";

const GOOGLE_CLIENT_ID = "588707402683-1v3gn52fnsnlisgo8e50eo1bpmqp521n.apps.googleusercontent.com";

const SetupPageContent = () => {
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState({
    smtp: { host: "", port: 587, user: "", pass: "", from: "", contactEmail: "" },
    sanity: { projectId: "", dataset: "production", organizationId: "" },
    turnstile: { siteKey: "", secretKey: "" },
    diagnostics: [] as any[]
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [message, setMessage] = useState("");

  const loadConfig = async (authToken: string) => {
    const res = await fetch("/api/config", { headers: { "Authorization": authToken } });
    if (res.ok) {
      const data = await res.json();
      setConfig(prev => ({
        smtp: { ...prev.smtp, ...data.smtp },
        sanity: { ...prev.sanity, ...data.sanity },
        turnstile: { ...prev.turnstile, ...data.turnstile },
        diagnostics: data.diagnostics || []
      }));
      setIsAuthenticated(true);
    } else {
      setMessage("Sessione non valida.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const authToken = `Bearer ${data.token}`;
        setToken(authToken);
        await loadConfig(authToken);
      } else {
        setMessage(data.error || "Accesso non autorizzato.");
      }
    } catch (e) {
      setMessage("Errore di connessione al server.");
    }
    setLoading(false);
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setMessage("");
    try {
      const optsRes = await fetch("/api/webauthn/generate-authentication-options");
      if (!optsRes.ok) throw new Error("Nessuna passkey configurata o server offline.");
      const opts = await optsRes.json();
      const asseResp = await startAuthentication({ optionsJSON: opts });
      
      const verificationRes = await fetch("/api/webauthn/verify-authentication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asseResp)
      });
      const verificationData = await verificationRes.json();
      if (verificationRes.ok && verificationData.token) {
        const authToken = `Bearer ${verificationData.token}`;
        setToken(authToken);
        await loadConfig(authToken);
      } else {
        setMessage(verificationData.error || "Verifica biometrica fallita.");
      }
    } catch (err: any) {
      setMessage(err.message || "Errore durante il login Passkey.");
    }
    setLoading(false);
  };

  const handleRegisterPasskey = async () => {
    setMessage("");
    try {
      const optsRes = await fetch("/api/webauthn/generate-registration-options", {
        headers: { "Authorization": token }
      });
      if (!optsRes.ok) throw new Error("Errore comunicazione server");
      const opts = await optsRes.json();
      const attResp = await startRegistration({ optionsJSON: opts });
      
      const verificationRes = await fetch("/api/webauthn/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify(attResp)
      });
      if (verificationRes.ok) setMessage("✅ Dispositivo registrato con successo! Ora puoi usare la tua impronta/FaceID al prossimo accesso.");
      else setMessage("❌ Registrazione fallita.");
    } catch (e: any) {
      setMessage("❌ Errore Passkey: " + e.message);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setMessage("");
    try {
      const res = await fetch("/api/config/test-smtp", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify(config.smtp)
      });
      const data = await res.json();
      if (res.ok) setMessage("✅ " + data.message);
      else setMessage("❌ " + (data.error || "Errore test SMTP"));
    } catch (e) {
      setMessage("❌ Errore di connessione al server.");
    }
    setTestingSmtp(false);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify(config)
      });
      if (res.ok) setMessage("✅ Configurazione salvata con successo!");
      else setMessage("❌ Errore durante il salvataggio.");
    } catch (e) {
      setMessage("❌ Errore di rete.");
    }
    setSaving(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="glass-panel p-10 rounded-3xl max-w-md w-full border border-white/10">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-6 h-6 bg-kyber-cyan flex items-center justify-center rounded-sm rotate-45">
              <span className="text-black font-bold text-[10px] -rotate-45">K</span>
            </div>
            <span className="text-lg font-bold tracking-tighter text-white">KYBER<span className="text-kyber-cyan">IT</span> SETUP</span>
          </div>
          <h1 className="text-2xl font-bold mb-6 tracking-tighter text-white text-center">Accesso Riservato</h1>
          
          <div className="space-y-6">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setMessage("Login Google fallito.")}
                useOneTap
                theme="filled_black"
                text="continue_with"
                shape="rectangular"
              />
            </div>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] text-gray-500 uppercase tracking-widest">oppure</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button 
              onClick={handlePasskeyLogin}
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Fingerprint size={20} className="text-kyber-cyan" />
              {loading ? "Verifica in corso..." : "Accedi con Passkey"}
            </button>
            
            {message && <p className="text-red-400 text-xs text-center font-mono bg-red-500/10 p-2 rounded">{message}</p>}
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="text-[10px] text-gray-500 uppercase tracking-widest hover:text-kyber-cyan transition-colors">
              Torna alla Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-kyber-cyan flex items-center justify-center rounded-sm rotate-45">
              <span className="text-black font-bold text-xs -rotate-45">K</span>
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white">KYBER<span className="text-kyber-cyan">IT</span> SETUP</span>
          </div>
          <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm font-bold flex items-center gap-2">
            <ArrowRight size={16} />
            Torna al Sito
          </Link>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/10">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                  <Mail className="text-kyber-cyan" />
                  Impostazioni SMTP (Posta)
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Host SMTP</label>
                    <input type="text" value={config.smtp.host} onChange={e => setConfig({...config, smtp: {...config.smtp, host: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-kyber-cyan outline-none transition-colors" placeholder="es. smtp.resend.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Porta</label>
                      <input type="number" value={config.smtp.port} onChange={e => setConfig({...config, smtp: {...config.smtp, port: parseInt(e.target.value)}})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-kyber-cyan outline-none transition-colors" placeholder="es. 465" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Username</label>
                      <input type="text" value={config.smtp.user} onChange={e => setConfig({...config, smtp: {...config.smtp, user: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-kyber-cyan outline-none transition-colors" placeholder="es. resend" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Password SMTP</label>
                    <input type="password" value={config.smtp.pass} onChange={e => setConfig({...config, smtp: {...config.smtp, pass: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-kyber-cyan outline-none transition-colors" placeholder="API Key o Password" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Email Mittente (Da)</label>
                    <input type="email" value={config.smtp.from} onChange={e => setConfig({...config, smtp: {...config.smtp, from: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-kyber-cyan outline-none transition-colors" placeholder="es. no-reply@tuodominio.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Email Destinatario (A chi arrivano)</label>
                    <input type="email" value={config.smtp.contactEmail} onChange={e => setConfig({...config, smtp: {...config.smtp, contactEmail: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-kyber-cyan outline-none transition-colors" placeholder="es. info@tuodominio.com" />
                  </div>
                  <button type="button" onClick={handleTestSmtp} disabled={testingSmtp} className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded font-bold text-xs hover:bg-white/10 transition-colors disabled:opacity-50 mt-2">
                    {testingSmtp ? "Test in corso..." : "Invia Test Email"}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                  <Target className="text-kyber-cyan" />
                  Sanity CMS
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Project ID</label>
                    <input type="text" value={config.sanity.projectId} onChange={e => setConfig({...config, sanity: {...config.sanity, projectId: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-kyber-cyan outline-none transition-colors" placeholder="es. z5l0qfg5" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Dataset</label>
                    <input type="text" value={config.sanity.dataset} onChange={e => setConfig({...config, sanity: {...config.sanity, dataset: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-kyber-cyan outline-none transition-colors" placeholder="es. production" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6 mt-8">
                  <Shield className="text-kyber-cyan" />
                  Cloudflare Turnstile</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Site Key (Pubblica)</label>
                    <input type="text" value={config.turnstile.siteKey} onChange={e => setConfig({...config, turnstile: {...config.turnstile, siteKey: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-kyber-cyan outline-none transition-colors" placeholder="es. 0x4AAAAAAC58470FM4SzJ7Yf" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Secret Key (Privata - Lato Server)</label>
                    <input type="password" value={config.turnstile.secretKey} onChange={e => setConfig({...config, turnstile: {...config.turnstile, secretKey: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-kyber-cyan outline-none transition-colors" placeholder="es. 0x4AAAAAAC5844uQslJAGCGMM_5iq1_CL6c" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 mt-8">
              <h3 className="text-white font-bold mb-4">🔑 Sicurezza Avanzata (Passkey)</h3>
              <p className="text-sm text-gray-400 mb-4">
                Usa l'impronta digitale o il riconoscimento facciale del tuo dispositivo per gli accessi futuri.
              </p>
              <button type="button" onClick={handleRegisterPasskey} className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center w-full gap-2 hover:bg-white/10 transition-colors text-sm">
                <Fingerprint size={16} className="text-kyber-cyan" />
                Registra questo dispositivo come Passkey
              </button>
            </div>

            <div className="flex items-center justify-between mt-8">
              <button type="submit" disabled={saving} className="bg-kyber-cyan text-black px-10 py-4 rounded-full font-bold uppercase tracking-tighter hover:shadow-lg hover:shadow-kyber-cyan/20 transition-all disabled:opacity-50">
                {saving ? "Salvataggio..." : "Salva Configurazione"}
              </button>
              {message && <span className="text-kyber-cyan font-mono text-xs animate-pulse">{message}</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function SetupPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <SetupPageContent />
    </GoogleOAuthProvider>
  );
}
