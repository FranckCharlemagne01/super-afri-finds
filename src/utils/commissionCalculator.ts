/**
 * Système de commission progressive Djassa
 * La commission est basée sur le prix unitaire du produit
 */

interface CommissionTier {
  min: number;
  max: number;
  rate: number; // percentage
}

const COMMISSION_TIERS: CommissionTier[] = [
  { min: 1000, max: 10000, rate: 5 },
  { min: 10001, max: 15000, rate: 6 },
  { min: 15001, max: 20000, rate: 8 },
  { min: 20001, max: 30000, rate: 10 },
  { min: 30001, max: 50000, rate: 12 },
  { min: 50001, max: 80000, rate: 15 },
  { min: 80001, max: 100000, rate: 18 },
  { min: 100001, max: Infinity, rate: 20 },
];

// Délai de validation de la commission (48 heures en ms)
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
 * Calcule la commission Djassa pour un produit
 * @param unitPrice Prix unitaire du produit
 * @param quantity Quantité (défaut: 1)
 */
export function calculateCommission(unitPrice: number, quantity: number = 1): CommissionInfo {
  const tier = COMMISSION_TIERS.find(t => unitPrice >= t.min && unitPrice <= t.max);
  const rate = tier ? tier.rate : unitPrice < 1000 ? 5 : 20;
  const totalPrice = unitPrice * quantity;
  const commissionAmount = Math.round(totalPrice * rate / 100);
  const sellerGain = totalPrice - commissionAmount;

  return { rate, commissionAmount, sellerGain, totalPrice };
}

export type CommissionStatus = 'pending' | 'validated' | 'cancelled';

/**
 * Détermine le statut de la commission basé sur le statut de la commande et la date de confirmation
 */
export function getCommissionStatus(
  orderStatus: string,
  isConfirmedBySeller: boolean | undefined,
  updatedAt: string
): CommissionStatus {
  if (orderStatus === 'cancelled') return 'cancelled';
  
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
        icon: '✅',
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
    case 'pending':
    default:
      return {
        label: 'En attente (48h)',
        icon: '⏳',
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

/** Retourne tous les paliers de commission */
export function getCommissionTiers() {
  return COMMISSION_TIERS;
}
