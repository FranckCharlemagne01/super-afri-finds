/**
 * Resolves a notification type + optional reference to a valid app route.
 * Keeps all routing logic in one place so notification creators
 * never hardcode URLs that may not exist.
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
 * @param type  - notification type stored in the DB
 * @param referenceId - optional entity id (order id, product id, shop slug…)
 */
export function getNotificationLink(type: NotificationType, referenceId?: string): string {
  switch (type) {
    // ── Orders ──────────────────────────────────────
    case 'new_order':
      // Sellers receive this → go to seller dashboard orders tab
      return '/seller-dashboard?tab=orders';

    case 'order_status':
    case 'order_shipped':
    case 'order_delivered':
      // Buyers receive these → go to my orders
      return '/my-orders';

    // ── Messages ────────────────────────────────────
    case 'new_message':
      return '/messages';

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
