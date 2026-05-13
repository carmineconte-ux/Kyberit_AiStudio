import { motion, AnimatePresence } from "motion/react";
import { Terminal, Shield, Globe, Network, Cpu, Activity, ArrowRight, CheckCircle2, Star, Quote, Send, Mail, Phone, MapPin, Search, Rocket, PenTool, ShieldCheck, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef, FormEvent, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { GoogleGenAI, Type } from "@google/genai";

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

const Navbar = () => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t("nav.services"), href: "#servizi" },
    { name: t("nav.process"), href: "#processo" },
    { name: t("nav.diagnostics"), href: "#diagnostica" },
    { name: t("nav.contact"), href: "#contatti" },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? "bg-black/90 backdrop-blur-xl border-b border-white/10 py-4 shadow-2xl" : "bg-transparent py-8"}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
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
            href="#diagnostica"
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

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-black/95 backdrop-blur-2xl z-40 transition-all duration-500 md:hidden ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="flex flex-col items-center justify-center h-full gap-12 text-2xl font-bold uppercase tracking-widest">
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
            href="#diagnostica"
            onClick={() => setMobileMenuOpen(false)}
            className="bg-kyber-cyan text-black px-12 py-5 rounded-full text-sm font-black"
          >
            {t("nav.freeAnalysis")}
          </a>
        </div>
      </div>
    </nav>
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
              href="#diagnostica"
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

const Services = () => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const services = [
    {
      id: "WEB.DEV",
      title: t("services.items.web.title"),
      subTitle: t("services.items.web.sub"),
      desc: t("services.items.web.desc"),
      features: t("services.items.web.features", { returnObjects: true }) as string[],
      icon: <Globe className="text-kyber-cyan" size={24} />,
      price: "Da €2.500",
      image: "/photo/Siti Web.webp"
    },
    {
      id: "NET.OPS",
      title: t("services.items.network.title"),
      subTitle: t("services.items.network.sub"),
      desc: t("services.items.network.desc"),
      features: t("services.items.network.features", { returnObjects: true }) as string[],
      icon: <Network className="text-kyber-cyan" size={24} />,
      price: "Da €1.200",
      image: "/photo/Networking.webp"
    },
    {
      id: "CONSULT",
      title: t("services.items.consult.title"),
      subTitle: t("services.items.consult.sub"),
      desc: t("services.items.consult.desc"),
      features: t("services.items.consult.features", { returnObjects: true }) as string[],
      icon: <Cpu className="text-kyber-cyan" size={24} />,
      price: "Su Preventivo",
      image: "/photo/Consulenza Aziendale.webp"
    },
    {
      id: "SEC.OPS",
      title: t("services.items.security.title"),
      subTitle: t("services.items.security.sub"),
      desc: t("services.items.security.desc"),
      features: t("services.items.security.features", { returnObjects: true }) as string[],
      icon: <Shield className="text-kyber-cyan" size={24} />,
      price: "Da €3.000",
      image: "/photo/CyberSecurity.webp"
    }
  ];

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

