import { useState, useMemo, useEffect } from 'react';
import { Product, Region, Discount, ProfitMargin, PriceCalculation } from '@/types/pricing';
import { sampleRegions } from '@/data/sampleData';
import { useCloudProducts } from '@/hooks/useCloudProducts';
import { ProductSidebar } from '@/components/ProductSidebar';
import { ProductManager } from '@/components/ProductManager';
import { CustomerManager } from '@/components/CustomerManager';
import { PriceHistory, PriceHistoryRecord } from '@/components/PriceHistory';
import { PriceList } from '@/components/PriceList';
import { DataBackupManager } from '@/components/DataBackupManager';
import AIPricingAssistant from '@/components/AIPricingAssistant';
import { DiscountCalculator } from '@/components/DiscountCalculator';
import { MarginCalculator } from '@/components/MarginCalculator';
import { PriceSummary } from '@/components/PriceSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calculator, Percent, TrendingUp, MapPin, Package, Users, Save, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type MenuView = 'calculator' | 'products' | 'customers' | 'history' | 'summary' | 'pricelist' | 'backup' | 'ai-assistant';

interface CustomerWithTiers {
  id: string;
  name: string;
  pricing_tiers: {
    id: string;
    tier_name: string;
    discount_percentage: number;
    description: string | null;
  }[];
}

