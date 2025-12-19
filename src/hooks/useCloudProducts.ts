import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/pricing";

type CloudProductRow = {
  id: string;
  name: string;
  base_price: number;
  unit: string;
  category?: string;
};

function rowToProduct(row: CloudProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "",
    basePrice: Number(row.base_price),
    unit: row.unit,
  };
}

export function useCloudProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // NOTE: types.ts is read-only and may lag behind migrations, so we cast.
      const { data, error: fetchError } = await (supabase as any)
        .from("products")
        .select("id,name,category,base_price,unit")
        .order("name");

      if (fetchError) throw fetchError;

      const mapped = ((data ?? []) as CloudProductRow[]).map(rowToProduct);
      setProducts(mapped);
    } catch (e: any) {
      console.error("Fetch products error:", e);
      setError(e?.message ?? "Gagal memuat produk");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = useCallback(async (product: Product) => {
    const id = product.id || crypto.randomUUID();

    const { error: insertError } = await (supabase as any)
      .from("products")
      .insert({
        id,
        name: product.name,
        category: product.category,
        base_price: product.basePrice,
        unit: product.unit,
      });

    if (insertError) throw insertError;

    // update local state
    setProducts((prev) => [{ ...product, id }, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
    return id;
  }, []);

  const updateProduct = useCallback(async (product: Product) => {
    const { error: updateError } = await (supabase as any)
      .from("products")
      .update({
        name: product.name,
        category: product.category,
        base_price: product.basePrice,
        unit: product.unit,
      })
      .eq("id", product.id);

    if (updateError) throw updateError;

    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)).sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    const { error: deleteError } = await (supabase as any).from("products").delete().eq("id", productId);
    if (deleteError) throw deleteError;

    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  return {
    products,
    productsById: byId,
    isLoadingProducts: isLoading,
    productsError: error,
    refreshProducts: fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
