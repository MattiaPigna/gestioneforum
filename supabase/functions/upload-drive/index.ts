// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/* Genera un access token OAuth2 da service account usando JWT */
async function getAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const b64url = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const header  = b64url({ alg: 'RS256', typ: 'JWT' })
  const payload = b64url({
    iss:  sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud:  'https://oauth2.googleapis.com/token',
    exp:  now + 3600,
    iat:  now,
  })

  const signingInput = `${header}.${payload}`

  // Parse PEM private key (PKCS#8 or traditional RSA)
  const pem = sa.private_key.replace(/\\n/g, '\n')
  const pemBody = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const derBuf   = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8',
    derBuf.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  )

  const sig64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const jwt = `${signingInput}.${sig64}`

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })

  const data = await resp.json()
  if (!data.access_token) throw new Error(`OAuth error: ${JSON.stringify(data)}`)
  return data.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
    const folderId           = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')

    if (!serviceAccountJson || !folderId) {
      return new Response(
        JSON.stringify({ error: 'Variabili GOOGLE_SERVICE_ACCOUNT e GOOGLE_DRIVE_FOLDER_ID non configurate in Supabase Secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const sa = JSON.parse(serviceAccountJson)
    const accessToken = await getAccessToken(sa)

    // Ricevi il file via multipart
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Nessun file trovato nella richiesta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const metadata = { name: file.name, parents: [folderId] }

    const uploadBody = new FormData()
    uploadBody.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    uploadBody.append('file', file)

    const uploadResp = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size,mimeType',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: uploadBody,
      },
    )

    const uploaded = await uploadResp.json()
    if (!uploadResp.ok) {
      throw new Error(uploaded.error?.message || 'Upload Drive fallito')
    }

    // Rendi il file leggibile da chiunque abbia il link
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploaded.id}/permissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    })

    return new Response(
      JSON.stringify({
        driveId:  uploaded.id,
        name:     uploaded.name,
        link:     uploaded.webViewLink,
        size:     uploaded.size,
        mimeType: uploaded.mimeType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
