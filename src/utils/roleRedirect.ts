import { supabase } from '@/integrations/supabase/client';

export type RedirectRole = 'buyer' | 'seller' | 'admin' | 'superadmin' | 'super_admin_business' | 'admin_finance' | 'admin_vendeurs' | 'admin_marketing' | 'partner' | 'driver';

/**
 * Fetches the user's role from user_roles table and returns the appropriate dashboard path.
 * Falls back to '/' if no role found.
 */
export async function getRedirectPathForUser(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('get_user_role', {
      _user_id: userId,
    });

    if (error) {
      console.error('[roleRedirect] Error fetching role:', error);
      return '/';
    }

    const role = (data || 'buyer') as RedirectRole;
    return getDashboardPath(role);
  } catch (err) {
    console.error('[roleRedirect] Exception:', err);
    return '/';
  }
}

/**
 * Returns the dashboard path for a given role.
 */
export function getDashboardPath(role: RedirectRole): string {
  switch (role) {
    case 'seller':
      return '/seller-dashboard';
    case 'superadmin':
    case 'super_admin_business':
    case 'admin':
    case 'admin_finance':
    case 'admin_vendeurs':
    case 'admin_marketing':
      return '/superadmin';
    case 'partner':
      return '/partner-dashboard';
    case 'buyer':
    default:
      return '/buyer-dashboard';
  }
}
