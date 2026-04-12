import { supabase } from './supabase';

// ── Livelli ───────────────────────────────────────────────────────────────────
export const LIVELLI = [
  { min: 0,    max: 99,       nome: 'Nuovo membro', emoji: '🌱', colorBg: 'bg-slate-100',  colorText: 'text-slate-600'  },
  { min: 100,  max: 299,      nome: 'Attivista',    emoji: '⚡', colorBg: 'bg-blue-100',   colorText: 'text-blue-700'   },
  { min: 300,  max: 699,      nome: 'Protagonista', emoji: '🔥', colorBg: 'bg-orange-100', colorText: 'text-orange-700' },
  { min: 700,  max: 1499,     nome: 'Veterano',     emoji: '🏅', colorBg: 'bg-violet-100', colorText: 'text-violet-700' },
  { min: 1500, max: Infinity, nome: 'Leggenda',     emoji: '🏆', colorBg: 'bg-amber-100',  colorText: 'text-amber-700'  },
];

// ── Badge ─────────────────────────────────────────────────────────────────────
export const BADGES = {
  primo_passo:   { id: 'primo_passo',   emoji: '🎯', nome: 'Primo Passo',      desc: 'Prima task completata' },
  on_fire:       { id: 'on_fire',       emoji: '🔥', nome: 'On Fire',          desc: '5 task completate in 7 giorni' },
  fulmine:       { id: 'fulmine',       emoji: '⚡', nome: 'Fulmine',          desc: 'Task completata in meno di 24h' },
  voce_forum:    { id: 'voce_forum',    emoji: '🗣️', nome: 'Voce del Forum',   desc: '20 commenti scritti' },
  capo_progetto: { id: 'capo_progetto', emoji: '🏆', nome: 'Capo Progetto',    desc: 'Primo progetto completato' },
  economo:       { id: 'economo',       emoji: '💰', nome: 'Economo',          desc: 'Progetto completato sotto budget' },
};

// ── Utility ───────────────────────────────────────────────────────────────────
export function getLivello(xp) {
  let result = LIVELLI[0];
  for (const l of LIVELLI) { if (xp >= l.min) result = l; }
  return result;
}

export function getProgressoLivello(xp) {
  const idx = LIVELLI.findIndex(l => xp >= l.min && (l.max === Infinity || xp <= l.max));
  if (idx === -1 || LIVELLI[idx].max === Infinity) return 100;
  const { min } = LIVELLI[idx];
  const nextMin = LIVELLI[idx + 1].min;
  return Math.min(99, Math.round(((xp - min) / (nextMin - min)) * 100));
}

// ── Core: award XP ────────────────────────────────────────────────────────────
// Returns array of newly unlocked badge IDs (empty if none)
export async function awardXP(socioId, azione, punti, refId = null) {
  if (!socioId) return [];
  await supabase.from('xp_log').insert([{ socio_id: socioId, azione, punti, ref_id: refId }]);
  return _checkBadges(socioId);
}

// Award a badge directly (capo_progetto, economo etc.)
// Returns true if newly awarded, false if already had it
export async function awardBadge(socioId, badgeId) {
  if (!socioId || !badgeId) return false;
  const { data: existing } = await supabase
    .from('badge_sbloccati').select('id').eq('socio_id', socioId).eq('badge_id', badgeId).maybeSingle();
  if (existing) return false;
  await supabase.from('badge_sbloccati').insert([{ socio_id: socioId, badge_id: badgeId }]);
  return true;
}

// ── Internal badge checker ────────────────────────────────────────────────────
async function _checkBadges(socioId) {
  const { data: existing } = await supabase
    .from('badge_sbloccati').select('badge_id').eq('socio_id', socioId);
  const have = new Set((existing || []).map(b => b.badge_id));
  const newBadges = [];

  // 🎯 Primo Passo: prima task completata
  if (!have.has('primo_passo')) {
    const { count } = await supabase.from('xp_log')
      .select('*', { count: 'exact', head: true })
      .eq('socio_id', socioId).eq('azione', 'task_completata');
    if ((count || 0) >= 1) newBadges.push('primo_passo');
  }

  // 🔥 On Fire: 5 task completate in 7 giorni
  if (!have.has('on_fire')) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase.from('xp_log')
      .select('*', { count: 'exact', head: true })
      .eq('socio_id', socioId).eq('azione', 'task_completata').gte('created_at', weekAgo);
    if ((count || 0) >= 5) newBadges.push('on_fire');
  }

  // ⚡ Fulmine: task completata in meno di 24h
  if (!have.has('fulmine')) {
    const { count } = await supabase.from('xp_log')
      .select('*', { count: 'exact', head: true })
      .eq('socio_id', socioId).eq('azione', 'task_24h');
    if ((count || 0) >= 1) newBadges.push('fulmine');
  }

  // 🗣️ Voce del Forum: 20 commenti
  if (!have.has('voce_forum')) {
    const { count } = await supabase.from('xp_log')
      .select('*', { count: 'exact', head: true })
      .eq('socio_id', socioId).eq('azione', 'commento_scritto');
    if ((count || 0) >= 20) newBadges.push('voce_forum');
  }

  if (newBadges.length > 0) {
    await supabase.from('badge_sbloccati').insert(newBadges.map(badge_id => ({ socio_id: socioId, badge_id })));
  }

  return newBadges;
}
