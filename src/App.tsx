import { motion, AnimatePresence } from "motion/react";
import { Terminal, Shield, Globe, Network, Cpu, Activity, ArrowRight, CheckCircle2, Star, Quote, Send, Mail, Phone, MapPin, Search, Rocket, PenTool, ShieldCheck, ChevronDown, Target, Crown, Zap, Fingerprint } from "lucide-react";
import { useState, useEffect, useRef, FormEvent, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { GoogleGenAI, Type } from "@google/genai";
import CookieBanner from "./CookieBanner";
import AccessibilityWidget from "./AccessibilityWidget";
import AnalyticsIntegration from "./AnalyticsIntegration";
import SetupPage from "./SetupPage";
import LegalPage from "./LegalPage";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
declare global {
  interface Window {
    turnstile: any;
  }
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: "PROXY" });
import { createSanityConfig } from "./sanity/config";
import { KYBERIT_DATA, SERVICE_IMAGES } from "./constants";

const Studio = lazy(() => import("sanity").then(m => ({ default: m.Studio })));
const headerImg = "/photo/header.webp";

interface DiagnosticReport {
  score: number;
  status: string;
  sections: {
    title: string;
    score: number;
    findings: string[];
  }[];
  recommendations: string[];
  summary: string;
}

// --- Components ---

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: "it", label: "IT", flag: "🇮🇹" },
    { code: "en", label: "EN", flag: "🇺🇸" },
    { code: "de", label: "DE", flag: "🇩🇪" },
    { code: "fr", label: "FR", flag: "🇫🇷" },
  ];

  return (
    <div className="flex items-center gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
            i18n.language === lang.code
              ? "bg-kyber-cyan text-black"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
          title={lang.label}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export const Navbar = () => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t("nav.about"), href: "#chi-siamo" },
    { name: t("nav.services"), href: "#servizi" },
    { name: t("nav.process"), href: "#processo" },
    { name: t("nav.pricing"), href: "#listino" },
    { name: t("nav.contact"), href: "#contatti" },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? "bg-black/90 backdrop-blur-xl border-b border-white/10 py-4 shadow-2xl" : "bg-transparent py-8"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center relative z-50">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-kyber-cyan flex items-center justify-center rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500 shadow-lg shadow-kyber-cyan/20">
              <span className="text-black font-black -rotate-45 group-hover:-rotate-90 transition-transform duration-500">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-white leading-none">KYBER<span className="text-kyber-cyan">IT</span></span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-kyber-cyan uppercase">Digital Infrastructure</span>
            </div>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
              {navLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href} 
                  className="hover:text-kyber-cyan transition-all duration-300 relative group py-2"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-kyber-cyan transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
            </div>

            <a 
              href="#contatti"
              className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-kyber-cyan hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
            >
              {t("nav.freeAnalysis")}
            </a>
          </div>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`h-0.5 w-full bg-white transition-all ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
              <span className={`h-0.5 w-full bg-white transition-all ${mobileMenuOpen ? "opacity-0" : ""}`}></span>
              <span className={`h-0.5 w-full bg-white transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-black/95 backdrop-blur-2xl z-40 transition-all duration-500 md:hidden overflow-y-auto ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="flex flex-col items-center justify-start min-h-full pt-32 pb-12 gap-8 text-xl sm:text-2xl font-bold uppercase tracking-widest">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href} 
              onClick={() => setMobileMenuOpen(false)}
              className="text-white hover:text-kyber-cyan transition-colors"
            >
              {link.name}
            </a>
          ))}
          <a 
            href="#contatti"
            onClick={() => setMobileMenuOpen(false)}
            className="bg-kyber-cyan text-black px-12 py-5 rounded-full text-sm font-black"
          >
            {t("nav.freeAnalysis")}
          </a>
        </div>
      </div>
    </>
  );
};

