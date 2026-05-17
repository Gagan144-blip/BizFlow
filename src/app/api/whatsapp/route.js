// ─── WhatsApp via Twilio has been removed ────────────────────────────────────
// The billing page now uses the free wa.me deep-link approach instead.
// Clicking "Share on WhatsApp" opens WhatsApp Web / the WhatsApp app directly
// with the customer phone number and the full bill pre-filled.
// No API key, no Twilio account, no cost — just works.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST() {
  return Response.json(
    {
      success: false,
      message:
        "Twilio WhatsApp removed. Use the wa.me deep-link on the billing page instead.",
    },
    { status: 410 },
  );
}
