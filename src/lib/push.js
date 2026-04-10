import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// log: callback opzionale per mostrare lo stato nell'UI
export async function initPush(socioId, log = () => {}) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    log('Push non supportato su questo browser');
    return 'unsupported';
  }
  if (!VAPID_PUBLIC_KEY) {
    log('VAPID_PUBLIC_KEY mancante — controlla variabili Vercel');
    return 'unsupported';
  }

  log('Richiesta permesso notifiche...');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    log('Permesso negato');
    return permission;
  }

  try {
    log('Attesa Service Worker...');
    const registration = await navigator.serviceWorker.ready;

    log('Creazione subscription push...');
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    log('Salvataggio subscription su DB...');
    const sub = subscription.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert(
      { socio_id: socioId, endpoint: sub.endpoint, subscription: sub },
      { onConflict: 'endpoint' }
    );

    if (error) {
      log('Errore DB: ' + error.message);
      return 'db-error';
    }

    log('Notifiche attivate!');
    return 'granted';
  } catch (e) {
    log('Errore: ' + e.message);
    return 'error';
  }
}

export function getPushPermissionState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// assegnatario: nome socio (string) → solo a lui | null → a tutti
export async function sendPush({ title, body, url = '/', assegnatario = null }) {
  // Salva nella tabella notifiche (campanella in-app) — indipendente dalla push
  supabase.from('notifiche').insert([{ titolo: title, corpo: body, url }]).then(({ error }) => {
    if (error) console.warn('[notifiche] insert error:', error.message);
  });

  // Invia push tramite Edge Function
  try {
    await supabase.functions.invoke('send-push', {
      body: { title, body, url, assegnatario },
    });
  } catch (e) {
    console.warn('[push] send error:', e);
  }
}
