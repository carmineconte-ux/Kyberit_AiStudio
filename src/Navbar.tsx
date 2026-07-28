import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

export const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t("nav.about"), href: isHome ? "#chi-siamo" : "/#chi-siamo", isExternal: !isHome },
    { name: t("nav.services"), href: isHome ? "#servizi" : "/#servizi", isExternal: !isHome },
    { name: t("nav.process"), href: isHome ? "#processo" : "/#processo", isExternal: !isHome },
    { name: t("nav.pricing"), href: isHome ? "#listino" : "/#listino", isExternal: !isHome },
    { name: t("nav.tools"), href: "/tools", isExternal: true },
    { name: t("nav.contact"), href: isHome ? "#contatti" : "/#contatti", isExternal: !isHome },
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
                link.isExternal ? (
                  <Link 
                    key={link.name}
                    to={link.href} 
                    className="hover:text-kyber-cyan transition-all duration-300 relative group py-2"
                  >
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-kyber-cyan transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                ) : (
                  <a 
                    key={link.name}
                    href={link.href} 
                    className="hover:text-kyber-cyan transition-all duration-300 relative group py-2"
                  >
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-kyber-cyan transition-all duration-300 group-hover:w-full"></span>
                  </a>
                )
              ))}
            </div>

            <Link 
              to="/tools"
              className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-kyber-cyan hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
            >
              {t("nav.freeAnalysis")}
            </Link>
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
            link.isExternal ? (
              <Link 
                key={link.name}
                to={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-kyber-cyan transition-colors"
              >
                {link.name}
              </Link>
            ) : (
              <a 
                key={link.name}
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-kyber-cyan transition-colors"
              >
                {link.name}
              </a>
            )
          ))}
          <Link 
            to="/tools"
            onClick={() => setMobileMenuOpen(false)}
            className="bg-kyber-cyan text-black px-12 py-5 rounded-full text-sm font-black"
          >
            {t("nav.freeAnalysis")}
          </Link>
        </div>
      </div>
    </>
  );
};
