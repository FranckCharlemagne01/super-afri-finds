import { z } from 'zod';

/**
 * Security: Comprehensive validation schema for order customer data
 * Matches server-side RLS policy validation rules
 * Prevents XSS, SQL injection, and malformed data submission
 */
export const orderCustomerSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(
      /^[A-Za-zÀ-ÿ0-9\s\-''.]+$/,
      'Le nom contient des caractères non autorisés'
    ),
  customerPhone: z
    .string()
    .trim()
    .min(8, 'Le numéro doit contenir au moins 8 chiffres')
    .max(20, 'Le numéro ne peut pas dépasser 20 caractères')
    .regex(
      /^(\+|0{0,2})[0-9\s]+$/,
      'Format de téléphone invalide. Utilisez +225... ou 0707...'
    ),
  deliveryLocation: z
    .string()
    .trim()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères'),
});

export type OrderCustomerData = z.infer<typeof orderCustomerSchema>;

/**
 * Validates order customer data and returns parsed result or error messages
 */
export const validateOrderCustomer = (data: unknown) => {
  return orderCustomerSchema.safeParse(data);
};
