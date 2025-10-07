-- =====================================================
-- SECURITY FIX: Add Explicit DENY Policies for Unauthenticated Access
-- =====================================================
-- This migration adds explicit DENY policies to prevent any unauthenticated
-- access to sensitive tables containing personal and financial data.
--
-- Tables affected:
-- 1. orders - Contains customer names, phone numbers, delivery addresses
-- 2. profiles - Contains emails, phone numbers, addresses, payment references
-- 3. premium_payments - Contains payment amounts and transaction data
-- =====================================================

-- ===========================================
-- 1. ORDERS TABLE - Deny unauthenticated access
-- ===========================================
-- Drop existing deny policy if it exists (idempotent)
DROP POLICY IF EXISTS "Deny all access to unauthenticated users" ON public.orders;

-- Create explicit DENY policy for unauthenticated users
-- This policy has the highest priority and blocks ALL operations for non-authenticated users
CREATE POLICY "Deny all access to unauthenticated users"
ON public.orders
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- ===========================================
-- 2. PROFILES TABLE - Strengthen deny policy
-- ===========================================
-- The existing "Deny anonymous access to profiles" policy uses 'false' which may not be effective
-- Let's drop it and replace with a more explicit auth check
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Create explicit DENY policy for unauthenticated users
CREATE POLICY "Deny all access to unauthenticated users on profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- ===========================================
-- 3. PREMIUM_PAYMENTS TABLE - Deny unauthenticated access
-- ===========================================
-- Drop existing deny policy if it exists (idempotent)
DROP POLICY IF EXISTS "Deny all access to unauthenticated users on payments" ON public.premium_payments;

-- Create explicit DENY policy for unauthenticated users
CREATE POLICY "Deny all access to unauthenticated users on payments"
ON public.premium_payments
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- ===========================================
-- VERIFICATION COMMENTS
-- ===========================================
-- These RESTRICTIVE policies work alongside existing permissive policies.
-- The auth.uid() IS NOT NULL check ensures that:
-- 1. All requests MUST have a valid authenticated session
-- 2. Even if other policies allow access, this one gates everything
-- 3. No bypass is possible without authentication
--
-- Existing policies for customers, sellers, and superadmins will continue
-- to work normally for authenticated users.
-- ===========================================