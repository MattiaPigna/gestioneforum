import { useState, useEffect } from 'react';
import { Bell, BellOff, X, Share, Plus } from 'lucide-react';
import { initPush, getPushPermissionState } from '../lib/push';
import { useAuth } from '../context/AuthContext';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export default function NotificationSetup() {
  const { socio } = useAuth();
  const [step, setStep] = useState(null); // null | 'install-ios' | 'ask-permission' | 'done' | 'denied'
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!socio) return;
    if (localStorage.getItem('push-setup-done') === '1') return;

    const state = getPushPermissionState();
    if (state === 'granted') { localStorage.setItem('push-setup-done', '1'); return; }
    if (state === 'denied') { setStep('denied'); return; }

    // iOS fuori dalla home screen → mostra guida installazione
    if (isIOS() && !isInStandaloneMode()) {
      setStep('install-ios');
      return;
    }

    if (!isPushSupported()) return;

    // Tutti gli altri (Android, desktop) → chiedi permesso con bottone
    setStep('ask-permission');
  }, [socio]);

  const [enabling, setEnabling] = useState(false);
  const [debugMsg, setDebugMsg] = useState('');

  const handleEnable = async () => {
    setEnabling(true);
    setDebugMsg('Richiesta permesso...');
    const result = await initPush(socio.id, setDebugMsg);
    setEnabling(false);
    if (result === 'granted') {
      localStorage.setItem('push-setup-done', '1');
      setStep('done');
      setTimeout(() => setStep(null), 2500);
    } else if (result === 'denied') {
      setStep('denied');
    } else {
      setDebugMsg('Errore: ' + result);
    }
  };

  const dismiss = () => {
    setDismissed(true);
    setStep(null);
  };

  if (dismissed || !step || step === 'done' && false) return null;

  // ── Successo ──
  if (step === 'done') {
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
        <div className="bg-teal-500 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
          <Bell size={20} className="shrink-0" />
          <p className="text-sm font-semibold">Notifiche attivate!</p>
        </div>
      </div>
    );
  }

  // ── Guida installazione iOS ──
  if (step === 'install-ios') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
              <Bell size={20} className="text-white" />
            </div>
            <button onClick={dismiss} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Attiva le notifiche push</h3>
            <p className="text-sm text-slate-500 mt-1">Per ricevere notifiche su iPhone devi prima installare l'app sulla Home Screen.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
              <p className="text-sm text-slate-700">
                Tocca il pulsante <span className="inline-flex items-center gap-1 font-semibold"><Share size={13} /> Condividi</span> in Safari (in basso al centro)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
              <p className="text-sm text-slate-700">
                Scegli <span className="inline-flex items-center gap-1 font-semibold"><Plus size={13} /> Aggiungi a Home Screen</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
              <p className="text-sm text-slate-700">Riapri l'app dall'icona sulla Home Screen e accetta le notifiche</p>
            </div>
          </div>
          <button onClick={dismiss} className="w-full py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 font-medium">
            Dopo
          </button>
        </div>
      </div>
    );
  }

  // ── Chiedi permesso (Android / desktop / iOS da PWA installata) ──
  if (step === 'ask-permission') {
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shrink-0">
              <Bell size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">Attiva le notifiche</p>
              <p className="text-xs text-slate-500 mt-0.5">Ricevi aggiornamenti su task, eventi e proposte</p>
            </div>
            <button onClick={dismiss} className="text-slate-400 hover:text-slate-600 shrink-0"><X size={16} /></button>
          </div>
          {debugMsg ? (
            <p className="mt-2 text-xs text-slate-400 text-center">{debugMsg}</p>
          ) : null}
          <div className="flex gap-2 mt-3">
            <button onClick={dismiss} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 font-medium">
              Non ora
            </button>
            <button onClick={handleEnable} disabled={enabling} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white text-xs font-medium hover:opacity-90 disabled:opacity-60">
              {enabling ? 'Attivazione...' : 'Attiva notifiche'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Permesso negato ──
  if (step === 'denied') {
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl shadow-lg p-4 flex items-center gap-3">
          <BellOff size={18} className="text-rose-500 shrink-0" />
          <p className="text-xs text-rose-700 flex-1">Notifiche bloccate. Riattivarle da Impostazioni → Safari → Notifiche</p>
          <button onClick={dismiss} className="text-rose-400 shrink-0"><X size={15} /></button>
        </div>
      </div>
    );
  }

  return null;
}
