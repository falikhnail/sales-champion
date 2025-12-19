import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { History, Trash2, User, Package, Calendar, Filter, Copy, FileSpreadsheet, FileText } from 'lucide-react';
import { exportHistoryToExcel, exportHistoryToPDF } from '@/lib/historyExportUtils';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export interface PriceHistoryRecord {
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

interface PriceHistoryProps {
  onDuplicate?: (record: PriceHistoryRecord) => void;
}

export function PriceHistory({ onDuplicate }: PriceHistoryProps) {
  const [history, setHistory] = useState<PriceHistoryRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [historyResult, customersResult] = await Promise.all([
      supabase
        .from('price_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('customers')
        .select('id, name')
        .order('name')
    ]);

    if (historyResult.data) {
      // Map customer names to history records
      const customerMap = new Map(customersResult.data?.map(c => [c.id, c.name]) || []);
      const historyWithCustomers = historyResult.data.map(record => ({
        ...record,
        discounts: Array.isArray(record.discounts) ? record.discounts : [],
        customer: record.customer_id ? { name: customerMap.get(record.customer_id) || 'Unknown' } : null
      }));
      setHistory(historyWithCustomers as PriceHistoryRecord[]);
    }
    
    setCustomers(customersResult.data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('price_history').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Gagal menghapus riwayat', variant: 'destructive' });
      return;
    }
    toast({ title: 'Berhasil', description: 'Riwayat dihapus' });
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const filteredHistory = filterCustomer === 'all' 
    ? history 
    : filterCustomer === 'none'
    ? history.filter(h => !h.customer_id)
    : history.filter(h => h.customer_id === filterCustomer);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Riwayat Harga</h1>
          <p className="text-muted-foreground">Lacak semua kalkulasi harga yang tersimpan</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterCustomer} onValueChange={setFilterCustomer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter pelanggan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="none">Tanpa pelanggan</SelectItem>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {filteredHistory.length > 0 && (
            <div className="flex gap-1 ml-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportHistoryToExcel(filteredHistory)}
                className="flex items-center gap-1"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportHistoryToPDF(filteredHistory)}
                className="flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
      ) : filteredHistory.length === 0 ? (
        <Card className="shadow-card border-border">
          <CardContent className="py-12 text-center">
            <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada riwayat kalkulasi</p>
            <p className="text-sm text-muted-foreground mt-1">
              Simpan kalkulasi dari halaman Kalkulator Harga
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((record) => (
            <Card key={record.id} className="shadow-card border-border overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">{record.product_name}</span>
                      </div>
                      <Badge variant="outline">{record.region_name}</Badge>
                      {record.customer && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {record.customer.name}
                        </Badge>
                      )}
                    </div>

                    {/* Price breakdown */}
                    <div className="grid sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Harga Region</p>
                        <p className="font-medium">Rp {Number(record.region_price).toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Diskon</p>
                        <p className="font-medium text-destructive">
                          -Rp {record.discounts.reduce((sum, d) => sum + d.amount, 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Margin ({record.margin_type})</p>
                        <p className="font-medium text-success">
                          +Rp {Number(record.margin_amount).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Harga Final</p>
                        <p className="font-bold text-lg text-primary">
                          Rp {Number(record.final_price).toLocaleString('id-ID')}
                          <span className="text-xs font-normal text-muted-foreground">/{record.product_unit}</span>
                        </p>
                      </div>
                    </div>

                    {/* Discounts detail */}
                    {record.discounts.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Detail Diskon Bertingkat ({record.discounts.length} diskon)
                        </p>
                        <div className="space-y-1.5">
                          {record.discounts.map((d, i) => {
                            const runningTotal = record.discounts.slice(0, i + 1).reduce((sum, disc) => sum + disc.amount, 0);
                            return (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                                    {i + 1}
                                  </span>
                                  <span className="text-foreground">{d.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-destructive font-medium">-Rp {d.amount.toLocaleString('id-ID')}</span>
                                  {record.discounts.length > 1 && (
                                    <span className="text-xs text-muted-foreground">
                                      (total: -Rp {runningTotal.toLocaleString('id-ID')})
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {record.notes && (
                      <p className="text-sm text-muted-foreground italic">{record.notes}</p>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(record.created_at), "d MMMM yyyy, HH:mm", { locale: idLocale })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {onDuplicate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onDuplicate(record);
                          toast({ title: 'Berhasil', description: 'Data dimuat ke kalkulator' });
                        }}
                        className="text-muted-foreground hover:text-primary"
                        title="Duplikasi ke kalkulator"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
