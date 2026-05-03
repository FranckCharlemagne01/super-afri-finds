import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Convert international phone to local format
// Extensible: add more country codes as needed
const COUNTRY_PREFIXES: Record<string, string> = {
  '+225': '0', // Côte d'Ivoire
  '+233': '0', // Ghana
  '+234': '0', // Nigeria
  '+221': '0', // Sénégal
}

function toLocalPhone(phone: string): string {
  for (const [prefix, local] of Object.entries(COUNTRY_PREFIXES)) {
    if (phone.startsWith(prefix)) {
      return local + phone.slice(prefix.length)
    }
  }
  return phone
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // SECURITY: validate shared webhook secret if configured
    const expectedSecret = Deno.env.get('AT_WEBHOOK_SECRET')
    if (expectedSecret) {
      const providedSecret = new URL(req.url).searchParams.get('secret') || req.headers.get('x-webhook-secret')
      if (providedSecret !== expectedSecret) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      console.warn('[sms-status] AT_WEBHOOK_SECRET not configured — webhook unprotected')
    }
    const contentType = req.headers.get('content-type') || ''
    let phoneNumber: string | null = null
    let status: string | null = null
    let messageId: string | null = null

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData()
      phoneNumber = formData.get('phoneNumber') as string
      status = formData.get('status') as string
      messageId = formData.get('id') as string
    } else {
      const body = await req.json()
      phoneNumber = body.phoneNumber
      status = body.status
      messageId = body.id || body.messageId
    }

    console.log('[sms-status] Delivery report received:', { phoneNumber, status, messageId })

    if (!phoneNumber || !status) {
      return new Response(JSON.stringify({ error: 'Missing phoneNumber or status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Convert to local format for DB lookup
    const localPhone = toLocalPhone(phoneNumber)
    console.log('[sms-status] Converted phone:', phoneNumber, '→', localPhone)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const smsStatus = status === 'Success' ? 'delivered' : 'failed'

    // Find user by phone in driver_profiles, select id
    const { data: profile, error: profileError } = await supabase
      .from('driver_profiles')
      .select('id')
      .eq('phone', localPhone)
      .single()

    console.log('[sms-status] Profile lookup result:', { profile, profileError })

    if (profile) {
      const { error, count } = await supabase
        .from('publication_bonuses')
        .update({ sms_status: smsStatus })
        .eq('seller_id', profile.id)
        .eq('sms_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('[sms-status] Update error:', error)
      } else {
        console.log('[sms-status] Updated sms_status to', smsStatus, 'for seller', profile.id, 'rows affected:', count)
      }
    } else {
      console.warn('[sms-status] No profile found for phone:', localPhone)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('[sms-status] Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
