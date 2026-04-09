import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import webPush from 'npm:web-push'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { title, body, url = '/', assegnatario } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  webPush.setVapidDetails(
    `mailto:${Deno.env.get('VAPID_EMAIL') ?? 'admin@forum.it'}`,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  // Recupera le subscription da inviare
  let subscriptions: { id: string; subscription: any }[] = []

  if (assegnatario) {
    // Solo la subscription dell'assegnatario
    const { data: socio } = await supabase
      .from('soci')
      .select('id')
      .eq('nome', assegnatario)
      .maybeSingle()

    if (socio) {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id, subscription')
        .eq('socio_id', socio.id)
      subscriptions = data ?? []
    }
  } else {
    // Tutti gli iscritti
    const { data } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
    subscriptions = data ?? []
  }

  const payload = JSON.stringify({ title, body, url })
  const toDelete: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (row) => {
      try {
        await webPush.sendNotification(row.subscription, payload)
      } catch (e: any) {
        // Subscription scaduta o non valida → la eliminiamo
        if (e.statusCode === 410 || e.statusCode === 404) {
          toDelete.push(row.id)
        }
      }
    })
  )

  if (toDelete.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', toDelete)
  }

  return new Response(
    JSON.stringify({ sent: subscriptions.length - toDelete.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
