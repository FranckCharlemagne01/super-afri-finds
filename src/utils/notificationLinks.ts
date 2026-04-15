/**
 * Resolves a notification type + optional reference to a valid app route.
 * Keeps all routing logic in one place so notification creators
 * never hardcode URLs that may not exist.
 *
 * IMPORTANT: The `link` field stored in the DB is IGNORED by the frontend.
 * Links are always reconstructed dynamically from type + reference_id.
 */

type NotificationType =
  | 'new_order'
  | 'order_status'
  | 'order_shipped'
  | 'order_delivered'
  | 'new_message'
  | 'payment'
  | 'shop'
  | 'promo'
  | 'alert'
  | 'product'
  | string;

/**
 * Returns the correct frontend route for a given notification type.
 * @param type        - notification type stored in the DB
 * @param referenceId - optional entity id (order id, sender id, product id, shop slug…)
 */
export function getNotificationLink(type: NotificationType, referenceId?: string | null): string {
  switch (type) {
    // ── Orders ──────────────────────────────────────
    case 'new_order':
      return referenceId
        ? `/seller-dashboard?tab=orders&highlight=${referenceId}`
        : '/seller-dashboard?tab=orders';

    case 'order_status':
    case 'order_shipped':
    case 'order_delivered':
      return referenceId
        ? `/my-orders?highlight=${referenceId}`
        : '/my-orders';

    // ── Messages ────────────────────────────────────
    case 'new_message':
      return referenceId
        ? `/messages?conversation=${referenceId}`
        : '/messages';

    // ── Products ────────────────────────────────────
    case 'product':
      return referenceId ? `/product/${referenceId}` : '/categories';

    // ── Shop ────────────────────────────────────────
    case 'shop':
      return referenceId ? `/boutique/${referenceId}` : '/categories';

    // ── Payment ─────────────────────────────────────
    case 'payment':
      return '/seller-dashboard?tab=wallet';

    // ── Promo / alerts ──────────────────────────────
    case 'promo':
      return '/flash-sales';

    case 'alert':
      return '/support';

    // ── Fallback ────────────────────────────────────
    default:
      return '/';
  }
}
