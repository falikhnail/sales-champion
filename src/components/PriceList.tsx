import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Package, 
  User, 
  MapPin,
  Clock,
  Banknote,
  FileSpreadsheet,
  FileText,
  Pencil,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { exportHistoryToExcel, exportHistoryToPDF } from '@/lib/historyExportUtils';

interface PriceRecord {
  id: string;
  customer_id: string | null;
  product_name: string;
  product_unit: string;
  region_name: string;
  base_price: number;
  region_price: number;
  discounts: { label: string; amount: number }[];
  net_price: number;
  margin_amount: number;
  margin_type: string;
  final_price: number;
  notes: string | null;
  created_at: string;
  customer?: { name: string } | null;
}

interface Customer {
  id: string;
  name: string;
}

interface EditFormData {
  final_price: string;
  margin_amount: string;
  margin_type: string;
  notes: string;
}

export function PriceList() {
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceRecord | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    final_price: '',
    margin_amount: '',
    margin_type: 'Cash',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPriceId, setDeletingPriceId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [pricesResult, customersResult] = await Promise.all([
      supabase
        .from('price_history')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('customers')
        .select('id, name')
        .order('name')
    ]);

    if (pricesResult.data) {
      const customerMap = new Map(customersResult.data?.map(c => [c.id, c.name]) || []);
      const pricesWithCustomers = pricesResult.data.map(record => ({
        ...record,
        discounts: Array.isArray(record.discounts) ? record.discounts : [],
        customer: record.customer_id ? { name: customerMap.get(record.customer_id) || 'Unknown' } : null
      }));
      setPrices(pricesWithCustomers as PriceRecord[]);
    }
    
    setCustomers(customersResult.data || []);
    setLoading(false);
  };

  const handleEdit = (price: PriceRecord) => {
    setEditingPrice(price);
    setEditFormData({
      final_price: String(price.final_price),
      margin_amount: String(price.margin_amount),
      margin_type: price.margin_type,
      notes: price.notes || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPrice) return;
    
    const finalPrice = parseFloat(editFormData.final_price);
    const marginAmount = parseFloat(editFormData.margin_amount);
    
    if (isNaN(finalPrice) || finalPrice < 0) {
      toast({ title: 'Error', description: 'Harga final tidak valid', variant: 'destructive' });
      return;
    }
    
    if (isNaN(marginAmount) || marginAmount < 0) {
      toast({ title: 'Error', description: 'Margin tidak valid', variant: 'destructive' });
      return;
    }

    setSaving(true);
    
    // Calculate net_price from final_price - margin_amount
    const netPrice = finalPrice - marginAmount;
    
    const { error } = await supabase
      .from('price_history')
      .update({
        final_price: finalPrice,
        margin_amount: marginAmount,
        margin_type: editFormData.margin_type,
        net_price: netPrice,
        notes: editFormData.notes || null
      })
      .eq('id', editingPrice.id);

    setSaving(false);

    if (error) {
      toast({ title: 'Error', description: 'Gagal menyimpan perubahan', variant: 'destructive' });
      return;
    }

    toast({ title: 'Berhasil', description: 'Harga berhasil diperbarui' });
    setEditDialogOpen(false);
    setEditingPrice(null);
    
    // Update local state
    setPrices(prev => prev.map(p => 
      p.id === editingPrice.id 
        ? { 
            ...p, 
            final_price: finalPrice, 
            margin_amount: marginAmount,
            margin_type: editFormData.margin_type,
            net_price: netPrice,
            notes: editFormData.notes || null
          }
        : p
    ));
  };

  const handleDeleteClick = (id: string) => {
    setDeletingPriceId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPriceId) return;
    
    const { error } = await supabase.from('price_history').delete().eq('id', deletingPriceId);
    if (error) {
      toast({ title: 'Error', description: 'Gagal menghapus harga', variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'Harga dihapus' });
      setPrices(prev => prev.filter(p => p.id !== deletingPriceId));
    }
    setDeleteDialogOpen(false);
    setDeletingPriceId(null);
  };

  const filteredPrices = useMemo(() => {
    return prices.filter(price => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        price.product_name.toLowerCase().includes(searchLower) ||
        price.region_name.toLowerCase().includes(searchLower) ||
        price.customer?.name?.toLowerCase().includes(searchLower);

      const isTempo = price.margin_type.toLowerCase().includes('tempo');
      const matchesType = filterType === 'all' || 
        (filterType === 'cash' && !isTempo) ||
        (filterType === 'tempo' && isTempo);

      const matchesCustomer = filterCustomer === 'all' ||
        (filterCustomer === 'none' && !price.customer_id) ||
        price.customer_id === filterCustomer;

      return matchesSearch && matchesType && matchesCustomer;
    });
  }, [prices, searchQuery, filterType, filterCustomer]);

  const groupedByProduct = useMemo(() => {
    const groups: Record<string, PriceRecord[]> = {};
    filteredPrices.forEach(price => {
      const key = price.product_name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(price);
    });
    return groups;
  }, [filteredPrices]);

  const getTypeColor = (marginType: string) => {
    return marginType.toLowerCase().includes('tempo') 
      ? 'bg-amber-500/10 text-amber-600 border-amber-200' 
      : 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
  };

  const getTypeIcon = (marginType: string) => {
    return marginType.toLowerCase().includes('tempo') 
      ? <Clock className="w-3 h-3" />
      : <Banknote className="w-3 h-3" />;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Daftar Harga</h1>
        <p className="text-muted-foreground">Lihat semua harga jual setelah diskon</p>
      </div>

      {/* Filters */}
      <Card className="shadow-card border-border mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari produk, region, atau pelanggan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="tempo">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Tempo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter pelanggan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pelanggan</SelectItem>
                <SelectItem value="none">Tanpa Pelanggan</SelectItem>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filteredPrices.length > 0 && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportHistoryToExcel(filteredPrices);
                    toast({ title: 'Berhasil', description: 'File Excel diunduh' });
                  }}
                  className="flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportHistoryToPDF(filteredPrices);
                    toast({ title: 'Berhasil', description: 'File PDF diunduh' });
                  }}
                  className="flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            )}
          </div>

          {(searchQuery || filterType !== 'all' || filterCustomer !== 'all') && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Menampilkan {filteredPrices.length} dari {prices.length} data
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterCustomer('all');
                }}
                className="text-xs"
              >
                Reset Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
      ) : filteredPrices.length === 0 ? (
        <Card className="shadow-card border-border">
          <CardContent className="py-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {prices.length === 0 
                ? 'Belum ada data harga tersimpan' 
                : 'Tidak ada data yang sesuai dengan filter'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByProduct).map(([productName, productPrices]) => (
            <Card key={productName} className="shadow-card border-border overflow-hidden">
              <div className="bg-secondary/30 border-b border-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{productName}</h3>
                  <Badge variant="outline" className="ml-auto">
                    {productPrices.length} harga
                  </Badge>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {productPrices.map((price) => (
                    <div key={price.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Left side - Info */}
                        <div className="flex items-center gap-4 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`flex items-center gap-1 ${getTypeColor(price.margin_type)}`}
                          >
                            {getTypeIcon(price.margin_type)}
                            {price.margin_type}
                          </Badge>

                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {price.region_name}
                          </div>

                          {price.customer && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="w-3 h-3" />
                              {price.customer.name}
                            </div>
                          )}

                          <span className="text-xs text-muted-foreground">
                            {format(new Date(price.created_at), "d MMM yyyy", { locale: idLocale })}
                          </span>
                        </div>

                        {/* Right side - Price and Actions */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              Rp {Number(price.final_price).toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              per {price.product_unit}
                            </p>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(price)}
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(price.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>


                      {/* Notes if any */}
                      {price.notes && (
                        <p className="mt-2 text-sm text-muted-foreground italic">{price.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Harga</DialogTitle>
          </DialogHeader>
          
          {editingPrice && (
            <div className="space-y-4 py-4">
              {/* Product Info */}
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="font-medium text-foreground">{editingPrice.product_name}</p>
                <p className="text-sm text-muted-foreground">{editingPrice.region_name}</p>
              </div>

              {/* Final Price */}
              <div className="space-y-2">
                <Label htmlFor="final_price">Harga Final (Rp)</Label>
                <Input
                  id="final_price"
                  type="number"
                  value={editFormData.final_price}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, final_price: e.target.value }))}
                  placeholder="Masukkan harga final"
                />
              </div>

              {/* Margin Amount */}
              <div className="space-y-2">
                <Label htmlFor="margin_amount">Margin (Rp)</Label>
                <Input
                  id="margin_amount"
                  type="number"
                  value={editFormData.margin_amount}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, margin_amount: e.target.value }))}
                  placeholder="Masukkan margin"
                />
              </div>

              {/* Margin Type */}
              <div className="space-y-2">
                <Label>Tipe Pembayaran</Label>
                <Select 
                  value={editFormData.margin_type} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, margin_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        Cash
                      </div>
                    </SelectItem>
                    <SelectItem value="Tempo 7 hari">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Tempo 7 hari
                      </div>
                    </SelectItem>
                    <SelectItem value="Tempo 14 hari">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Tempo 14 hari
                      </div>
                    </SelectItem>
                    <SelectItem value="Tempo 30 hari">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Tempo 30 hari
                      </div>
                    </SelectItem>
                    <SelectItem value="Tempo 45 hari">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Tempo 45 hari
                      </div>
                    </SelectItem>
                    <SelectItem value="Tempo 60 hari">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Tempo 60 hari
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (opsional)</Label>
                <Input
                  id="notes"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Tambahkan catatan..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data harga ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPriceId(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
