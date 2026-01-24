import { useState, useCallback } from 'react';
import { offersApi } from '@/lib/api';
import { CreateOfferDto, UpdateOfferDto } from '@/types/api';

export const useOffers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOffer = useCallback(async (data: CreateOfferDto) => {
    setLoading(true);
    setError(null);
    try {
      const response = await offersApi.create(data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل إنشاء العرض');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOffer = useCallback(async (id: string, data: UpdateOfferDto) => {
    setLoading(true);
    setError(null);
    try {
      const response = await offersApi.update(id, data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل تحديث العرض');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadMedia = useCallback(async (id: string, files: File[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await offersApi.uploadMedia(id, files);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل رفع الملفات');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createOffer,
    updateOffer,
    uploadMedia,
    clearError: () => setError(null),
  };
};