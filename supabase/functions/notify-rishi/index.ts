import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const payload = await req.json()

  // Webhook sends: { type, table, schema, record, old_record }
  const table = payload.table
  const record = payload.record

  let subject = ''
  let html = ''

  if (table === 'gate_requests') {
    subject = 'Portfolio access request'
    html = `
      <h2>New access request</h2>
      <p><strong>Email:</strong> ${record.email}</p>
      <p><strong>Requested:</strong> ${record.target || 'unknown'}</p>
      <p><strong>Time:</strong> ${record.created_at}</p>
    `
  } else if (table === 'contact_messages') {
    subject = 'New portfolio contact message'
    html = `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${record.name}</p>
      <p><strong>Email:</strong> ${record.email}</p>
      <p><strong>Message:</strong> ${record.message}</p>
      <p><strong>Time:</strong> ${record.created_at}</p>
    `
  } else {
    // Log full payload to help debug unknown table
    console.log('Unknown payload:', JSON.stringify(payload))
    return new Response('OK', { status: 200 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Portfolio <onboarding@resend.dev>',
      to: 'rishi.g.sharma@gmail.com',
      subject,
      html
    })
  })

  const data = await res.json()
  console.log('Resend response:', JSON.stringify(data))
  return new Response(JSON.stringify(data), { status: 200 })
})