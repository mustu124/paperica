import "server-only";

/**
 * Hook for transactional notifications, called once when an order becomes paid.
 * Paperica sends no marketing email/SMS. To add an order-confirmation email later,
 * load the order here (createAdminClient) and send it with your provider (e.g. Resend),
 * keeping the provider's API key in env and all wording in site_settings.
 * Errors must not throw: payment confirmation should never fail because an email did.
 */
export async function onOrderPaid(orderId: string): Promise<void> {
  try {
    console.info(`[notifications] order ${orderId} paid (no transactional email configured)`);
  } catch (e) {
    console.error("[notifications] onOrderPaid failed:", (e as Error).message);
  }
}

