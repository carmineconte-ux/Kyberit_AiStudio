import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { PortableText } from "@portabletext/react";
import { getSanityClient } from "./sanity/client";
import { useTranslation } from "react-i18next";
import { ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Navbar, Footer } from "./App";

export default function LegalPage({ sanityConfig }: { sanityConfig: any }) {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Scroll to top on mount/route change
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!sanityConfig) {
      // If sanityConfig is null but we just booted, we might wait a bit.
      // We handle the loading state properly.
      return;
    }

    const fetchLegalData = async () => {
      try {
        const client = getSanityClient(sanityConfig.projectId, sanityConfig.dataset);
        const query = `*[_type == "legal" && slug.current == $slug][0]`;
        const result = await client.fetch(query, { slug });
        
        if (result) {
          setData(result);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching legal document:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLegalData();
  }, [slug, sanityConfig]);

  // Extract the localized content for the current language
  const lang = i18n.language.split('-')[0] || 'it';
  const content = data?.content?.[lang] || data?.content?.['it'];

  return (
    <div className="relative min-h-screen bg-black flex flex-col">
      <Navbar />
      
      <div className="flex-grow pt-32 pb-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-kyber-cyan hover:text-white transition-colors mb-12 font-mono text-sm uppercase tracking-widest">
            <ArrowRight className="rotate-180" size={16} />
            {t("nav.home") || "Torna alla Home"}
          </Link>
          
          <div className="glass-panel p-8 md:p-16 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-kyber-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-t-2 border-r-2 border-kyber-cyan rounded-full animate-spin mb-4"></div>
                <div className="text-kyber-cyan font-mono text-xs uppercase tracking-widest animate-pulse">Caricamento documento...</div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-50" />
                <h1 className="text-3xl font-bold tracking-tighter mb-4 text-white">Documento non trovato</h1>
                <p className="text-gray-400">Il documento legale richiesto non è al momento disponibile.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="text-kyber-cyan" size={24} />
                  <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white">{data?.title}</h1>
                </div>
                
                {data?.lastUpdated && (
                  <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-12 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-kyber-cyan" />
                    Ultimo aggiornamento: {new Date(data.lastUpdated).toLocaleDateString()}
                  </div>
                )}
                
                <div className="prose prose-invert prose-kyber max-w-none">
                  {content ? (
                    <PortableText 
                      value={content} 
                      components={{
                        block: {
                          h1: ({children}) => <h1 className="text-3xl font-bold mt-12 mb-6 text-white tracking-tighter">{children}</h1>,
                          h2: ({children}) => <h2 className="text-2xl font-bold mt-10 mb-4 text-white flex items-center gap-2"><div className="w-1.5 h-1.5 bg-kyber-cyan rounded-full"></div>{children}</h2>,
                          h3: ({children}) => <h3 className="text-xl font-bold mt-8 mb-4 text-gray-200">{children}</h3>,
                          normal: ({children}) => <p className="text-gray-400 leading-relaxed mb-6">{children}</p>,
                        },
                        list: {
                          bullet: ({children}) => <ul className="space-y-2 text-gray-400 mb-6 ml-6 list-disc marker:text-kyber-cyan">{children}</ul>,
                          number: ({children}) => <ol className="space-y-2 text-gray-400 mb-6 ml-6 list-decimal marker:text-kyber-cyan font-mono">{children}</ol>,
                        },
                        listItem: {
                          bullet: ({children}) => <li className="pl-2">{children}</li>,
                          number: ({children}) => <li className="pl-2">{children}</li>,
                        },
                        marks: {
                          strong: ({children}) => <strong className="font-bold text-white bg-kyber-cyan/10 px-1 rounded">{children}</strong>,
                          link: ({children, value}) => <a href={value.href} target="_blank" rel="noopener noreferrer" className="text-kyber-cyan hover:underline decoration-white/30 underline-offset-4">{children}</a>,
                        }
                      }}
                    />
                  ) : (
                    <p className="text-gray-400 italic">Il documento non contiene testo per la lingua selezionata.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
