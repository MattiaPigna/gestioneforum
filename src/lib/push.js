import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// Chiede il permesso e salva la subscription su Supabase.
// Ritorna 'granted' | 'denied' | 'unsupported'
export async function initPush(socioId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  if (!VAPID_PUBLIC_KEY) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const sub = subscription.toJSON();
    await supabase.from('push_subscriptions').upsert(
      { socio_id: socioId, endpoint: sub.endpoint, subscription: sub },
      { onConflict: 'endpoint' }
    );
  } catch (e) {
    console.warn('[push] subscription error:', e);
  }

  return 'granted';
}

// Controlla se il permesso è stato revocato dopo averlo già concesso
export function getPushPermissionState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

// Invia una notifica push tramite la Edge Function Supabase.
// assegnatario: nome del socio assegnato (string) oppure null → invia a tutti
export async function sendPush({ title, body, url = '/', assegnatario = null }) {
  try {
    await supabase.functions.invoke('send-push', {
      body: { title, body, url, assegnatario },
    });
  } catch (e) {
    console.warn('[push] send error:', e);
  }
}
