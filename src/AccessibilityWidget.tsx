import { useState, useEffect } from "react";
import { Accessibility, Type, Contrast, MonitorPlay, ZoomIn, Palette, X, RefreshCcw } from "lucide-react";

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    largeText: false,
    highContrast: false,
    grayscale: false,
    stopAnimations: false,
    dyslexicFont: false
  });

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem("kyberit_accessibility");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings(parsed);
      } catch (e) {
        console.error("Failed to parse accessibility settings");
      }
    }
  }, []);

  const applySettings = (newSettings: typeof settings) => {
    const html = document.documentElement;
    
    if (newSettings.largeText) html.classList.add("a11y-large-text");
    else html.classList.remove("a11y-large-text");

    if (newSettings.highContrast) html.classList.add("a11y-high-contrast");
    else html.classList.remove("a11y-high-contrast");

    if (newSettings.grayscale) html.classList.add("a11y-grayscale");
    else html.classList.remove("a11y-grayscale");

    if (newSettings.stopAnimations) html.classList.add("a11y-stop-animations");
    else html.classList.remove("a11y-stop-animations");

    if (newSettings.dyslexicFont) html.classList.add("a11y-dyslexic");
    else html.classList.remove("a11y-dyslexic");

    localStorage.setItem("kyberit_accessibility", JSON.stringify(newSettings));
  };

  const toggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    applySettings(newSettings);
  };

  const resetSettings = () => {
    const defaultSettings = {
      largeText: false,
      highContrast: false,
      grayscale: false,
      stopAnimations: false,
      dyslexicFont: false
    };
    setSettings(defaultSettings);
    applySettings(defaultSettings);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-[60] w-12 h-12 bg-kyber-cyan text-black rounded-full shadow-lg shadow-kyber-cyan/20 flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Apri menu accessibilità"
      >
        <Accessibility size={24} />
      </button>

      {/* Widget Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-[60] w-80 glass-panel bg-black/95 backdrop-blur-xl border border-kyber-cyan/20 rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Accessibility className="text-kyber-cyan" size={18} />
              Accessibilità
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => toggleSetting('largeText')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${settings.largeText ? 'bg-kyber-cyan/10 border-kyber-cyan text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <span className="flex items-center gap-3 text-sm font-bold"><ZoomIn size={16} /> Testo più grande</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.largeText ? 'bg-kyber-cyan' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.largeText ? 'translate-x-5' : ''}`}></div>
              </div>
            </button>

            <button 
              onClick={() => toggleSetting('highContrast')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${settings.highContrast ? 'bg-kyber-cyan/10 border-kyber-cyan text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <span className="flex items-center gap-3 text-sm font-bold"><Contrast size={16} /> Alto contrasto</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.highContrast ? 'bg-kyber-cyan' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.highContrast ? 'translate-x-5' : ''}`}></div>
              </div>
            </button>

            <button 
              onClick={() => toggleSetting('grayscale')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${settings.grayscale ? 'bg-kyber-cyan/10 border-kyber-cyan text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <span className="flex items-center gap-3 text-sm font-bold"><Palette size={16} /> Scala di grigi</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.grayscale ? 'bg-kyber-cyan' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.grayscale ? 'translate-x-5' : ''}`}></div>
              </div>
            </button>

            <button 
              onClick={() => toggleSetting('stopAnimations')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${settings.stopAnimations ? 'bg-kyber-cyan/10 border-kyber-cyan text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <span className="flex items-center gap-3 text-sm font-bold"><MonitorPlay size={16} /> Ferma animazioni</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.stopAnimations ? 'bg-kyber-cyan' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.stopAnimations ? 'translate-x-5' : ''}`}></div>
              </div>
            </button>

            <button 
              onClick={() => toggleSetting('dyslexicFont')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${settings.dyslexicFont ? 'bg-kyber-cyan/10 border-kyber-cyan text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <span className="flex items-center gap-3 text-sm font-bold"><Type size={16} /> Font Dislessia</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.dyslexicFont ? 'bg-kyber-cyan' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.dyslexicFont ? 'translate-x-5' : ''}`}></div>
              </div>
            </button>
          </div>

          <button 
            onClick={resetSettings}
            className="w-full mt-6 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw size={14} />
            Ripristina
          </button>
        </div>
      )}
    </>
  );
}
