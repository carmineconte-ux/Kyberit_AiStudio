import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { KYBERIT_DATA } from "./constants";

export const Footer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const getLinkHref = (hash: string) => {
    return isHome ? hash : `/${hash}`;
  };

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
            <p className="text-gray-400 text-sm max-w-sm mb-6">
              {t("footer.desc")}
            </p>
            <div className="flex items-center gap-4 font-mono text-[10px] text-kyber-cyan">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> SYS::OPERATIONAL</span>
              <span className="opacity-50">BUILD::v4.2.1-stable</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">{t("footer.sections.services")}</h4>
            <ul className="space-y-3 text-sm text-gray-400 font-mono">
              <li><a href={getLinkHref("#servizi")} className="hover:text-kyber-cyan transition-colors">/web-development</a></li>
              <li><a href={getLinkHref("#servizi")} className="hover:text-kyber-cyan transition-colors">/networking</a></li>
              <li><a href={getLinkHref("#servizi")} className="hover:text-kyber-cyan transition-colors">/consulenza</a></li>
              <li><a href={getLinkHref("#servizi")} className="hover:text-kyber-cyan transition-colors">/cybersicurezza</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">{t("footer.sections.company")}</h4>
            <ul className="space-y-3 text-sm text-gray-400 font-mono">
              <li><a href={getLinkHref("#processo")} className="hover:text-kyber-cyan transition-colors">{t("nav.process")}</a></li>
              <li><a href={getLinkHref("#contatti")} className="hover:text-kyber-cyan transition-colors">{t("nav.contact")}</a></li>
              <li><Link to="/setup" className="hover:text-kyber-cyan transition-colors">/setup</Link></li>
              <li><Link to="/admin" className="hover:text-kyber-cyan transition-colors">/admin</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-[10px] text-gray-400 uppercase tracking-widest font-mono">
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