const Hero = () => {
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden bg-black">
      {/* Sfondo a griglia scura */}
      <div 
        className="absolute inset-0 opacity-[0.05]" 
        style={{ 
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      ></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm"
          >
            <div className="w-2 h-2 rounded-full bg-kyber-cyan animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-kyber-cyan">{t("hero.badge")}</span>
          </motion.div>
          <LanguageSwitcher />
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] mb-8 tracking-tighter text-white">
            {t("hero.title.architettura")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-kyber-cyan to-kyber-blue">
              {t("hero.title.digitale")}
            </span> <br />
            {t("hero.title.evoluta")}
          </h1>
          
          <p className="text-lg text-gray-400 max-w-lg mb-12 leading-relaxed font-medium">
            {t("hero.desc")}
          </p>
          
          <div className="flex flex-wrap gap-4 mb-16">
            <a 
              href="#contatti"
              className="bg-kyber-cyan text-black px-8 py-4 rounded-full font-bold text-sm flex items-center gap-3 hover:shadow-lg hover:shadow-kyber-cyan/20 transition-all group"
            >
              {t("hero.btnDiagnostics")} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#contatti"
              className="bg-white/5 text-white border border-white/10 px-8 py-4 rounded-full font-bold text-sm hover:bg-white/10 transition-all"
            >
              {t("hero.btnExpert")}
            </a>
          </div>

          <div className="grid grid-cols-3 gap-8 border-t border-white/10 pt-10">
            <div>
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 font-mono">{t("hero.stats.uptime")}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">200+</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 font-mono">{t("hero.stats.clients")}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 font-mono">{t("hero.stats.support")}</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          {/* Main 3D Image - Utilizzo del file WebP locale */}
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-kyber-cyan/10 border border-white/10">
            <img 
              src={headerImg} 
              alt="Digital Architecture 3D" 
              className="w-full aspect-[3/1] object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-kyber-cyan/20 to-transparent"></div>
          </div>
          
          {/* Widget 1: Network */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-8 -right-8 bg-black/60 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/10 flex items-center gap-4 z-20"
          >
            <div className="w-10 h-10 bg-kyber-cyan/20 rounded-xl flex items-center justify-center text-kyber-cyan">
              <Network size={20} />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t("hero.widgets.network")}</div>
              <div className="text-sm font-bold text-white">1.2Gbps ↑↓</div>
            </div>
          </motion.div>
          
          {/* Widget 2: Security */}
          <motion.div 
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -bottom-8 -left-8 bg-black/60 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/10 flex items-center gap-4 z-20"
          >
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t("hero.widgets.security")}</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <div className="text-sm font-bold text-white">{t("hero.widgets.protected")}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        </div>
      </div>
    </section>
  );
};

