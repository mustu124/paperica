import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";

let instance: Razorpay | null = null;

/** Lazily created so builds don't fail when Razorpay keys are absent. */
export function getRazorpay() {
  if (!instance) {
    instance = new Razorpay({
      // The key id is public (Checkout needs it in the browser); only the secret is private.
      // RAZORPAY_KEY_ID is optional and, if set, must equal NEXT_PUBLIC_RAZORPAY_KEY_ID.
      key_id: (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return instance;
}

function hmacMatches(payload: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Verifies the signature returned by Razorpay Checkout after payment. */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  return hmacMatches(
    `${params.orderId}|${params.paymentId}`,
    params.signature,
    process.env.RAZORPAY_KEY_SECRET!,
  );
}

/** Verifies the X-Razorpay-Signature header on webhook requests (raw body). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  return hmacMatches(
    rawBody,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET!,
  );
}
