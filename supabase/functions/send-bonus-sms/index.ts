const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SANDBOX_URL = 'https://api.sandbox.africastalking.com/version1/messaging/bulk'
const LIVE_URL = 'https://api.africastalking.com/version1/messaging/bulk'

// Set to 'sandbox' for testing, change to your real username for production
const AT_USERNAME = 'sandbox'
const SENDER_ID = 'DJASSA'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const API_KEY = Deno.env.get('AFRICASTALKING_API_KEY')
    if (!API_KEY) {
      throw new Error('AFRICASTALKING_API_KEY is not configured')
    }

    let body: Record<string, unknown> = {}
    try {
      body = await req.json()
    } catch (e) {
      console.error('[send-bonus-sms] Erreur parsing JSON:', e)
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('[send-bonus-sms] BODY REÇU:', JSON.stringify(body))

    const { bonus_id, seller_id, expires_at, phone } = body as {
      bonus_id?: string
      seller_id?: string
      expires_at?: string
      phone?: string
    }

    if (!seller_id) {
      return new Response(JSON.stringify({ error: 'Missing seller_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!expires_at) {
      return new Response(JSON.stringify({ error: 'Missing expires_at' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Resolve phone number: use provided or fetch from profile
    let phoneNumber = phone
    if (!phoneNumber) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', seller_id)
        .single()

      phoneNumber = profile?.phone
    }

    if (!phoneNumber) {
      console.warn('[send-bonus-sms] No phone number found for seller:', seller_id)
      return new Response(JSON.stringify({ error: 'No phone number', skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Format expiry date
    const expiryDate = new Date(expires_at).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    const message = `🎉 Bonus Djassa reçu ! Publiez gratuitement 🚀\n⏳ Valable jusqu'au ${expiryDate}`

    // Determine endpoint based on username
    const endpoint = AT_USERNAME === 'sandbox' ? SANDBOX_URL : LIVE_URL

    console.log('[send-bonus-sms] Sending SMS to:', phoneNumber, 'via', endpoint)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': API_KEY,
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        message,
        to: phoneNumber,
        from: SENDER_ID,
      }),
    })

    const responseText = await response.text()
    console.log('[send-bonus-sms] AT response:', responseText)

    let data: unknown
    try { data = JSON.parse(responseText) } catch { data = responseText }

    if (!response.ok) {
      throw new Error(`Africa's Talking API error [${response.status}]: ${responseText}`)
    }

    return new Response(JSON.stringify({ success: true, data, bonus_id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('[send-bonus-sms] Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