const About = ({ sanityConfig }: { sanityConfig?: any }) => {
  const { t, i18n } = useTranslation();
  const [sanityAbout, setSanityAbout] = useState<any>(null);

  useEffect(() => {
    if (!sanityConfig) return;
    const lang = i18n.language.split('-')[0];
    const client = getSanityClient(sanityConfig.projectId, sanityConfig.dataset);
    client.fetch(`*[_type == "about"][0]{
      "badge": coalesce(badge[$lang], badge.it),
      "title": coalesce(title[$lang], title.it),
      "pilotTitle": coalesce(pilotTitle[$lang], pilotTitle.it),
      "pilotDesc": coalesce(pilotDesc[$lang], pilotDesc.it),
      "founderTitle": coalesce(founderTitle[$lang], founderTitle.it),
      "founderDesc": coalesce(founderDesc[$lang], founderDesc.it)
    }`, { lang }).then(data => {
      setSanityAbout(data);
    }).catch(err => console.error("Sanity fetch error:", err));
  }, [sanityConfig, i18n.language]);

  const badge = sanityAbout?.badge || t("about.badge");
  const title = sanityAbout?.title || t("about.title");
  const pilotTitle = sanityAbout?.pilotTitle || t("about.pilotTitle");
  const pilotDesc = sanityAbout?.pilotDesc || t("about.pilotDesc");
  const founderTitle = sanityAbout?.founderTitle || t("about.founderTitle");
  const founderDesc = sanityAbout?.founderDesc || t("about.founderDesc");

  return (
    <section id="chi-siamo" className="py-24 border-b border-white/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-kyber-cyan/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="text-left mb-4">
            <span className="text-[10px] text-gray-500 font-mono tracking-[0.4em] uppercase block mb-2">
              {badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase">
              {title}
            </h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Panel: The Helmsman / Etymology */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="cyber-panel rounded-[2rem] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="scan-line" />
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-kyber-cyan/15 rounded-xl flex items-center justify-center text-kyber-cyan">
                  <Zap size={20} className="animate-pulse" />
                </div>
                <h3 className="text-xl md:text-2xl font-black italic tracking-tighter text-white">
                  {pilotTitle}
                </h3>
              </div>
              <p
                className="text-gray-400 text-sm md:text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: pilotDesc }}
              />
            </div>
            <div className="mt-8 border-t border-white/5 pt-6 flex items-center gap-4 text-xs text-gray-500 font-mono">
              <span className="text-kyber-cyan">01.01</span>
              <span>// ORIGIN STORY</span>
            </div>
          </motion.div>

          {/* Right Panel: The Founder */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="cyber-panel rounded-[2rem] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="scan-line" />
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-kyber-blue/15 rounded-xl flex items-center justify-center text-kyber-blue">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-xl md:text-2xl font-black italic tracking-tighter text-white">
                  {founderTitle}
                </h3>
              </div>
              <p 
                className="text-gray-400 text-sm md:text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: founderDesc }}
              />
            </div>
            <div className="mt-8 border-t border-white/5 pt-6 flex items-center gap-4 text-xs text-gray-500 font-mono">
              <span className="text-kyber-blue">01.02</span>
              <span>// LEADERSHIP & AUTHORITY</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const getPricingStyle = (styleKey: string) => {
  if (styleKey === 'blue') return {
    glow: "border-kyber-blue/30 bg-kyber-blue/[0.01] hover:border-kyber-blue/60 hover:shadow-[0_0_30px_rgba(0,102,255,0.1)]",
    borderColor: "border-kyber-blue/20",
    badgeColor: "bg-kyber-blue/15 text-kyber-cyan",
    buttonStyle: "bg-kyber-blue text-white hover:bg-kyber-blue/80 hover:shadow-[0_0_15px_rgba(0,102,255,0.3)] border-transparent"
  };
  if (styleKey === 'gold') return {
    glow: "hover:border-amber-400/40 hover:shadow-[0_0_30px_rgba(251,191,36,0.05)]",
    borderColor: "border-white/5",
    badgeColor: "bg-white/5 text-gray-400",
    buttonStyle: "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white"
  };
  return {
    glow: "hover:border-kyber-cyan/40 hover:shadow-[0_0_30px_rgba(0,242,255,0.05)]",
    borderColor: "border-white/5",
    badgeColor: "bg-white/5 text-gray-400",
    buttonStyle: "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white"
  };
};

const getPricingIcon = (iconName: string) => {
  if (iconName === 'Shield') return <Shield className="text-kyber-blue" size={24} />;
  if (iconName === 'Crown') return <Crown className="text-amber-400" size={24} />;
  return <Target className="text-kyber-cyan" size={24} />;
};

const Pricing = ({ sanityConfig }: { sanityConfig?: any }) => {
  const { t, i18n } = useTranslation();
  const [sanityTiers, setSanityTiers] = useState<any[]>([]);

  useEffect(() => {
    if (!sanityConfig) return;
    const lang = i18n.language.split('-')[0];
    const client = getSanityClient(sanityConfig.projectId, sanityConfig.dataset);
    client.fetch(`*[_type == "pricingTier"] | order(order asc) {
      "subtitle": coalesce(subtitle[$lang], subtitle.it),
      "title": coalesce(title[$lang], title.it),
      "price": coalesce(price[$lang], price.it),
      "period": coalesce(period[$lang], period.it),
      "features": coalesce(features[$lang], features.it),
      icon,
      styleKey
    }`, { lang }).then(data => {
      setSanityTiers(data);
    }).catch(err => console.error("Sanity fetch error:", err));
  }, [sanityConfig, i18n.language]);

  const fallbackTiers = [
    {
      subtitle: t("pricing.oneShot.subtitle"),
      title: t("pricing.oneShot.title"),
      price: t("pricing.oneShot.price"),
      period: t("pricing.oneShot.period"),
      features: t("pricing.oneShot.features", { returnObjects: true }) as string[],
      icon: "Target",
      styleKey: "default"
    },
    {
      subtitle: t("pricing.shield.subtitle"),
      title: t("pricing.shield.title"),
      price: t("pricing.shield.price"),
      period: t("pricing.shield.period"),
      features: t("pricing.shield.features", { returnObjects: true }) as string[],
      icon: "Shield",
      styleKey: "blue"
    },
    {
      subtitle: t("pricing.enterprise.subtitle"),
      title: t("pricing.enterprise.title"),
      price: t("pricing.enterprise.price"),
      period: t("pricing.enterprise.period"),
      features: t("pricing.enterprise.features", { returnObjects: true }) as string[],
      icon: "Crown",
      styleKey: "gold"
    }
  ];

  const tiers = sanityTiers.length > 0 ? sanityTiers : fallbackTiers;

  return (
    <section id="listino" className="py-24 border-b border-white/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-kyber-blue/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-left"
        >
          <span className="text-[10px] text-gray-500 font-mono tracking-[0.4em] uppercase block mb-2">
            {t("pricing.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase">
            {t("pricing.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, idx) => {
            const style = getPricingStyle(tier.styleKey || 'default');
            const icon = getPricingIcon(tier.icon || 'Target');
            const features = tier.features || [];

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className={`cyber-panel rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between border ${style.borderColor} ${style.glow} group`}
              >
                <div className="scan-line" />

                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1.5 rounded-full font-semibold ${style.badgeColor}`}>
                      {tier.subtitle}
                    </span>
                    <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      {icon}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black tracking-tight text-white mb-2 uppercase italic">
                    {tier.title}
                  </h3>

                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tighter neon-text">
                      {tier.price}
                    </span>
                    <span className="text-sm text-gray-500 font-mono font-medium">
                      {tier.period}
                    </span>
                  </div>

                  <ul className="space-y-4 mb-10 border-t border-white/5 pt-6">
                    {Array.isArray(features) && features.map((feature: string, i: number) => (
                      <li key={i} className="text-gray-400 text-sm flex items-start gap-3 leading-relaxed">
                        <span className="text-kyber-cyan mt-1 text-xs">▪</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a href="#contatti" className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-center transition-all duration-300 border ${style.buttonStyle} flex items-center justify-center gap-2 group-hover:bg-white/10`}>
                  {t("pricing.button")}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Services = ({ sanityConfig }: { sanityConfig?: any }) => {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sanityServices, setSanityServices] = useState<any[]>([]);

  useEffect(() => {
    if (!sanityConfig) {
      return;
    }
    
    const lang = i18n.language.split('-')[0];

    const client = getSanityClient(sanityConfig.projectId, sanityConfig.dataset);
    client.fetch(`*[_type == "service"] | order(order asc) {
      _id,
      "title": coalesce(title[$lang], title.it),
      "subTitle": coalesce(subtitle[$lang], subtitle.it),
      "desc": coalesce(description[$lang], description.it),
      "features": coalesce(features[$lang], features.it),
      "image": image.asset->url
    }`, { lang }).then((data: any[]) => {
      setSanityServices(data);
    }).catch((err: any) => {
      console.error("Sanity fetch error:", err);
    });
  }, [sanityConfig, i18n.language]);

  const fallbackServices = [
    {
      id: "WEB.DEV",
      title: t("services.items.web.title"),
      subTitle: t("services.items.web.sub"),
      desc: t("services.items.web.desc"),
      features: t("services.items.web.features", { returnObjects: true }) as string[],
      image: "/photo/Siti Web.webp"
    },
    {
      id: "NET.OPS",
      title: t("services.items.network.title"),
      subTitle: t("services.items.network.sub"),
      desc: t("services.items.network.desc"),
      features: t("services.items.network.features", { returnObjects: true }) as string[],
      image: "/photo/Networking.webp"
    },
    {
      id: "CONSULT",
      title: t("services.items.consult.title"),
      subTitle: t("services.items.consult.sub"),
      desc: t("services.items.consult.desc"),
      features: t("services.items.consult.features", { returnObjects: true }) as string[],
      image: "/photo/Consulenza Aziendale.webp"
    },
    {
      id: "SEC.OPS",
      title: t("services.items.security.title"),
      subTitle: t("services.items.security.sub"),
      desc: t("services.items.security.desc"),
      features: t("services.items.security.features", { returnObjects: true }) as string[],
      image: "/photo/CyberSecurity.webp"
    }
  ];

  const services = sanityServices.length > 0 ? sanityServices.map((s, index) => ({
    id: s._id,
    title: s.title,
    subTitle: s.subTitle,
    desc: s.desc,
    features: s.features || [],
    // If no image is uploaded to Sanity, fallback to the original image based on index
    image: s.image || fallbackServices[index]?.image || "/photo/Siti Web.webp"
  })) : fallbackServices;

  return (
    <section id="servizi" className="py-24 relative bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <div className="text-kyber-cyan font-mono text-sm mb-2">{t("services.badge")}</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{t("services.title")}</h2>
          <p className="text-gray-500 mt-4 max-w-2xl">
            {t("services.desc")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {services.map((s, i) => (
            <motion.div 
              key={s.id}
              className="glass-panel rounded-2xl group relative overflow-hidden flex flex-col border border-white/5 hover:border-kyber-cyan/30 transition-all duration-500"
              onMouseEnter={() => setExpandedId(s.id)}
              onMouseLeave={() => setExpandedId(null)}
              whileHover={{ y: -5 }}
            >
              {/* Image Header */}
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={s.image} 
                  alt={s.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 brightness-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-20"></div>
              </div>

              {/* Content */}
              <div 
                className="px-8 pt-8 pb-4 flex-grow select-none"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-3xl font-bold tracking-tight text-white">{s.title}</h3>
                  <motion.div 
                    animate={{ 
                      rotate: expandedId === s.id ? 0 : -90,
                      color: expandedId === s.id ? "#00fcfc" : "#6b7280",
                      filter: expandedId === s.id ? "drop-shadow(0 0 12px rgba(0, 252, 252, 0.6))" : "drop-shadow(0 0 0px rgba(0, 252, 252, 0))"
                    }}
                    className="transition-colors hover:text-kyber-cyan"
                  >
                    <ChevronDown size={24} />
                  </motion.div>
                </div>
                
                <div className="text-kyber-blue font-mono text-xs tracking-[0.2em] mb-4 uppercase">
                  {s.subTitle}
                </div>
                
                <p className="text-gray-400 mb-6 text-base leading-relaxed">
                  {s.desc}
                </p>
                
                <div className="w-full h-px bg-white/10"></div>

                <AnimatePresence>
                  {expandedId === s.id && (
                    <motion.ul 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="space-y-4 mt-6 overflow-hidden"
                    >
                      {s.features.map(f => (
                        <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                          <div className="w-1.5 h-1.5 bg-kyber-blue rounded-full mt-1.5 shrink-0"></div> 
                          <span>{f}</span>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Process = () => {
  const { t } = useTranslation();
  
  const steps = [
    { 
      num: "01", 
      title: t("process.steps.s1.title"), 
      desc: t("process.steps.s1.desc"), 
      items: t("process.steps.s1.items", { returnObjects: true }) as string[],
      icon: <Search size={16} />
    },
    { 
      num: "02", 
      title: t("process.steps.s2.title"), 
      desc: t("process.steps.s2.desc"), 
      items: t("process.steps.s2.items", { returnObjects: true }) as string[],
      icon: <PenTool size={16} />
    },
    { 
      num: "03", 
      title: t("process.steps.s3.title"), 
      desc: t("process.steps.s3.desc"), 
      items: t("process.steps.s3.items", { returnObjects: true }) as string[],
      icon: <Cpu size={16} />
    },
    { 
      num: "04", 
      title: t("process.steps.s4.title"), 
      desc: t("process.steps.s4.desc"), 
      items: t("process.steps.s4.items", { returnObjects: true }) as string[],
      icon: <Rocket size={16} />
    },
    { 
      num: "05", 
      title: t("process.steps.s5.title"), 
      desc: t("process.steps.s5.desc"), 
      items: t("process.steps.s5.items", { returnObjects: true }) as string[],
      icon: <ShieldCheck size={16} />
    }
  ];

  return (
    <section id="processo" className="py-24 bg-kyber-dark relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-24 text-center">
          <div className="text-kyber-cyan font-mono text-sm mb-2 uppercase tracking-widest">{t("process.badge")}</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{t("process.title")}</h2>
        </div>

        <div className="relative">
          {/* Central line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2"></div>
          
          <div className="space-y-24">
            {steps.map((s, i) => (
              <div key={s.num} className={`relative flex flex-col md:flex-row items-center ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Content block */}
                <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${i % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'}`}>
                  <motion.div 
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <div className={`flex items-center gap-2 mb-4 font-mono text-xs text-kyber-blue ${i % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                      <span>PHASE {s.num}</span>
                      <div className="p-1.5 bg-kyber-blue/10 rounded border border-kyber-blue/20">
                        {s.icon}
                      </div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">{s.title}</h3>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      {s.desc}
                    </p>
                    <div className={`flex flex-wrap gap-2 ${i % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                      {s.items.map(item => (
                        <span key={item} className="text-[10px] uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10 text-gray-400">
                          {item}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Dot on the line */}
                <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-kyber-blue rounded-full -translate-x-1/2 border-4 border-kyber-dark z-20 shadow-[0_0_10px_rgba(0,102,255,0.5)]"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const TurnstileWidget = ({ onVerify, siteKey }: { onVerify: (token: string) => void, siteKey: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    const renderTurnstile = () => {
      try {
        if (window.turnstile) {
          // Clean up previous widget if exists
          if (widgetIdRef.current) {
            window.turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = null;
          }
          
          // Clear container to be safe
          if (containerRef.current) {
            containerRef.current.innerHTML = "";
          }

          const id = window.turnstile.render(containerRef.current!, {
            sitekey: siteKey,
            callback: (token: string) => onVerify(token),
            'error-callback': (err: any) => {
              console.error("Turnstile error:", err);
              if (err === "110200") {
                setError("Invalid Site Key or Domain not allowed (Error 110200). Check Cloudflare settings.");
              } else {
                setError(`Turnstile Error: ${err}`);
              }
            },
            theme: 'dark',
          });
          widgetIdRef.current = id;
        } else {
          setTimeout(renderTurnstile, 500);
        }
      } catch (err) {
        console.error("Turnstile render error:", err);
      }
    };

    renderTurnstile();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey]);

  return (
    <div className="my-4">
      <div ref={containerRef}></div>
      {error && (
        <div className="text-[10px] text-red-400 mt-2 font-mono bg-red-400/10 p-2 rounded border border-red-400/20">
          {error}
        </div>
      )}
    </div>
  );
};



import { getSanityClient } from "./sanity/client";

const Testimonials = ({ sanityConfig }: { sanityConfig?: any }) => {
  const { t, i18n } = useTranslation();
  const [sanityReviews, setSanityReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const projectId = sanityConfig?.projectId || import.meta.env.VITE_SANITY_PROJECT_ID;
    const dataset = sanityConfig?.dataset || import.meta.env.VITE_SANITY_DATASET || 'production';
    
    if (!projectId) {
      setLoading(false);
      return;
    }
    
    const lang = i18n.language.split('-')[0];

    const client = getSanityClient(projectId, dataset);
    client.fetch(`*[_type == "testimonial"]{
      name,
      "role": coalesce(role[$lang], role.it),
      "quote": coalesce(quote[$lang], quote.it),
      rating,
      "avatarUrl": avatar.asset->url
    }`, { lang }).then((data: any[]) => {
      setSanityReviews(data);
      setLoading(false);
    }).catch((err: any) => {
      console.error("Sanity fetch error:", err);
      setLoading(false);
    });
  }, [sanityConfig, i18n.language]);

  const fallbackReviews = t("testimonials.items", { returnObjects: true }) as { name: string, role: string, quote: string, rating?: number }[];
  
  const reviews = sanityReviews.length > 0 ? sanityReviews : fallbackReviews;

  return (
    <section className="py-24 bg-kyber-dark">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center">
          <div className="text-kyber-cyan font-mono text-sm mb-2">{t("testimonials.badge")}</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{t("testimonials.title")}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <div key={i} className="glass-panel p-8 rounded-2xl relative">
              <Quote className="absolute top-6 right-6 text-kyber-cyan/20" size={40} />
              <div className="flex gap-1 mb-6">
                {Array.from({ length: r.rating || 5 }).map((_, s) => <Star key={s} size={14} className="fill-kyber-cyan text-kyber-cyan" />)}
                {Array.from({ length: 5 - (r.rating || 5) }).map((_, s) => <Star key={s + 5} size={14} className="text-gray-600" />)}
              </div>
              <p className="text-gray-300 italic mb-8 leading-relaxed">"{r.quote}"</p>
              <div className="flex items-center gap-4">
                <img src={r.avatarUrl || `https://picsum.photos/seed/${r.name.split(' ')[0].toLowerCase()}/100/100`} alt={r.name} className="w-12 h-12 rounded-full border border-kyber-cyan/30 object-cover" referrerPolicy="no-referrer" />
                <div>
                  <div className="font-bold text-sm">{r.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactForm = () => {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [publicConfig, setPublicConfig] = useState<any>(null);

  useEffect(() => {
    fetch("/api/config/public")
      .then(res => res.json())
      .then(data => setPublicConfig(data))
      .catch(err => console.error("Error fetching public config:", err));
  }, []);

  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!turnstileToken && publicConfig?.turnstile?.siteKey) {
      alert("Per favore completa la verifica di sicurezza.");
      return;
    }
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, lang: i18n.language, turnstileToken })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
        setErrorMessage(data.error || t("contact.form.error"));
      }
    } catch (error) {
      console.error("Errore invio:", error);
      setStatus("error");
      setErrorMessage(t("contact.form.connectionError"));
    }
  };

  return (
    <section id="contatti" className="py-24 bg-black relative">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
        <div>
          <div className="text-kyber-cyan font-mono text-sm mb-2 uppercase tracking-widest">{t("contact.badge")}</div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">{t("contact.title")}</h2>
          <p className="text-gray-400 mb-12 text-lg">
            {t("contact.desc")}
          </p>

          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 glass-panel rounded-lg flex items-center justify-center text-kyber-cyan">
                <Mail size={24} />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Email</div>
                <div className="text-lg font-bold">
                  <a href={`mailto:${KYBERIT_DATA.email}`} className="hover:text-kyber-cyan transition-colors">
                    {KYBERIT_DATA.email}
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 glass-panel rounded-lg flex items-center justify-center text-kyber-cyan">
                <Phone size={24} />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{t("contact.info.phone")}</div>
                <div className="text-lg font-bold">
                  <a href={`tel:${KYBERIT_DATA.phoneRaw}`} className="hover:text-kyber-cyan transition-colors">
                    {KYBERIT_DATA.phone}
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 glass-panel rounded-lg flex items-center justify-center text-kyber-cyan">
                <MapPin size={24} />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{t("contact.info.address")}</div>
                <div className="text-lg font-bold">{KYBERIT_DATA.address}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-10 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 font-mono text-[10px] text-kyber-cyan animate-pulse">
            {t("contact.form.secureConnection")}
          </div>
          
          {status === "success" ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12"
            >
              <div className="w-20 h-20 bg-kyber-cyan/20 rounded-full flex items-center justify-center text-kyber-cyan">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-bold">{t("contact.form.successTitle")}</h3>
              <p className="text-gray-400">{t("contact.form.successDesc")}</p>
              <button 
                onClick={() => setStatus("idle")}
                className="text-kyber-cyan font-bold uppercase tracking-widest text-xs"
              >
                {t("contact.form.sendAnother")}
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t("contact.form.nameLabel")} *</label>
                  <input 
                    type="text" 
                    placeholder={t("contact.form.namePlaceholder")} 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-kyber-cyan outline-none transition-colors" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t("contact.form.emailLabel")} *</label>
                  <input 
                    type="email" 
                    placeholder={t("contact.form.emailPlaceholder")} 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-kyber-cyan outline-none transition-colors" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t("contact.form.subjectLabel")}</label>
                <input 
                  type="text" 
                  placeholder={t("contact.form.subjectPlaceholder")} 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-kyber-cyan outline-none transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t("contact.form.messageLabel")} *</label>
                <textarea 
                  rows={4} 
                  placeholder={t("contact.form.messagePlaceholder")} 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-kyber-cyan outline-none transition-colors resize-none" 
                  required
                ></textarea>
              </div>

              {publicConfig?.turnstile?.siteKey && (
                <div className="flex justify-center">
                  <TurnstileWidget 
                    siteKey={publicConfig.turnstile.siteKey} 
                    onVerify={(token) => setTurnstileToken(token)} 
                  />
                </div>
              )}
              
              <button 
                disabled={status === "loading"}
                className="w-full bg-white text-black py-4 font-bold uppercase tracking-tighter flex items-center justify-center gap-2 hover:bg-kyber-cyan transition-all disabled:opacity-50"
              >
                {status === "loading" ? t("contact.form.sending") : t("contact.form.btn")} <Send size={18} />
              </button>
              
              {status === "error" && (
                <div className="bg-red-400/10 border border-red-400/20 p-4 rounded-lg">
                  <p className="text-red-400 text-xs text-center">{errorMessage}</p>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-kyber-dark border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-kyber-cyan flex items-center justify-center rounded-sm rotate-45">
                <span className="text-black font-bold text-[10px] -rotate-45">K</span>
              </div>
              <span className="text-lg font-bold tracking-tighter">KYBER<span className="text-kyber-cyan">IT</span></span>
            </div>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
              {t("footer.desc")}
            </p>
            <div className="flex items-center gap-4 font-mono text-[10px] text-kyber-cyan">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> SYS::OPERATIONAL</span>
              <span className="opacity-50">BUILD::v4.2.1-stable</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">{t("footer.sections.services")}</h4>
            <ul className="space-y-3 text-sm text-gray-500 font-mono">
              <li><a href="#servizi" className="hover:text-kyber-cyan transition-colors">/web-development</a></li>
              <li><a href="#servizi" className="hover:text-kyber-cyan transition-colors">/networking</a></li>
              <li><a href="#servizi" className="hover:text-kyber-cyan transition-colors">/consulenza</a></li>
              <li><a href="#servizi" className="hover:text-kyber-cyan transition-colors">/cybersicurezza</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">{t("footer.sections.company")}</h4>
            <ul className="space-y-3 text-sm text-gray-500 font-mono">
              <li><a href="#processo" className="hover:text-kyber-cyan transition-colors">{t("nav.process")}</a></li>
              <li><a href="#contatti" className="hover:text-kyber-cyan transition-colors">{t("nav.contact")}</a></li>
              <li><Link to="/setup" className="hover:text-kyber-cyan transition-colors">/setup</Link></li>
              <li><Link to="/admin" className="hover:text-kyber-cyan transition-colors">/admin</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-[10px] text-gray-600 uppercase tracking-widest font-mono">
            <div>© {new Date().getFullYear()} {KYBERIT_DATA.name.toUpperCase()}. {t("footer.rights")}</div>
            <div>P.IVA: {KYBERIT_DATA.vat}</div>
            <div className="flex items-center gap-4">
              <Link to="/legal/privacy-policy" className="hover:text-kyber-cyan transition-colors" title="Privacy Policy">Privacy Policy</Link>
              <Link to="/legal/cookie-policy" className="hover:text-kyber-cyan transition-colors" title="Cookie Policy">Cookie Policy</Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-kyber-cyan rounded-full"></div> ONLINE
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const { i18n } = useTranslation();
  const [siteConfig, setSiteConfig] = useState<any>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  useEffect(() => {
    fetch("/api/config/public")
      .then(res => res.json())
      .then(data => {
        setSiteConfig(data);
      })
      .catch(err => console.error("Error fetching public config:", err));
  }, []);

  const dynamicSanityConfig = siteConfig?.sanity?.projectId 
    ? createSanityConfig(siteConfig.sanity.projectId, siteConfig.sanity.dataset)
    : null;

  // Isolate Sanity Studio to prevent router conflicts
  if (window.location.pathname.startsWith("/admin")) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-kyber-cyan">Caricamento Sanity Studio...</div>}>
        {dynamicSanityConfig ? (
          <Studio config={dynamicSanityConfig} />
        ) : (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
            {siteConfig === null ? (
               <div className="text-kyber-cyan animate-pulse">Caricamento configurazione in corso...</div>
            ) : (
               <>
                 <h2 className="text-2xl font-bold text-white mb-4">Sanity non configurato</h2>
                 <p className="text-gray-400 mb-8">Controlla di aver inserito il Project ID nel file di configurazione.</p>
                 <a href="/" className="bg-kyber-cyan text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest">Torna alla Home</a>
               </>
            )}
          </div>
        )}
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <CookieBanner />
      <AccessibilityWidget />
      <AnalyticsIntegration />
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-kyber-cyan">Inizializzazione...</div>}>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/legal/:slug" element={<LegalPage sanityConfig={dynamicSanityConfig} />} />
          <Route path="/" element={
            <div className="relative">
              <Navbar />
              <Hero />
              <About sanityConfig={dynamicSanityConfig} />
              <Services sanityConfig={dynamicSanityConfig} />
              <Process />
              <Pricing sanityConfig={dynamicSanityConfig} />

              <Testimonials sanityConfig={dynamicSanityConfig} />
              <ContactForm />
              <Footer />
            </div>
          } />
          {/* Catch-all route to prevent black screen on unknown paths */}
          <Route path="*" element={
            <div className="relative">
              <Navbar />
              <Hero />
              <About sanityConfig={dynamicSanityConfig} />
              <Services sanityConfig={dynamicSanityConfig} />
              <Process />
              <Pricing sanityConfig={dynamicSanityConfig} />

              <Testimonials sanityConfig={dynamicSanityConfig} />
              <ContactForm />
              <Footer />
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
