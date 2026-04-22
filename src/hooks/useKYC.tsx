import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from './useStableAuth';

export type KYCStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';

export interface KYCState {
  status: KYCStatus;
  adminNote: string | null;
  createdAt: string | null;
  reviewedAt: string | null;
  loading: boolean;
}

export const useKYC = () => {
  const { userId } = useStableAuth();
  const [state, setState] = useState<KYCState>({
    status: 'none',
    adminNote: null,
    createdAt: null,
    reviewedAt: null,
    loading: true,
  });

  const fetchStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.rpc('get_kyc_status', { _user_id: userId });
      if (!error && data) {
        const d = data as any;
        setState({
          status: d.status as KYCStatus,
          adminNote: d.admin_note || null,
          createdAt: d.created_at || null,
          reviewedAt: d.reviewed_at || null,
          loading: false,
        });
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchStatus();
  }, [userId, fetchStatus]);

  const submitKYC = useCallback(async (
    selfieFile: File,
    idFrontFile: File,
    idBackFile: File
  ) => {
    if (!userId) return { success: false, error: 'Non connecté' };

    try {
      const uploadFile = async (file: File, type: string) => {
        const ext = file.name.split('.').pop();
        const path = `${userId}/${type}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from('kyc-documents')
          .upload(path, file, { upsert: true });
        if (error) throw error;
        return path;
      };

      const [selfiePath, frontPath, backPath] = await Promise.all([
        uploadFile(selfieFile, 'selfie'),
        uploadFile(idFrontFile, 'id-front'),
        uploadFile(idBackFile, 'id-back'),
      ]);

      // Check if user already has a KYC record (resubmission)
      const { data: existing } = await supabase
        .from('kyc_verifications')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('kyc_verifications')
          .update({
            selfie_url: selfiePath,
            id_front_url: frontPath,
            id_back_url: backPath,
            status: 'pending',
            admin_note: null,
            reviewed_at: null,
            reviewed_by: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('kyc_verifications')
          .insert({
            user_id: userId,
            selfie_url: selfiePath,
            id_front_url: frontPath,
            id_back_url: backPath,
          });
        if (error) throw error;
      }

      setState(s => ({ ...s, status: 'pending', adminNote: null }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [userId]);

  return {
    ...state,
    refresh: fetchStatus,
    submitKYC,
    isVerified: state.status === 'approved',
  };
};
