import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Cookie, X, Check, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function CookieBanner() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem("kyberit_cookie_consent");
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences in case we need them globally later
      try {
        const savedPrefs = JSON.parse(consent);
        setPreferences(savedPrefs);
        // Here is where we will inject GA, Hotjar, FB Pixel if savedPrefs.analytics === true etc.
        if (savedPrefs.analytics) {
          window.dispatchEvent(new Event("kyberit_analytics_approved"));
        }
        if (savedPrefs.marketing) {
          window.dispatchEvent(new Event("kyberit_marketing_approved"));
        }
      } catch (e) {
        console.error("Error parsing cookie preferences");
      }
    }
  }, []);

  const saveConsent = (prefs: typeof preferences) => {
    localStorage.setItem("kyberit_cookie_consent", JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);
    
    // Dispatch events for script loading (to be used next week)
    if (prefs.analytics) window.dispatchEvent(new Event("kyberit_analytics_approved"));
    if (prefs.marketing) window.dispatchEvent(new Event("kyberit_marketing_approved"));
  };

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const rejectAll = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  const savePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-50 flex justify-center pointer-events-none">
      <div className="glass-panel w-full max-w-2xl bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 pointer-events-auto flex flex-col relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-kyber-cyan/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {!showDetails ? (
          <>
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-white/5 rounded-xl text-kyber-cyan flex-shrink-0">
                <Cookie size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Rispetto per la tua privacy</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Utilizziamo cookie tecnici strettamente necessari per il funzionamento del sito. Con il tuo consenso, vorremmo utilizzare anche cookie analitici e di marketing per migliorare la tua esperienza. Puoi modificare le tue preferenze in qualsiasi momento.
                </p>
                <Link to="/legal/cookie-policy" className="text-xs text-kyber-cyan hover:underline mt-2 inline-block">
                  Leggi la Cookie Policy completa
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-auto">
              <button 
                onClick={() => setShowDetails(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-bold text-white hover:bg-white/5 transition-colors"
              >
                Personalizza
              </button>
              <button 
                onClick={rejectAll}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-bold text-white border border-white/10 hover:bg-white/5 transition-colors ml-auto"
              >
                Solo Necessari
              </button>
              <button 
                onClick={acceptAll}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold bg-kyber-cyan text-black hover:shadow-lg hover:shadow-kyber-cyan/20 transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Accetta Tutti
              </button>
            </div>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="text-kyber-cyan" size={20} />
                Preferenze Cookie
              </h3>
              <button onClick={() => setShowDetails(false)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Necessary */}
              <div className="p-4 rounded-xl border border-kyber-cyan/20 bg-kyber-cyan/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">Strettamente Necessari</span>
                  <span className="text-xs font-mono text-kyber-cyan">SEMPRE ATTIVI</span>
                </div>
                <p className="text-xs text-gray-400">Fondamentali per la sicurezza e le funzioni base del sito. Non possono essere disattivati.</p>
              </div>

              {/* Analytics */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-start gap-4">
                <div className="pt-1">
                  <input 
                    type="checkbox" 
                    id="pref-analytics"
                    className="w-4 h-4 accent-kyber-cyan bg-black border-white/20 rounded"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                  />
                </div>
                <div>
                  <label htmlFor="pref-analytics" className="font-bold text-white block mb-1 cursor-pointer">Statistiche (Analytics)</label>
                  <p className="text-xs text-gray-400">Ci aiutano a capire come i visitatori interagiscono con il sito per migliorarlo (es. Google Analytics, Hotjar).</p>
                </div>
              </div>

              {/* Marketing */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-start gap-4">
                <div className="pt-1">
                  <input 
                    type="checkbox" 
                    id="pref-marketing"
                    className="w-4 h-4 accent-kyber-cyan bg-black border-white/20 rounded"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                  />
                </div>
                <div>
                  <label htmlFor="pref-marketing" className="font-bold text-white block mb-1 cursor-pointer">Marketing & Profilazione</label>
                  <p className="text-xs text-gray-400">Utilizzati per tracciare i visitatori sui siti web e mostrare annunci rilevanti (es. Facebook Pixel).</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link to="/legal/cookie-policy" className="text-xs text-kyber-cyan hover:underline">
                Visualizza Cookie Policy
              </Link>
              <button 
                onClick={savePreferences}
                className="px-6 py-2.5 rounded-lg text-sm font-bold bg-white text-black hover:bg-gray-200 transition-colors"
              >
                Salva Preferenze
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
