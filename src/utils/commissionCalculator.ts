/**
 * Système de commission Djassa
 * La commission est basée sur le type de vendeur (Particulier, Pro, Premium)
 */

export type SellerType = 'particulier' | 'pro' | 'premium';

interface SellerCommissionTier {
  type: SellerType;
  label: string;
  rate: number;
  maxProducts: number | null;
  monthlyFee: number;
}

export const SELLER_COMMISSION_TIERS: SellerCommissionTier[] = [
  { type: 'particulier', label: 'Particulier', rate: 15, maxProducts: 10, monthlyFee: 0 },
  { type: 'pro', label: 'Pro', rate: 10, maxProducts: 100, monthlyFee: 10000 },
  { type: 'premium', label: 'Premium', rate: 5, maxProducts: null, monthlyFee: 25000 },
];

/** Commission minimum en FCFA */
export const MIN_COMMISSION_FCFA = 200;

/** Délai de validation de la commission (48 heures en ms) */
export const COMMISSION_VALIDATION_DELAY_MS = 48 * 60 * 60 * 1000;

export interface CommissionInfo {
  /** Taux de commission en % */
  rate: number;
  /** Montant de la commission en FCFA */
  commissionAmount: number;
  /** Gain net du vendeur en FCFA */
  sellerGain: number;
  /** Prix total du produit (prix × quantité) */
  totalPrice: number;
}

/**
 * Retourne le taux de commission selon le type de vendeur
 */
export function getCommissionRateBySellerType(sellerType: SellerType = 'particulier'): number {
  const tier = SELLER_COMMISSION_TIERS.find(t => t.type === sellerType);
  return tier ? tier.rate : 15;
}

/**
 * Calcule la commission Djassa pour un produit
 * @param unitPrice Prix unitaire du produit
 * @param quantity Quantité (défaut: 1)
 * @param sellerType Type de vendeur (défaut: 'particulier')
 */
export function calculateCommission(unitPrice: number, quantity: number = 1, sellerType: SellerType = 'particulier'): CommissionInfo {
  const rate = getCommissionRateBySellerType(sellerType);
  const totalPrice = unitPrice * quantity;
  const rawCommission = Math.round(totalPrice * rate / 100);
  const commissionAmount = Math.max(rawCommission, MIN_COMMISSION_FCFA);
  const sellerGain = totalPrice - commissionAmount;

  return { rate, commissionAmount, sellerGain, totalPrice };
}

export type CommissionStatus = 'pending' | 'validated' | 'cancelled' | 'refunded';

/**
 * Détermine le statut de la commission basé sur le statut de la commande et la date de confirmation
 */
export function getCommissionStatus(
  orderStatus: string,
  isConfirmedBySeller: boolean | undefined,
  updatedAt: string
): CommissionStatus {
  if (orderStatus === 'cancelled') return 'refunded';
  
  if (isConfirmedBySeller && orderStatus === 'delivered') {
    const confirmedTime = new Date(updatedAt).getTime();
    const now = Date.now();
    if (now - confirmedTime >= COMMISSION_VALIDATION_DELAY_MS) {
      return 'validated';
    }
  }
  
  return 'pending';
}

/**
 * Retourne le label et les couleurs pour un statut de commission
 */
export function getCommissionStatusDisplay(status: CommissionStatus) {
  switch (status) {
    case 'validated':
      return {
        label: 'Validée',
        icon: '🟢',
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        borderColor: 'border-emerald-500/30',
      };
    case 'cancelled':
      return {
        label: 'Annulée',
        icon: '❌',
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-500/30',
      };
    case 'refunded':
      return {
        label: 'Remboursée',
        icon: '🔄',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-700 dark:text-blue-400',
        borderColor: 'border-blue-500/30',
      };
    case 'pending':
    default:
      return {
        label: 'En attente (48h)',
        icon: '🟠',
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-700 dark:text-amber-400',
        borderColor: 'border-amber-500/30',
      };
  }
}

/**
 * Formate un montant en FCFA
 */
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
}

/** Retourne les infos de tous les types de vendeurs */
export function getSellerTiers() {
  return SELLER_COMMISSION_TIERS;
}

/** Retourne le tier d'un type de vendeur */
export function getSellerTier(sellerType: SellerType) {
  return SELLER_COMMISSION_TIERS.find(t => t.type === sellerType) || SELLER_COMMISSION_TIERS[0];
}
