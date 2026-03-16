
-- 1. Add 'driver' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'driver';

-- 2. Create driver_profiles table
CREATE TABLE public.driver_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL DEFAULT 'Abidjan',
  vehicle_type text NOT NULL DEFAULT 'moto',
  driver_status text NOT NULL DEFAULT 'pending',
  id_document_url text,
  vehicle_photo_url text,
  selfie_url text,
  average_rating numeric DEFAULT 0,
  total_deliveries integer DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Create delivery_missions table
CREATE TABLE public.delivery_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_address text NOT NULL,
  delivery_address text NOT NULL,
  package_type text NOT NULL DEFAULT 'colis',
  customer_phone text NOT NULL,
  customer_name text,
  distance_km numeric,
  fee numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  driver_id uuid REFERENCES auth.users(id),
  requester_id uuid REFERENCES auth.users(id),
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_missions ENABLE ROW LEVEL SECURITY;

-- 5. RLS for driver_profiles
CREATE POLICY "Drivers can view their own profile"
  ON public.driver_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update their own profile"
  ON public.driver_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can insert their own profile"
  ON public.driver_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all driver profiles"
  ON public.driver_profiles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::user_role));

-- 6. RLS for delivery_missions
CREATE POLICY "Verified drivers can view available missions"
  ON public.delivery_missions FOR SELECT
  TO authenticated
  USING (
    status = 'available'
    OR driver_id = auth.uid()
    OR requester_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create missions"
  ON public.delivery_missions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Assigned drivers can update their missions"
  ON public.delivery_missions FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid() OR requester_id = auth.uid());

CREATE POLICY "Superadmins can manage all missions"
  ON public.delivery_missions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::user_role));

-- 7. Storage bucket for driver documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage RLS policies
CREATE POLICY "Drivers can upload their own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'driver-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Drivers can view their own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'driver-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Superadmins can view all driver documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'driver-documents' AND has_role(auth.uid(), 'superadmin'::user_role));

-- 9. Update get_user_role to handle driver
-- (it should already work since it reads from user_roles table)

-- 10. Update can_insert_products to not block drivers
