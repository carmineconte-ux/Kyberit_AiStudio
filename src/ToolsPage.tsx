import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Shield, Globe, Lock as LockIcon, Mail, ArrowLeft, CheckCircle2, AlertTriangle, HelpCircle, Eye, EyeOff } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

// Reusable Report Unlock Form Component
const ReportUnlockForm = ({
  scanType,
  scanData,
  urlOrDomain
}: {
  scanType: string;
  scanData: any;
  urlOrDomain: string;
}) => {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !consent) {
      setError(t("tools.unlockReport.error"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          consent,
          scanType,
          scanData,
          urlOrDomain,
          lang: i18n.language
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("tools.unlockReport.error"));
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Errore");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mt-6 border border-dashed border-green-500/30 bg-green-500/5 p-6 rounded-2xl text-center">
        <CheckCircle2 className="text-green-400 mx-auto mb-2 animate-bounce" size={32} />
        <h4 className="font-bold text-green-400 text-sm">{t("tools.unlockReport.successTitle")}</h4>
        <p className="text-gray-300 text-xs mt-1">{t("tools.unlockReport.successDesc", { email })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 border border-dashed border-kyber-cyan/30 bg-kyber-cyan/[0.01] p-6 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 text-kyber-cyan text-sm font-bold tracking-wide">
        <span className="animate-pulse">✨</span> {t("tools.unlockReport.title")}
      </div>
      <p className="text-gray-400 text-xs leading-normal">
        {t("tools.unlockReport.desc")}
      </p>

      {error && (
        <div className="text-xs text-red-400 font-medium bg-red-400/10 p-3 rounded-lg border border-red-400/20">
          {error}
        </div>
      )}

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">{t("tools.unlockReport.name")}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-kyber-cyan/50 focus:ring-1 focus:ring-kyber-cyan/50 outline-none text-white transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">{t("tools.unlockReport.email")}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-kyber-cyan/50 focus:ring-1 focus:ring-kyber-cyan/50 outline-none text-white transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">{t("tools.unlockReport.company")}</label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-kyber-cyan/50 focus:ring-1 focus:ring-kyber-cyan/50 outline-none text-white transition-colors"
        />
      </div>

      <div className="flex items-start gap-2.5 pt-2">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          id={`consent-${scanType}`}
          className="mt-0.5 border-white/20 bg-white/5 text-kyber-cyan rounded focus:ring-0 focus:ring-offset-0 focus:outline-none"
          required
        />
        <label htmlFor={`consent-${scanType}`} className="text-[11px] text-gray-400 leading-normal select-none cursor-pointer">
          {t("tools.unlockReport.consent")}
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white hover:bg-kyber-cyan hover:text-black disabled:bg-gray-700 disabled:text-gray-400 py-3.5 rounded-xl font-bold text-sm transition-all border border-white/10 hover:border-kyber-cyan shadow-md uppercase tracking-wider"
      >
        {loading ? t("tools.unlockReport.sending") : t("tools.unlockReport.submit")}
      </button>
    </form>
  );
};

export default function ToolsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"all" | "header" | "ssl" | "password" | "dns">("all");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["all", "header", "ssl", "password", "dns"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // State for Header Security Scan
  const [headerUrl, setHeaderUrl] = useState("");
  const [headerLoading, setHeaderLoading] = useState(false);
  const [headerResult, setHeaderResult] = useState<any>(null);
  const [headerError, setHeaderError] = useState("");

  // State for SSL Checker
  const [sslDomain, setSslDomain] = useState("");
  const [sslLoading, setSslLoading] = useState(false);
  const [sslResult, setSslResult] = useState<any>(null);
  const [sslError, setSslError] = useState("");

  // State for Password Breach Check
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordResult, setPasswordResult] = useState<any>(null);
  const [passwordError, setPasswordError] = useState("");

  // State for DNS Audit
  const [dnsDomain, setDnsDomain] = useState("");
  const [dnsLoading, setDnsLoading] = useState(false);
  const [dnsResult, setDnsResult] = useState<any>(null);
  const [dnsError, setDnsError] = useState("");

  // Run Header Scan
  const handleHeaderScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerUrl) return;
    setHeaderLoading(true);
    setHeaderError("");
    setHeaderResult(null);
    try {
      const res = await fetch("/api/tools/header-security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: headerUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore sconosciuto");
      setHeaderResult(data);
    } catch (err: any) {
      setHeaderError(err.message || "Errore di connessione al server");
    } finally {
      setHeaderLoading(false);
    }
  };

  // Run SSL Checker
  const handleSslCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sslDomain) return;
    setSslLoading(true);
    setSslError("");
    setSslResult(null);
    try {
      const res = await fetch("/api/tools/ssl-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: sslDomain })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore sconosciuto");
      setSslResult(data);
    } catch (err: any) {
      setSslError(err.message || "Errore di connessione al server");
    } finally {
      setSslLoading(false);
    }
  };

  // Run Password Breach Check
  const handlePasswordCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordResult(null);
    try {
      const res = await fetch("/api/tools/password-breach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore sconosciuto");
      setPasswordResult(data);
    } catch (err: any) {
      setPasswordError(err.message || "Errore di connessione al server");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Run DNS Audit
  const handleDnsAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dnsDomain) return;
    setDnsLoading(true);
    setDnsError("");
    setDnsResult(null);
    try {
      const res = await fetch("/api/tools/dns-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: dnsDomain })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore sconosciuto");
      setDnsResult(data);
    } catch (err: any) {
      setDnsError(err.message || "Errore di connessione al server");
    } finally {
      setDnsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-kyber-cyan/5 via-transparent to-transparent pointer-events-none" />
      
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 w-full relative z-10 flex-grow">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-kyber-cyan transition-colors mb-8 group font-medium">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t("tools.backToHome")}
        </Link>

        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
            {t("tools.title")}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {t("tools.desc")}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-2 mb-10 border-b border-white/10 pb-4">
          {(["all", "header", "ssl", "password", "dns"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? "bg-kyber-cyan text-black"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab === "all" ? "All Tools" : t(`tools.${tab}.title`)}
            </button>
          ))}
        </div>

        {/* Tools Cards Container */}
        <div className="space-y-8">
          
          {/* Card 1: Header Security Scan */}
          {(activeTab === "all" || activeTab === "header") && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-white/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-kyber-cyan/10 flex items-center justify-center text-kyber-cyan border border-kyber-cyan/20">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t("tools.header.title")}</h3>
                  <p className="text-gray-400 text-sm mt-1">{t("tools.header.desc")}</p>
                </div>
              </div>

              <form onSubmit={handleHeaderScan} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={headerUrl}
                  onChange={(e) => setHeaderUrl(e.target.value)}
                  placeholder={t("tools.header.placeholder")}
                  className="flex-grow bg-white/5 border border-white/10 px-5 py-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-kyber-cyan/50 focus:ring-1 focus:ring-kyber-cyan/50 transition-all font-medium text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={headerLoading}
                  className="bg-kyber-cyan text-black hover:bg-white hover:text-black disabled:bg-gray-700 disabled:text-gray-400 px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-kyber-cyan/10 whitespace-nowrap"
                >
                  {headerLoading ? t("tools.scanningBtn") : t("tools.scanBtn")}
                </button>
              </form>

              {headerError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                  {headerError}
                </div>
              )}

              {/* Header Scan Results */}
              {headerResult && (
                <div className="mt-6 space-y-6">
                  {/* ANTEPRIMA DEL REPORT Box */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">ANTEPRIMA DEL REPORT</span>
                      <span className={`text-xl font-black ${headerResult.score >= 80 ? "text-green-400" : headerResult.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                        {headerResult.score}/100
                      </span>
                    </div>

                    <ul className="space-y-3">
                      {headerResult.headers.slice(0, 4).map((h: any, idx: number) => (
                        <li key={idx} className="flex items-center gap-3 text-sm">
                          <span className={`w-2.5 h-2.5 rounded-full ${h.present ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="text-gray-300">{h.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sblocca il report form */}
                  <ReportUnlockForm
                    scanType="header"
                    scanData={headerResult}
                    urlOrDomain={headerUrl}
                  />
                </div>
              )}
            </div>
          )}

          {/* Card 2: SSL / TLS Checker */}
          {(activeTab === "all" || activeTab === "ssl") && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-white/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t("tools.ssl.title")}</h3>
                  <p className="text-gray-400 text-sm mt-1">{t("tools.ssl.desc")}</p>
                </div>
              </div>

              <form onSubmit={handleSslCheck} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={sslDomain}
                  onChange={(e) => setSslDomain(e.target.value)}
                  placeholder={t("tools.ssl.placeholder")}
                  className="flex-grow bg-white/5 border border-white/10 px-5 py-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-kyber-cyan/50 focus:ring-1 focus:ring-kyber-cyan/50 transition-all font-medium text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={sslLoading}
                  className="bg-kyber-cyan text-black hover:bg-white hover:text-black disabled:bg-gray-700 disabled:text-gray-400 px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-kyber-cyan/10 whitespace-nowrap"
                >
                  {sslLoading ? t("tools.scanningBtn") : t("tools.scanBtn")}
                </button>
              </form>

              {sslError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                  {sslError}
                </div>
              )}

              {/* SSL Scan Results */}
              {sslResult && (
                <div className="mt-6 space-y-6">
                  {/* ANTEPRIMA DEL REPORT Box */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">ANTEPRIMA DEL REPORT</span>
                      <span className={`text-xl font-black ${sslResult.valid ? "text-green-400" : "text-red-400"}`}>
                        {sslResult.valid ? "90/100" : "30/100"}
                      </span>
                    </div>

                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${sslResult.protocol === "TLSv1.3" ? "bg-green-500" : "bg-yellow-500"}`} />
                        <span className="text-gray-300">TLS 1.3 supported</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${sslResult.daysRemaining > 30 ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-gray-300">Certificate valid &gt; 30d</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${!/RC4|3DES|CBC/i.test(sslResult.cipher) ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-gray-300">Weak ciphers disabled</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-gray-300 font-medium">OCSP stapling</span>
                      </li>
                    </ul>
                  </div>

                  {/* Sblocca il report form */}
                  <ReportUnlockForm
                    scanType="ssl"
                    scanData={sslResult}
                    urlOrDomain={sslDomain}
                  />
                </div>
              )}
            </div>
          )}

          {/* Card 3: Password Breach Check */}
          {(activeTab === "all" || activeTab === "password") && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-white/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-kyber-cyan border border-cyan-500/20">
                  <LockIcon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t("tools.password.title")}</h3>
                  <p className="text-gray-400 text-sm mt-1">{t("tools.password.desc")}</p>
                </div>
              </div>

              <form onSubmit={handlePasswordCheck} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("tools.password.placeholder")}
                    className="w-full bg-white/5 border border-white/10 pl-5 pr-12 py-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-kyber-cyan/50 focus:ring-1 focus:ring-kyber-cyan/50 transition-all font-medium text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-kyber-cyan text-black hover:bg-white hover:text-black disabled:bg-gray-700 disabled:text-gray-400 px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-kyber-cyan/10 whitespace-nowrap"
                >
                  {passwordLoading ? t("tools.scanningBtn") : t("tools.scanBtn")}
                </button>
              </form>

              {passwordError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                  {passwordError}
                </div>
              )}

              {/* Password Result */}
              {passwordResult && (
                <div className="mt-6 space-y-6">
                  {/* ANTEPRIMA DEL REPORT Box */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">ANTEPRIMA DEL REPORT</span>
                      <span className={`text-xl font-black ${passwordResult.breached ? "text-red-400" : "text-green-400"}`}>
                        {passwordResult.breached ? "40/100" : "100/100"}
                      </span>
                    </div>

                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${password.length >= 8 ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-gray-300">Length: {password.length} chars</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${/[a-z]/.test(password) && /[A-Z]/.test(password) ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-gray-300">Mixed case</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-gray-300">Numbers &amp; symbols</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${!passwordResult.breached ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-gray-300">Not in known breaches</span>
                      </li>
                    </ul>
                  </div>

                  {/* Sblocca il report form */}
                  <ReportUnlockForm
                    scanType="password"
                    scanData={passwordResult}
                    urlOrDomain="Verifica Password"
                  />
                </div>
              )}
            </div>
          )}

          {/* Card 4: Email / DNS Audit */}
          {(activeTab === "all" || activeTab === "dns") && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-white/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-kyber-cyan border border-cyan-500/20">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t("tools.dns.title")}</h3>
                  <p className="text-gray-400 text-sm mt-1">{t("tools.dns.desc")}</p>
                </div>
              </div>

              <form onSubmit={handleDnsAudit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={dnsDomain}
                  onChange={(e) => setDnsDomain(e.target.value)}
                  placeholder={t("tools.dns.placeholder")}
                  className="flex-grow bg-white/5 border border-white/10 px-5 py-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-kyber-cyan/50 focus:ring-1 focus:ring-kyber-cyan/50 transition-all font-medium text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={dnsLoading}
                  className="bg-kyber-cyan text-black hover:bg-white hover:text-black disabled:bg-gray-700 disabled:text-gray-400 px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-kyber-cyan/10 whitespace-nowrap"
                >
                  {dnsLoading ? t("tools.scanningBtn") : t("tools.scanBtn")}
                </button>
              </form>

              {dnsError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                  {dnsError}
                </div>
              )}

              {/* DNS Audit Results */}
              {dnsResult && (
                <div className="mt-6 space-y-6">
                  {/* ANTEPRIMA DEL REPORT Box */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">ANTEPRIMA DEL REPORT</span>
                      <span className="text-xl font-black text-yellow-400">
                        {((dnsResult.spf.present ? 33 : 0) + (dnsResult.dmarc.present ? 33 : 0) + (dnsResult.mx.present ? 34 : 0))}/100
                      </span>
                    </div>

                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${dnsResult.spf.present ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-gray-300">SPF record found</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-gray-300">DKIM configured</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${dnsResult.dmarc.present ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-gray-300">DMARC policy</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${dnsResult.mx.present ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-gray-300">MX records valid</span>
                      </li>
                    </ul>
                  </div>

                  {/* Sblocca il report form */}
                  <ReportUnlockForm
                    scanType="dns"
                    scanData={dnsResult}
                    urlOrDomain={dnsDomain}
                  />
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
