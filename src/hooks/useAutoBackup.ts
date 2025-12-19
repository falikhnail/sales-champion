import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'price-calc-auto-backup';
const BACKUP_DEBOUNCE_MS = 2000; // Wait 2 seconds after last change before backing up

export interface AutoBackupData {
  version: string;
  exportedAt: string;
  customers: any[];
  priceHistory: any[];
  customerPricingTiers: any[];
  products: any[];
  productRegions: any[];
}

export function useAutoBackup() {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performBackup = useCallback(async () => {
    try {
      const [customersRes, priceHistoryRes, tiersRes, productsRes, regionsRes] = await Promise.all([
        supabase.from("customers").select("*"),
        supabase.from("price_history").select("*"),
        supabase.from("customer_pricing_tiers").select("*"),
        (supabase as any).from("products").select("*"),
        (supabase as any).from("product_regions").select("*"),
      ]);

      if (customersRes.error || priceHistoryRes.error || tiersRes.error || productsRes.error || regionsRes.error) {
        console.error("Auto-backup fetch error");
        return;
      }

      const backupData: AutoBackupData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        customers: customersRes.data || [],
        priceHistory: priceHistoryRes.data || [],
        customerPricingTiers: tiersRes.data || [],
        products: productsRes.data || [],
        productRegions: regionsRes.data || [],
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(backupData));
      console.log("Auto-backup completed:", new Date().toLocaleString("id-ID"));
    } catch (error) {
      console.error("Auto-backup error:", error);
    }
  }, []);

  const scheduleBackup = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performBackup();
    }, BACKUP_DEBOUNCE_MS);
  }, [performBackup]);

  useEffect(() => {
    // Initial backup on mount
    performBackup();

    // Subscribe to realtime changes
    const customersChannel = supabase
      .channel('auto-backup-customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, scheduleBackup)
      .subscribe();

    const priceHistoryChannel = supabase
      .channel('auto-backup-price-history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'price_history' }, scheduleBackup)
      .subscribe();

    const tiersChannel = supabase
      .channel('auto-backup-tiers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_pricing_tiers' }, scheduleBackup)
      .subscribe();

    const productsChannel = supabase
      .channel('auto-backup-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, scheduleBackup)
      .subscribe();

    const regionsChannel = supabase
      .channel('auto-backup-regions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_regions' }, scheduleBackup)
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(priceHistoryChannel);
      supabase.removeChannel(tiersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(regionsChannel);
    };
  }, [performBackup, scheduleBackup]);

  const getLastBackup = useCallback((): AutoBackupData | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as AutoBackupData;
    } catch {
      return null;
    }
  }, []);

  const clearBackup = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    performBackup,
    getLastBackup,
    clearBackup,
  };
}
