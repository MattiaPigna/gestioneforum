import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * Rileva quando un nuovo Service Worker ha preso il controllo
 * e offre all'utente un pulsante per ricaricare l'app.
 * Il SW (sw.js) già chiama skipWaiting() all'install,
 * quindi il nuovo SW è già attivo — basta ricaricare la pagina.
 */
export default function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Quando il controller cambia (nuovo SW ha preso il controllo) ricarica automaticamente
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Ascolta il messaggio SW_UPDATED dal service worker → ricarica automaticamente
    const onMessage = (event) => {
      if (event.data?.type === 'SW_UPDATED') window.location.reload();
    };
    navigator.serviceWorker.addEventListener('message', onMessage);

    // Controlla anche se c'è già un SW in waiting al mount
    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) setShowBanner(true);

      // Osserva aggiornamenti futuri
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowBanner(true);
          }
        });
      });
    });

    // Controlla aggiornamenti ogni 60 secondi in background
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then(reg => reg.update());
    }, 60_000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.removeEventListener('message', onMessage);
      clearInterval(interval);
    };
  }, []);

  const reload = () => window.location.reload();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-bounce-once">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shrink-0">
          <RefreshCw size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">Aggiornamento disponibile</p>
          <p className="text-xs text-slate-500">Nuova versione dell'app pronta</p>
        </div>
        <button
          onClick={reload}
          className="btn-primary text-xs px-3 py-1.5 shrink-0"
        >
          Aggiorna
        </button>
        <button onClick={() => setShowBanner(false)} className="text-slate-400 hover:text-slate-600 shrink-0">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
