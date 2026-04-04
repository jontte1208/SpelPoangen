import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { recordConversion } from "@/services/affiliate-tracking";
import { prisma } from "@/lib/prisma";
import { syncUserTierRole } from "@/lib/discord-bot";

export const maxDuration = 30;

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

async function handleSubscriptionActivated(
  customerId: string,
  subscriptionId: string,
  priceId: string
) {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true, discordId: true },
  });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tier: "PREMIUM",
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
    },
  });

  if (user.discordId) {
    await syncUserTierRole(user.id, "PREMIUM").catch(() => {});
  }
}

async function handleSubscriptionCanceled(customerId: string) {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true, discordId: true },
  });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tier: "FREE",
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });

  if (user.discordId) {
    await syncUserTierRole(user.id, "FREE").catch(() => {});
  }
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.customer && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await handleSubscriptionActivated(
          session.customer as string,
          sub.id,
          sub.items.data[0].price.id
        );
      }
      // affiliate conversion tracking
      const { userId, productId } = session.metadata ?? {};
      if (userId && productId && session.payment_intent) {
        await recordConversion(productId, userId, session.payment_intent as string);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      if (sub.status === "active") {
        await handleSubscriptionActivated(
          sub.customer as string,
          sub.id,
          sub.items.data[0].price.id
        );
      } else if (sub.status === "canceled" || sub.status === "unpaid") {
        await handleSubscriptionCanceled(sub.customer as string);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionCanceled(sub.customer as string);
      break;
    }

    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const { userId, productId } = intent.metadata ?? {};
      if (userId && productId) {
        await recordConversion(productId, userId, intent.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