const Index = () => {
  const {
    products,
    isLoadingProducts,
    productsError,
    refreshProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useCloudProducts();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<MenuView>('calculator');
  const [customerCount, setCustomerCount] = useState(0);
  const [customers, setCustomers] = useState<CustomerWithTiers[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithTiers | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [savingCalculation, setSavingCalculation] = useState(false);
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([
    { id: 1, label: 'Diskon 1', type: 'percentage', value: 0, enabled: true },
  ]);
  const [margin, setMargin] = useState<ProfitMargin>({
    type: 'cash',
    marginType: 'percentage',
    value: 10,
    tempoTerm: '30',
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, name')
        .order('name');
      
      const { data: tiersData } = await supabase
        .from('customer_pricing_tiers')
        .select('*');

      const customersWithTiers = (customersData || []).map(c => ({
        ...c,
        pricing_tiers: tiersData?.filter(t => t.customer_id === c.id) || [],
      }));

      setCustomers(customersWithTiers);
      setCustomerCount(customersData?.length || 0);
    };
    fetchCustomers();
  }, [currentView]);

  const handleAddProduct = async (product: Product) => {
    try {
      await addProduct(product);
    } catch (error) {
      console.error('Add product error:', error);
      toast({ title: 'Error', description: 'Gagal menambahkan produk', variant: 'destructive' });
    }
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    try {
      await updateProduct(updatedProduct);
      if (selectedProduct?.id === updatedProduct.id) {
        setSelectedProduct(updatedProduct);
      }
    } catch (error) {
      console.error('Update product error:', error);
      toast({ title: 'Error', description: 'Gagal mengupdate produk', variant: 'destructive' });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Delete product error:', error);
      toast({ title: 'Error', description: 'Gagal menghapus produk', variant: 'destructive' });
    }
  };

  const customerTierDiscount = useMemo(() => {
    if (!selectedCustomer || !selectedTier) return null;
    return selectedCustomer.pricing_tiers.find(t => t.id === selectedTier);
  }, [selectedCustomer, selectedTier]);

  const calculation = useMemo<PriceCalculation | null>(() => {
    if (!selectedProduct || !selectedRegion) return null;

    const basePrice = selectedProduct.basePrice;
    const regionPrice = Math.round(basePrice * selectedRegion.priceMultiplier);

    let runningPrice = regionPrice;
    const discountDetails: { label: string; amount: number }[] = [];

    if (customerTierDiscount) {
      const tierAmount = Math.round(runningPrice * (customerTierDiscount.discount_percentage / 100));
      discountDetails.push({ 
        label: `${selectedCustomer?.name} - ${customerTierDiscount.tier_name}`, 
        amount: tierAmount 
      });
      runningPrice = Math.max(0, runningPrice - tierAmount);
    }

    for (const d of discounts) {
      if (d.enabled && d.value > 0) {
        const amount = d.type === 'percentage'
          ? Math.round(runningPrice * (d.value / 100))
          : d.value;
        discountDetails.push({ label: d.label, amount });
        runningPrice = Math.max(0, runningPrice - amount);
      }
    }

    const netPrice = runningPrice;
    const marginAmount = margin.marginType === 'percentage'
      ? Math.round(netPrice * (margin.value / 100))
      : margin.value;

    const finalPrice = netPrice + marginAmount;

    return {
      basePrice,
      regionPrice,
      discounts: discountDetails,
      netPrice,
      margin: marginAmount,
      finalPrice,
    };
  }, [selectedProduct, selectedRegion, discounts, margin, customerTierDiscount, selectedCustomer]);

  const handleOpenAddProduct = () => {
    setCurrentView('products');
    setProductDialogOpen(true);
  };

  const handleSaveCalculation = async () => {
    if (!selectedProduct || !selectedRegion || !calculation) {
      toast({ title: 'Error', description: 'Pilih produk dan region terlebih dahulu', variant: 'destructive' });
      return;
    }

    setSavingCalculation(true);
    const { error } = await supabase.from('price_history').insert({
      customer_id: selectedCustomer?.id || null,
      product_name: selectedProduct.name,
      product_unit: selectedProduct.unit,
      region_name: selectedRegion.name,
      base_price: calculation.basePrice,
      region_price: calculation.regionPrice,
      discounts: calculation.discounts,
      net_price: calculation.netPrice,
      margin_amount: calculation.margin,
      margin_type: margin.type === 'tempo' ? `Tempo ${margin.tempoTerm} hari` : 'Cash',
      final_price: calculation.finalPrice,
    });

    setSavingCalculation(false);
    if (error) {
      toast({ title: 'Error', description: 'Gagal menyimpan kalkulasi', variant: 'destructive' });
      return;
    }
    toast({ title: 'Berhasil', description: 'Kalkulasi tersimpan ke riwayat' });
  };

  const handleDuplicateCalculation = (record: PriceHistoryRecord) => {
    const product = products.find(p => p.name === record.product_name);
    const region = sampleRegions.find(r => r.name === record.region_name);
    const customer = customers.find(c => c.id === record.customer_id);

    if (product) setSelectedProduct(product);
    if (region) setSelectedRegion(region);
    if (customer) {
      setSelectedCustomer(customer);
      if (customer.pricing_tiers.length > 0) {
        setSelectedTier(customer.pricing_tiers[0].id);
      }
    } else {
      setSelectedCustomer(null);
      setSelectedTier(null);
    }

    const historyDiscounts = record.discounts || [];
    const manualDiscounts = customer 
      ? historyDiscounts.slice(1)
      : historyDiscounts;
    
    if (manualDiscounts.length > 0) {
      setDiscounts(manualDiscounts.map((d, i) => ({
        id: i + 1,
        label: d.label,
        type: 'nominal' as const,
        value: d.amount,
        enabled: true,
      })));
    } else {
      setDiscounts([{ id: 1, label: 'Diskon 1', type: 'percentage', value: 0, enabled: true }]);
    }

    if (record.margin_type.startsWith('Tempo')) {
      const tempoMatch = record.margin_type.match(/Tempo (\d+) hari/);
      setMargin({
        type: 'tempo',
        marginType: 'nominal',
        value: Number(record.margin_amount),
        tempoTerm: tempoMatch ? tempoMatch[1] : '30',
      });
    } else {
      setMargin({
        type: 'cash',
        marginType: 'nominal',
        value: Number(record.margin_amount),
        tempoTerm: '30',
      });
    }

    setCurrentView('calculator');
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <ProductSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenAddProduct={handleOpenAddProduct}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        productCount={products.length}
        customerCount={customerCount}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {currentView === 'products' ? (
            <ProductManager
              products={products}
              selectedProduct={selectedProduct}
              onSelectProduct={(product) => {
                setSelectedProduct(product);
                setCurrentView('calculator');
              }}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              dialogOpen={productDialogOpen}
              setDialogOpen={setProductDialogOpen}
            />
          ) : currentView === 'customers' ? (
            <CustomerManager />
          ) : currentView === 'history' ? (
            <PriceHistory onDuplicate={handleDuplicateCalculation} />
          ) : currentView === 'pricelist' ? (
            <PriceList />
          ) : currentView === 'backup' ? (
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">Backup & Sinkronisasi</h1>
                <p className="text-muted-foreground">Kelola backup dan sinkronisasi data furniture</p>
              </div>
              <DataBackupManager />
            </div>
          ) : currentView === 'ai-assistant' ? (
            <div className="max-w-3xl mx-auto">
              <AIPricingAssistant 
                products={products.map(p => ({ 
                  id: p.id, 
                  name: p.name, 
                  basePrice: p.basePrice, 
                  category: p.category, 
                  unit: p.unit 
                }))}
                customers={customers.map(c => ({ id: c.id, name: c.name }))}
              />
            </div>
          ) : currentView === 'summary' ? (
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">Ringkasan Harga</h1>
                <p className="text-muted-foreground">Detail kalkulasi harga jual furniture</p>
              </div>
              <Card className="shadow-card border-border overflow-hidden">
                <CardHeader className="gradient-primary py-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-primary-foreground">
                    <Calculator className="w-5 h-5" />
                    Ringkasan Harga
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <PriceSummary
                    product={selectedProduct}
                    region={selectedRegion}
                    calculation={calculation}
                    margin={margin}
                  />
                  {calculation && (
                    <Button 
                      onClick={handleSaveCalculation} 
                      disabled={savingCalculation}
                      className="w-full gap-2 gradient-accent text-accent-foreground"
                    >
                      <Save className="w-4 h-4" />
                      {savingCalculation ? 'Menyimpan...' : 'Simpan ke Riwayat'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">Kalkulator Harga Furniture</h1>
                <p className="text-muted-foreground">Hitung harga jual furniture dengan cepat dan akurat</p>
              </div>

              <div className="space-y-6">
                <Card className="shadow-card border-border overflow-hidden">
                  <CardHeader className="bg-secondary/30 border-b border-border py-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary-foreground" />
                      </div>
                      Produk & Region
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Pilih Produk</Label>
                      <Select
                        value={selectedProduct?.id || ''}
                        onValueChange={(value) => {
                          const product = products.find(p => p.id === value);
                          if (product) setSelectedProduct(product);
                        }}
                      >
                        <SelectTrigger className="h-12 bg-card border-border hover:border-primary/50 transition-colors">
                          <SelectValue placeholder="Pilih produk..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {[...new Set(products.map(p => p.category))].map(category => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50">
                                {category}
                              </div>
                              {products.filter(p => p.category === category).map(product => (
                                <SelectItem key={product.id} value={product.id} className="py-2">
                                  <div className="flex items-center justify-between w-full">
                                    <span>{product.name}</span>
                                    <span className="text-muted-foreground ml-2">
                                      Rp {product.basePrice.toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        Region/Daerah
                      </Label>
                      <Select
                        value={selectedRegion?.id || ''}
                        onValueChange={(value) => {
                          const region = sampleRegions.find(r => r.id === value);
                          if (region) setSelectedRegion(region);
                        }}
                      >
                        <SelectTrigger className="h-12 bg-card border-border hover:border-primary/50 transition-colors">
                          <SelectValue placeholder="Pilih daerah..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50">
                            Region A
                          </div>
                          {sampleRegions.filter(r => r.region === 'A').map(region => (
                            <SelectItem key={region.id} value={region.id} className="py-2">
                              <span>{region.name}</span>
                            </SelectItem>
                          ))}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50 mt-1">
                            Region B <span className="text-primary font-bold">(+5%)</span>
                          </div>
                          {sampleRegions.filter(r => r.region === 'B').map(region => (
                            <SelectItem key={region.id} value={region.id} className="py-2">
                              <span>{region.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Users className="w-4 h-4 text-primary" />
                        Pelanggan & Tier Harga
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          value={selectedCustomer?.id || ''}
                          onValueChange={(value) => {
                            if (value === 'none') {
                              setSelectedCustomer(null);
                              setSelectedTier(null);
                              return;
                            }
                            const customer = customers.find(c => c.id === value);
                            setSelectedCustomer(customer || null);
                            setSelectedTier(null);
                          }}
                        >
                          <SelectTrigger className="h-10 bg-card border-border hover:border-primary/50 transition-colors">
                            <SelectValue placeholder="Pilih pelanggan..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="none" className="py-2 text-muted-foreground">
                              Tanpa pelanggan
                            </SelectItem>
                            {customers.map(customer => (
                              <SelectItem key={customer.id} value={customer.id} className="py-2">
                                <div className="flex items-center gap-2">
                                  <span>{customer.name}</span>
                                  {customer.pricing_tiers.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {customer.pricing_tiers.length} tier
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={selectedTier || ''}
                          onValueChange={setSelectedTier}
                          disabled={!selectedCustomer || selectedCustomer.pricing_tiers.length === 0}
                        >
                          <SelectTrigger className="h-10 bg-card border-border hover:border-primary/50 transition-colors">
                            <SelectValue placeholder="Pilih tier..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {selectedCustomer?.pricing_tiers.map(tier => (
                              <SelectItem key={tier.id} value={tier.id} className="py-2">
                                <div className="flex items-center gap-2">
                                  <span>{tier.tier_name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    -{tier.discount_percentage}%
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {customerTierDiscount && (
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                          <p className="text-sm text-primary">
                            <span className="font-medium">{customerTierDiscount.tier_name}</span>: Diskon {customerTierDiscount.discount_percentage}%
                            {customerTierDiscount.description && (
                              <span className="text-muted-foreground ml-1">- {customerTierDiscount.description}</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card border-border overflow-hidden">
                  <CardHeader className="bg-secondary/30 border-b border-border py-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                        <Percent className="w-4 h-4 text-warning" />
                      </div>
                      Potongan / Diskon
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <DiscountCalculator
                      discounts={discounts}
                      onDiscountsChange={setDiscounts}
                      basePrice={calculation?.regionPrice || 0}
                    />
                  </CardContent>
                </Card>

                <Card className="shadow-card border-border overflow-hidden">
                  <CardHeader className="bg-secondary/30 border-b border-border py-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-accent-foreground" />
                      </div>
                      Keuntungan (Cash / Tempo)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <MarginCalculator
                      margin={margin}
                      onMarginChange={setMargin}
                      netPrice={calculation?.netPrice || 0}
                    />
                  </CardContent>
                </Card>

                {/* Price Preview */}
                {calculation && (
                  <Card className="shadow-card border-border overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Harga Jual per {selectedProduct?.unit}</p>
                          <p className="text-3xl font-bold text-primary">
                            Rp {calculation.finalPrice.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleSaveCalculation} 
                            disabled={savingCalculation}
                            variant="outline"
                            className="gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {savingCalculation ? 'Menyimpan...' : 'Simpan'}
                          </Button>
                          <Button 
                            onClick={() => setCurrentView('summary')}
                            className="gap-2 gradient-primary text-primary-foreground"
                          >
                            Lihat Detail
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-border bg-card/50">
          <div className="px-6 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Sales Price Calculator • Kelola harga penjualan dengan mudah
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
