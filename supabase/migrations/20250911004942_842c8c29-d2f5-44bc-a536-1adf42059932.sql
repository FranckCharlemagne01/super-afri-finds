-- Enable Row Level Security on admin_statistics table
ALTER TABLE public.admin_statistics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only superadmins to view admin statistics
CREATE POLICY "Only superadmins can view admin statistics" 
ON public.admin_statistics 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::user_role));

-- Create policy to allow only superadmins to insert admin statistics (if needed for future functionality)
CREATE POLICY "Only superadmins can insert admin statistics" 
ON public.admin_statistics 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'superadmin'::user_role));

-- Create policy to allow only superadmins to update admin statistics (if needed for future functionality)
CREATE POLICY "Only superadmins can update admin statistics" 
ON public.admin_statistics 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::user_role));