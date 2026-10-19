// Checkout validation shared by the browser form and the API routes.
import { z } from "zod";
import { INDIAN_STATES } from "./states";

// Shared with the browser: skip zod's `new Function` probe, which the CSP (no 'unsafe-eval') reports.
z.config({ jitless: true });

/** Accepts "98765 43210", "+91 98765-43210", "098765..."; outputs 10 digits. */
export const indianMobile = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, "").replace(/^(?:\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(200)),
  phone: indianMobile,
  line1: z.string().trim().min(3, "Enter your address").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter your city").max(100),
  state: z.enum(INDIAN_STATES, { error: "Choose your state or union territory" }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  note: z.string().trim().max(500, "Please keep the note under 500 characters").optional().or(z.literal("")),
});

export type CustomerInput = z.input<typeof customerSchema>;
export type Customer = z.output<typeof customerSchema>;

/** Browser form = customer + policy consent (+ hidden honeypot). */
export const checkoutFormSchema = customerSchema.extend({
  agree: z.boolean().refine((v) => v, "Please accept the policies to continue"),
  website: z.string().optional(), // honeypot: must stay empty
});

export const cartItemSchema = z.object({
  productId: z.uuid(),
  variantId: z.uuid().nullable().optional(),
  qty: z.number().int().min(1).max(99),
});
export type CartItemInput = z.infer<typeof cartItemSchema>;

export const quoteRequestSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
});

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  customer: customerSchema,
  agree: z.literal(true),
  website: z.string().optional(),
  /** Total the customer saw; if prices changed meanwhile, the server asks them to review. */
  expectedTotal: z.number().nonnegative().optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(200),
});

export const trackOrderSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^PPR-\d{6,}$/, "Enter your order number, e.g. PPR-000123"),
  contact: z.string().trim().min(5, "Enter the mobile number or email used at checkout").max(200),
  website: z.string().optional(),
});
