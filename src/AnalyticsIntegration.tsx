import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Estendi l'oggetto Window per TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default function AnalyticsIntegration() {
  const location = useLocation();
  // Legge l'ID direttamente dalle variabili d'ambiente di Vite/Coolify, oppure usa quello fisso
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-X70VHQVJ0E";

  useEffect(() => {
    const injectGA = () => {
      // Se non c'è l'ID o lo script è già stato iniettato, non fare nulla
      if (!measurementId || document.getElementById("ga-script")) return;

      // Inietta lo script principale di Google Analytics
      const script1 = document.createElement("script");
      script1.async = true;
      script1.id = "ga-script";
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script1);

      // Inietta la configurazione di base
      const script2 = document.createElement("script");
      script2.id = "ga-config-script";
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', { page_path: window.location.pathname });
      `;
      document.head.appendChild(script2);
      
      console.log("Kyberit: Google Analytics injected.");
    };

    const handleApproval = () => {
      injectGA();
    };

    // Ascolta l'evento personalizzato scatenato dal CookieBanner
    window.addEventListener("kyberit_analytics_approved", handleApproval);

    // Controlla se il consenso era già stato dato in precedenza (es. refresh della pagina)
    const consent = localStorage.getItem("kyberit_cookie_consent");
    if (consent) {
      try {
        const prefs = JSON.parse(consent);
        if (prefs.analytics) injectGA();
      } catch (e) {
        console.error("Failed to parse cookie preferences", e);
      }
    }

    return () => {
      window.removeEventListener("kyberit_analytics_approved", handleApproval);
    };
  }, [measurementId]);

  // Traccia i cambi di pagina per la SPA (React Router)
  useEffect(() => {
    const consent = localStorage.getItem("kyberit_cookie_consent");
    if (consent && measurementId && window.gtag) {
      try {
        const prefs = JSON.parse(consent);
        // Spedisci l'evento a GA solo se c'è il consenso e GA è caricato
        if (prefs.analytics) {
          window.gtag('config', measurementId, {
            page_path: location.pathname + location.search
          });
        }
      } catch (e) {}
    }
  }, [location, measurementId]);

  return null; // È un componente invisibile, non renderizza nulla
}
