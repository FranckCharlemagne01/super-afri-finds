-- Add explicit policy to deny anonymous public access to profiles table
-- This prevents any potential loopholes that could expose sensitive user data

CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR ALL 
TO anon
USING (false);