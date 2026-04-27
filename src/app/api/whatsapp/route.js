import twilio from 'twilio'

export async function POST(req) {
  try {
    const body = await req.json()

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to:   `whatsapp:+91${body.phone}`,
      body: `
🧾 *BizFlow Invoice*
━━━━━━━━━━━━━━━
👤 Customer: ${body.customerName}
🏪 Shop: ${body.businessName}

📋 *Services:*
${body.services.map(s => `• ${s.type.replace(/_/g, ' ').toUpperCase()} × ${s.quantity} = ₹${s.price}`).join('\n')}

━━━━━━━━━━━━━━━
💰 *Total: ₹${body.total}*
━━━━━━━━━━━━━━━
Thank you for visiting! 🙏
      `
    })

    return Response.json({ success: true, sid: message.sid })
  } catch (err) {
    console.log('WhatsApp error:', err.message)
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}