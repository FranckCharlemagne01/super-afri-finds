-- Part 1: Add new business roles to the existing enum
-- These need to be committed before being used
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin_business';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin_finance';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin_vendeurs';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin_marketing';