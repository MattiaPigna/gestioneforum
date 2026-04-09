// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webPush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')
    const VAPID_EMAIL   = Deno.env.get('VAPID_EMAIL') ?? 'mattiapignatiel@gmail.com'

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return new Response(
        JSON.stringify({ error: 'VAPID secrets non configurati su Supabase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    webPush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC, VAPID_PRIVATE)

    const body = await req.json()
    const { title, pushbody, url = '/', assegnatario } = { pushbody: body.body, ...body }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let subscriptions: { id: string; subscription: any }[] = []

    if (assegnatario) {
      const { data: socio } = await supabase
        .from('soci').select('id').eq('nome', assegnatario).maybeSingle()
      if (socio) {
        const { data } = await supabase
          .from('push_subscriptions').select('id, subscription').eq('socio_id', socio.id)
        subscriptions = data ?? []
      }
    } else {
      const { data } = await supabase
        .from('push_subscriptions').select('id, subscription')
      subscriptions = data ?? []
    }

    // Salva sempre la notifica in tabella (visibile nella campanella in-app)
    await supabase.from('notifiche').insert([{ titolo: title, corpo: pushbody, url }])

    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, info: 'Nessuna subscription trovata' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = JSON.stringify({ title, body: pushbody, url })
    const toDelete: string[] = []
    let sent = 0

    await Promise.allSettled(
      subscriptions.map(async (row) => {
        try {
          await webPush.sendNotification(row.subscription, payload)
          sent++
        } catch (e: any) {
          if (e.statusCode === 410 || e.statusCode === 404) toDelete.push(row.id)
        }
      })
    )

    if (toDelete.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', toDelete)
    }

    return new Response(
      JSON.stringify({ sent, total: subscriptions.length, deleted: toDelete.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