const Diagnostic = () => {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [publicConfig, setPublicConfig] = useState<any>(null);

  useEffect(() => {
    fetch("/api/config/public")
      .then(res => res.json())
      .then(data => setPublicConfig(data))
      .catch(err => console.error("Error fetching public config:", err));
  }, []);

  const steps = [
    t("diagnostic.loading.analyzing"),
    t("diagnostic.loading.performance"),
    t("diagnostic.loading.security"),
    t("diagnostic.loading.seo"),
    t("diagnostic.loading.generating")
  ];

  useEffect(() => {
    if (loading && step < steps.length - 1) {
      const timer = setTimeout(() => {
        setStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, step]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url || !email) return;

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    setLoading(true);
    setStep(0);
    setReport(null);

    if (!turnstileToken && publicConfig?.turnstile?.siteKey) {
      alert("Per favore completa la verifica di sicurezza.");
      setLoading(false);
      return;
    }

    const langMap: Record<string, string> = {
      it: "italiano",
      en: "inglese",
      de: "tedesco",
      fr: "francese"
    };
    const currentLangName = langMap[i18n.language] || "italiano";

    try {
    const response = await fetch("/api/gemini-proxy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gemini-2.0-flash",
    contents: [{ parts: [{ text: `Analizza l'URL: ${normalizedUrl}` }] }],
    config: {
      systemInstruction: `Sei un esperto senior di cybersicurezza e performance web di Kyberit. Genera report diagnostici tecnici, precisi e professionali in ${currentLangName}. Evita ripetizioni, sii conciso e non aggiungere testo inutile alla fine del report. Il riepilogo (summary) deve essere un paragrafo di massimo 300 caratteri.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Punteggio globale da 0 a 100" },
          status: { type: Type.STRING, description: "Stato: Ottimale, Attenzione o Critico" },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Titolo della sezione (es. Sicurezza, Performance)" },
                score: { type: Type.NUMBER, description: "Punteggio della sezione" },
                findings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Elenco dei risultati tecnici" }
              }
            }
          },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Azioni correttive suggerite" },
          summary: { type: Type.STRING, description: "Riepilogo esecutivo conciso" }
        },
        required: ["score", "status", "sections", "recommendations", "summary"]
      }
    }
  })
});

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Errore durante la chiamata al proxy Gemini.");
      }

      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!resultText) {
        throw new Error("Il modello non ha restituito alcun testo.");
      }
      const result = JSON.parse(resultText);
      
      // Save diagnostic and send emails
      try {
        await fetch("/api/diagnostic/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: normalizedUrl,
            email,
            report: result,
            lang: i18n.language,
            turnstileToken
          })
        });
      } catch (e) {
        console.error("Error saving diagnostic:", e);
      }

      // Aspettiamo che l'animazione dei passi finisca prima di mostrare il report
      setTimeout(() => {
        setReport(result);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Errore durante la diagnostica:", error);
      setLoading(false);
    }
  };

  return (
    <section id="diagnostica" className="py-24 bg-black relative">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="inline-block p-4 glass-panel rounded-full mb-8">
          <Search className="text-kyber-cyan" size={32} />
        </div>
        <div className="text-kyber-cyan font-mono text-sm mb-2">{t("diagnostic.badge")}</div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">{t("diagnostic.title")}</h2>
        <p className="text-gray-400 mb-12">
          {t("diagnostic.desc")}
        </p>

        {!loading && !report && (
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit} 
            className="glass-panel p-10 rounded-3xl max-w-5xl mx-auto shadow-2xl shadow-kyber-cyan/5 border border-white/5 relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-kyber-cyan/20 to-kyber-blue/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative z-10 flex flex-col gap-6">
              <div className="grid md:grid-cols-[1fr_1fr_auto] gap-6 items-end">
                <div className="text-left">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-mono font-bold">{t("diagnostic.form.urlLabel")}</label>
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-kyber-cyan focus-within:bg-white/10 transition-all duration-300">
                    <span className="text-gray-500 text-sm font-mono select-none mr-1">https://</span>
                    <input 
                      type="text" 
                      placeholder={t("diagnostic.form.urlPlaceholder")} 
                      value={url}
                      onChange={(e) => {
                        let val = e.target.value;
                        val = val.replace(/^https?:\/\//, "");
                        setUrl(val);
                      }}
                      required
                      className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-gray-600"
                    />
                  </div>
                </div>
                
                <div className="text-left">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-mono font-bold">{t("diagnostic.form.emailLabel")}</label>
                  <input 
                    type="email" 
                    placeholder={t("diagnostic.form.emailPlaceholder")} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-kyber-cyan focus:bg-white/10 outline-none transition-all duration-300 placeholder:text-gray-600"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full md:w-auto bg-white text-black px-10 py-4 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-kyber-cyan hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 h-[54px]"
                >
                  {t("diagnostic.form.btn")}
                </button>
              </div>

              {publicConfig?.turnstile?.siteKey && (
                <div className="flex justify-center border-t border-white/5 pt-4">
                  <TurnstileWidget 
                    siteKey={publicConfig.turnstile.siteKey} 
                    onVerify={(token) => setTurnstileToken(token)} 
                  />
                </div>
              )}
            </div>
          </motion.form>
        )}

        {loading && !report && (
          <div className="glass-panel p-12 rounded-2xl">
            <div className="flex flex-col items-center gap-8">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-kyber-cyan/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-kyber-cyan rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-kyber-cyan">
                  <Activity size={32} />
                </div>
              </div>
              
              <div className="space-y-4 w-full max-w-md">
                <div className="text-kyber-cyan font-mono text-sm animate-pulse">
                  {steps[step]}
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-kyber-cyan"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 font-mono">
                  <span>Status: {t("diagnostic.loading.status")}</span>
                  <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {report && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-2xl text-left"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-white/10">
              <div>
                <h3 className="text-2xl font-bold mb-2">{t("diagnostic.report.title")}: {url}</h3>
                <p className="text-gray-400 text-sm">{t("diagnostic.report.completed")} {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${report.score > 80 ? 'text-green-400' : report.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {report.score}/100
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500">Global Score</div>
                </div>
                <div className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                  report.status === 'Ottimale' || report.status === 'Optimal' || report.status === 'Optimal' || report.status === 'Optimal' ? 'bg-green-400/10 border-green-400/20 text-green-400' :
                  report.status === 'Attenzione' || report.status === 'Attention' || report.status === 'Warnung' || report.status === 'Attention' ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' :
                  'bg-red-400/10 border-red-400/20 text-red-400'
                }`}>
                  {report.status}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              {report.sections?.map((section, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-gray-300">{section.title}</h4>
                    <span className={`text-xs font-mono ${section.score > 80 ? 'text-green-400' : 'text-yellow-400'}`}>{section.score}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${section.score > 80 ? 'bg-green-400' : 'bg-yellow-400'}`} style={{ width: `${section.score}%` }}></div>
                  </div>
                  <ul className="space-y-2">
                    {section.findings?.map((finding, j) => (
                      <li key={j} className="text-xs text-gray-400 flex gap-2">
                        <span className="text-kyber-cyan">•</span> {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-10">
              <h4 className="font-bold text-sm uppercase tracking-widest text-kyber-cyan mb-4">{t("diagnostic.report.recommendations")}</h4>
              <ul className="space-y-3">
                {report.recommendations?.map((rec, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-3">
                    <CheckCircle2 size={16} className="text-kyber-cyan shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-xs text-gray-500 italic max-w-md">
                {report.summary}
              </p>
              <button 
                onClick={() => setReport(null)}
                className="bg-white text-black px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-kyber-cyan transition-colors"
              >
                {t("diagnostic.report.newAnalysis")}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

const Testimonials = () => {
  const { t } = useTranslation();
  const reviews = t("testimonials.items", { returnObjects: true }) as { name: string, role: string, quote: string }[];

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
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="fill-kyber-cyan text-kyber-cyan" />)}
              </div>
              <p className="text-gray-300 italic mb-8 leading-relaxed">"{r.quote}"</p>
              <div className="flex items-center gap-4">
                <img src={`https://picsum.photos/seed/${r.name.split(' ')[0].toLowerCase()}/100/100`} alt={r.name} className="w-12 h-12 rounded-full border border-kyber-cyan/30" referrerPolicy="no-referrer" />
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

const Footer = () => {
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
              <a href="https://www.iubenda.com/privacy-policy/85043270" className="iubenda-black iubenda-noiframe iubenda-embed hover:text-kyber-cyan transition-colors" title="Privacy Policy">Privacy Policy</a>
              <a href="https://www.iubenda.com/privacy-policy/85043270/cookie-policy" className="iubenda-black iubenda-noiframe iubenda-embed hover:text-kyber-cyan transition-colors" title="Cookie Policy">Cookie Policy</a>
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

const SetupPage = () => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState({
    smtp: { host: "", port: 587, user: "", pass: "", from: "", contactEmail: "" },
    sanity: { projectId: "", dataset: "production", organizationId: "" },
    iubenda: { siteId: "", policyId: "" },
    turnstile: { siteKey: "", secretKey: "" },
    diagnostics: [] as any[]
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [message, setMessage] = useState("");

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setMessage("");
    try {
      const res = await fetch("/api/config/test-smtp", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": password
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

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/config", {
        headers: { "Authorization": password }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(prev => ({
          smtp: { ...prev.smtp, ...data.smtp },
          sanity: { ...prev.sanity, ...data.sanity },
          iubenda: { ...prev.iubenda, ...data.iubenda },
          turnstile: { ...prev.turnstile, ...data.turnstile },
          diagnostics: data.diagnostics || []
        }));
        setIsAuthenticated(true);
      } else {
        setMessage("Password errata.");
      }
    } catch (e) {
      setMessage("Errore di connessione.");
    }
    setLoading(false);
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
          "Authorization": password
        },
        body: JSON.stringify(config)
      });
      if (res.ok) setMessage("Configurazione salvata con successo!");
      else setMessage("Errore durante il salvataggio.");
    } catch (e) {
      setMessage("Errore di rete.");
    }
    setSaving(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="glass-panel p-10 rounded-3xl max-w-md w-full border border-white/10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 bg-kyber-cyan flex items-center justify-center rounded-sm rotate-45">
              <span className="text-black font-bold text-[10px] -rotate-45">K</span>
            </div>
            <span className="text-lg font-bold tracking-tighter text-white">KYBER<span className="text-kyber-cyan">IT</span> SETUP</span>
          </div>
          <h1 className="text-2xl font-bold mb-6 tracking-tighter text-white">Accesso Riservato</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Password di Accesso</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-kyber-cyan outline-none transition-colors" 
                placeholder="Inserisci password"
                required
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-kyber-cyan text-black py-3 font-bold uppercase tracking-tighter hover:scale-105 transition-transform disabled:opacity-50"
            >
              {loading ? "Verifica..." : "Accedi"}
            </button>
            {message && <p className="text-red-400 text-xs text-center font-mono">{message}</p>}
          </form>
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
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link to="/" className="text-kyber-cyan hover:underline text-sm flex items-center gap-2">
            <ArrowRight size={16} className="rotate-180" /> Torna al sito
          </Link>
          <h1 className="text-3xl font-bold tracking-tighter">Setup Parametri Sito</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-10">
          {/* SMTP Section */}
          <div className="glass-panel p-8 rounded-2xl border border-white/10">
            <h2 className="text-kyber-cyan font-mono text-xs mb-6 uppercase tracking-widest">// CONFIGURAZIONE SMTP</h2>
            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Host</label>
                  <input 
                    type="text" 
                    value={config.smtp.host}
                    onChange={e => setConfig({...config, smtp: {...config.smtp, host: e.target.value}})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Porta</label>
                  <input 
                    type="number" 
                    value={config.smtp.port}
                    onChange={e => setConfig({...config, smtp: {...config.smtp, port: parseInt(e.target.value)}})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                    placeholder="587"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Utente / Email</label>
                <input 
                  type="text" 
                  value={config.smtp.user}
                  onChange={e => setConfig({...config, smtp: {...config.smtp, user: e.target.value}})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                  placeholder="info@tuodominio.it"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Password / App Password</label>
                <input 
                  type="password" 
                  value={config.smtp.pass}
                  onChange={e => setConfig({...config, smtp: {...config.smtp, pass: e.target.value}})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                  placeholder="••••••••••••"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Email Mittente (From)</label>
                <input 
                  type="text" 
                  value={config.smtp.from}
                  onChange={e => setConfig({...config, smtp: {...config.smtp, from: e.target.value}})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                  placeholder="Kyberit <info@kyberit.tech>"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Email Ricezione (To)</label>
                <input 
                  type="text" 
                  value={config.smtp.contactEmail}
                  onChange={e => setConfig({...config, smtp: {...config.smtp, contactEmail: e.target.value}})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                  placeholder="info@kyberit.tech"
                />
                <p className="text-[9px] text-gray-500 mt-1 font-mono">L'indirizzo dove riceverai i messaggi del modulo contatti e i log degli audit.</p>
              </div>
              
              <div className="pt-4 flex flex-col gap-4">
                <button 
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp}
                  className="text-[10px] uppercase tracking-widest text-kyber-cyan border border-kyber-cyan/30 px-4 py-2 rounded hover:bg-kyber-cyan/10 transition-colors disabled:opacity-50"
                >
                  {testingSmtp ? "Test in corso..." : "Testa Connessione SMTP"}
                </button>
                
                {config.smtp.host.includes("gmail.com") && (
                  <p className="text-[10px] text-amber-400/80 font-mono leading-relaxed">
                    ⚠️ NOTA PER GMAIL: Se hai l'autenticazione a 2 fattori attiva, devi generare e usare una "Password per le App" invece della tua password normale.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Iubenda & Turnstile */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-panel p-8 rounded-2xl border border-white/10">
              <h2 className="text-kyber-cyan font-mono text-xs mb-6 uppercase tracking-widest">// SANITY.IO</h2>
              <div className="space-y-4">
                <div className="p-4 bg-kyber-cyan/5 border border-kyber-cyan/20 rounded-lg mb-4">
                  <p className="text-[10px] text-kyber-cyan font-mono leading-relaxed">
                    1. Crea un progetto su <a href="https://sanity.io" target="_blank" className="underline">sanity.io</a><br/>
                    2. Aggiungi <span className="text-white">https://{window.location.host}</span> agli URL consentiti (CORS)<br/>
                    3. Copia il Project ID qui sotto.
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Project ID</label>
                  <input 
                    type="text" 
                    value={config.sanity.projectId}
                    onChange={e => setConfig({...config, sanity: {...config.sanity, projectId: e.target.value}})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                    placeholder="oOKJqfcMb"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Dataset</label>
                  <input 
                    type="text" 
                    value={config.sanity.dataset}
                    onChange={e => setConfig({...config, sanity: {...config.sanity, dataset: e.target.value}})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                    placeholder="production"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Organization ID (Optional)</label>
                  <input 
                    type="text" 
                    value={config.sanity.organizationId || ""}
                    onChange={e => setConfig({...config, sanity: {...config.sanity, organizationId: e.target.value}})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                    placeholder="o01oYDXF8"
                  />
                </div>
              </div>
            </div>
            <div className="glass-panel p-8 rounded-2xl border border-white/10">
              <h2 className="text-kyber-cyan font-mono text-xs mb-6 uppercase tracking-widest">// IUBENDA</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Site ID</label>
                  <input 
                    type="text" 
                    value={config.iubenda.siteId}
                    onChange={e => setConfig({...config, iubenda: {...config.iubenda, siteId: e.target.value}})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Policy ID</label>
                  <input 
                    type="text" 
                    value={config.iubenda.policyId}
                    onChange={e => setConfig({...config, iubenda: {...config.iubenda, policyId: e.target.value}})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/10">
            <h2 className="text-kyber-cyan font-mono text-xs mb-6 uppercase tracking-widest">// TURNSTILE</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Site Key</label>
                <input 
                  type="text" 
                  value={config.turnstile.siteKey}
                  onChange={e => setConfig({...config, turnstile: {...config.turnstile, siteKey: e.target.value}})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Secret Key</label>
                <input 
                  type="password" 
                  value={config.turnstile.secretKey}
                  onChange={e => setConfig({...config, turnstile: {...config.turnstile, secretKey: e.target.value}})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-kyber-cyan outline-none" 
                />
                <p className="text-[9px] text-gray-500 mt-2 italic">
                  Nota: Se ricevi l'errore 110200, assicurati che il dominio sia autorizzato su Cloudflare o usa una chiave di test.
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Log Section */}
          <div className="glass-panel p-8 rounded-2xl border border-white/10">
            <h2 className="text-kyber-cyan font-mono text-xs mb-6 uppercase tracking-widest">// LOG DIAGNOSTICA AI</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {config.diagnostics && config.diagnostics.length > 0 ? (
                config.diagnostics.map((diag: any) => (
                  <div key={diag.id} className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-kyber-cyan/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-bold text-white">{diag.url}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{new Date(diag.timestamp).toLocaleString()}</div>
                      </div>
                      <div className={`text-xs font-bold ${diag.score > 80 ? 'text-green-400' : diag.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {diag.score}/100
                      </div>
                    </div>
                    <div className="text-[10px] text-kyber-cyan font-mono mb-1">USER: {diag.email}</div>
                    <p className="text-[10px] text-gray-400 line-clamp-2 italic">"{diag.summary}"</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-600 font-mono text-xs">
                  Nessun audit registrato nel sistema.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-kyber-cyan text-black px-10 py-4 rounded-full font-bold uppercase tracking-tighter hover:shadow-lg hover:shadow-kyber-cyan/20 transition-all disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : "Salva Configurazione"}
            </button>
            {message && <span className="text-kyber-cyan font-mono text-xs animate-pulse">{message}</span>}
          </div>
        </form>
      </div>
    </div>
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
        
        // Iubenda Script Injection
        if (data.iubenda?.siteId) {
          const siteId = data.iubenda.siteId;
          const policyId = data.iubenda.policyId || "";
          const langCode = i18n.language.split('-')[0];
          
          // Clean up existing Iubenda elements
          ['iubenda-config', 'iubenda-script', 'iubenda-embed-script', 'iubenda-widget-script'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
          });

          // 1. Configuration Object (Must be global and set before the CS script)
          const configScript = document.createElement('script');
          configScript.id = 'iubenda-config';
          configScript.type = 'text/javascript';
          configScript.innerHTML = `
            window._iub = window._iub || [];
            _iub.csConfiguration = {
              "askConsentAtCookiePolicyUpdate": true,
              "floatingPullLeft": true,
              "perPage": true,
              "invalidateConsent": true,
              "siteId": ${siteId},
              "whitelabel": false,
              "cookiePolicyId": "${policyId}",
              "lang": "${langCode}",
              "banner": {
                "acceptButtonDisplay": true,
                "customizeButtonDisplay": true,
                "position": "float-bottom-right",
                "rejectButtonDisplay": true,
                "backgroundOverlay": true
              }
            };
          `;
          document.head.appendChild(configScript);

          // 2. Cookie Solution Script
          const mainScript = document.createElement('script');
          mainScript.id = 'iubenda-script';
          mainScript.type = 'text/javascript';
          mainScript.src = 'https://cdn.iubenda.com/cs/iubenda_cs.js';
          mainScript.charset = 'UTF-8';
          mainScript.async = true;
          document.head.appendChild(mainScript);

          // 3. Privacy/Cookie Policy Embed Script (for the links in footer)
          const embedScript = document.createElement('script');
          embedScript.id = 'iubenda-embed-script';
          embedScript.type = 'text/javascript';
          embedScript.innerHTML = `(function (w,d) {var loader = function () {var s = d.createElement("script"), tag = d.getElementsByTagName("script")[0]; s.src="https://cdn.iubenda.com/iubenda.js"; tag.parentNode.insertBefore(s,tag);}; if(w.addEventListener){w.addEventListener("load", loader, false);}else if(w.attachEvent){w.attachEvent("onload", loader);}else{w.onload = loader;}})(window, document);`;
          document.head.appendChild(embedScript);

          // 4. Widget Script
          const widgetScript = document.createElement('script');
          widgetScript.id = 'iubenda-widget-script';
          widgetScript.type = 'text/javascript';
          widgetScript.src = 'https://embeds.iubenda.com/widgets/12e4f23d-3706-4032-bcf3-157361aac4fd.js';
          widgetScript.async = true;
          document.head.appendChild(widgetScript);
        }
      })
      .catch(err => console.error("Error fetching public config:", err));
  }, [i18n.language]);

  const dynamicSanityConfig = siteConfig?.sanity?.projectId 
    ? createSanityConfig(siteConfig.sanity.projectId, siteConfig.sanity.dataset)
    : null;

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-kyber-cyan">Inizializzazione...</div>}>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/admin/*" element={
            dynamicSanityConfig ? (
              <Studio config={dynamicSanityConfig} />
            ) : (
              <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Sanity non configurato</h2>
                <p className="text-gray-400 mb-8">Inserisci il Project ID nel pannello di Setup per abilitare il backend.</p>
                <Link to="/setup" className="bg-kyber-cyan text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest">Vai al Setup</Link>
              </div>
            )
          } />
          <Route path="/" element={
            <div className="relative">
              <Navbar />
              <Hero />
              <Services />
              <Process />
              <Diagnostic />
              <Testimonials />
              <ContactForm />
              <Footer />
            </div>
          } />
          {/* Catch-all route to prevent black screen on unknown paths */}
          <Route path="*" element={
            <div className="relative">
              <Navbar />
              <Hero />
              <Services />
              <Process />
              <Diagnostic />
              <Testimonials />
              <ContactForm />
              <Footer />
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
