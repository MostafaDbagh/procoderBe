const Stripe = require("stripe");
const Payment = require("../models/Payment");
const Enrollment = require("../models/Enrollment");

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

async function upsertPaymentFromIntent({
  paymentIntentId,
  amountCents,
  currency,
  enrollmentId,
  checkoutSessionId,
  customerId,
  status,
}) {
  const doc = {
    enrollment: enrollmentId,
    amountCents,
    currency: (currency || "usd").toUpperCase(),
    stripePaymentIntentId: paymentIntentId || undefined,
    stripeCheckoutSessionId: checkoutSessionId || undefined,
    stripeCustomerId: customerId,
    status,
    description: "Stripe payment",
  };

  if (paymentIntentId) {
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntentId },
      { $set: doc },
      { upsert: true, new: true }
    );
  } else if (checkoutSessionId) {
    await Payment.findOneAndUpdate(
      { stripeCheckoutSessionId: checkoutSessionId },
      { $set: doc },
      { upsert: true, new: true }
    );
  }
}

/**
 * POST /api/webhooks/stripe — raw body required (registered in createApp before express.json).
 */
exports.handleStripeWebhook = async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();

  if (!secret || !stripe) {
    return res
      .status(503)
      .json({ message: "Stripe webhook not configured on server" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).json({ message: "Missing stripe-signature" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid payload";
    return res.status(400).send(`Webhook Error: ${msg}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const enrollmentId = session.metadata?.enrollmentId;
        if (!enrollmentId) break;
        const pi =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        const amountCents = session.amount_total ?? 0;
        const currency = session.currency || "usd";
        await upsertPaymentFromIntent({
          paymentIntentId: pi,
          amountCents,
          currency,
          enrollmentId,
          checkoutSessionId: session.id,
          customerId:
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id,
          status: "succeeded",
        });
        await Enrollment.findByIdAndUpdate(enrollmentId, {
          status: "confirmed",
        });
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const enrollmentId = pi.metadata?.enrollmentId;
        if (!enrollmentId) break;
        await upsertPaymentFromIntent({
          paymentIntentId: pi.id,
          amountCents: pi.amount_received ?? pi.amount ?? 0,
          currency: pi.currency || "usd",
          enrollmentId,
          checkoutSessionId: undefined,
          customerId:
            typeof pi.customer === "string" ? pi.customer : pi.customer?.id,
          status: "succeeded",
        });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!piId) break;
        const refunded = charge.amount_refunded ?? 0;
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: piId },
          {
            $set: {
              refundedCents: refunded,
              status:
                refunded >= (charge.amount || 0)
                  ? "refunded"
                  : "partially_refunded",
            },
          }
        );
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe webhook]", e);
    return res.status(500).json({ message: "Webhook handler error" });
  }

  res.json({ received: true });
};
