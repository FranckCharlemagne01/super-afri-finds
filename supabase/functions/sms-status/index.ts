import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Africa's Talking sends delivery reports as application/x-www-form-urlencoded
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Map AT status to our sms_status
    const smsStatus = status === 'Success' ? 'delivered' : 'failed'

    // Find the seller by phone number, then update their latest bonus
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', phoneNumber)
      .single()

    if (profile) {
      const { error } = await supabase
        .from('publication_bonuses')
        .update({ sms_status: smsStatus })
        .eq('seller_id', profile.user_id)
        .eq('sms_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('[sms-status] Update error:', error)
      } else {
        console.log('[sms-status] Updated sms_status to', smsStatus, 'for seller', profile.user_id)
      }
    } else {
      console.warn('[sms-status] No profile found for phone:', phoneNumber)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('[sms-status] Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 200, // Always return 200 to AT to avoid retries
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
