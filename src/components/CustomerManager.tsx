import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, User, Tag, Phone, Mail, MapPin } from 'lucide-react';
import { z } from 'zod';

interface Customer {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  pricing_tiers?: PricingTier[];
}

interface PricingTier {
  id: string;
  customer_id: string;
  tier_name: string;
  discount_percentage: number;
  description: string | null;
}

const customerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  address: z.string().max(500, 'Alamat maksimal 500 karakter').optional().or(z.literal('')),
  phone: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional().or(z.literal('')),
  email: z.string().email('Format email tidak valid').max(100, 'Email maksimal 100 karakter').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional().or(z.literal('')),
});

const tierSchema = z.object({
  tier_name: z.string().trim().min(1, 'Nama tier wajib diisi').max(50, 'Nama tier maksimal 50 karakter'),
  discount_percentage: z.number().min(0, 'Diskon minimal 0%').max(100, 'Diskon maksimal 100%'),
  description: z.string().max(200, 'Deskripsi maksimal 200 karakter').optional().or(z.literal('')),
});

export function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [tierFormData, setTierFormData] = useState({
    tier_name: '',
    discount_percentage: 0,
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (customersError) {
      toast({ title: 'Error', description: 'Gagal memuat data pelanggan', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { data: tiersData } = await supabase
      .from('customer_pricing_tiers')
      .select('*');

    const customersWithTiers = (customersData || []).map(customer => ({
      ...customer,
      pricing_tiers: tiersData?.filter(tier => tier.customer_id === customer.id) || [],
    }));

    setCustomers(customersWithTiers);
    setLoading(false);
  };

  const handleSubmit = async () => {
    const validation = customerSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      notes: formData.notes.trim() || null,
    };

    if (editingCustomer) {
      const { error } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', editingCustomer.id);

      if (error) {
        toast({ title: 'Error', description: 'Gagal memperbarui pelanggan', variant: 'destructive' });
        return;
      }
      toast({ title: 'Berhasil', description: 'Data pelanggan diperbarui' });
    } else {
      const { error } = await supabase.from('customers').insert(payload);

      if (error) {
        toast({ title: 'Error', description: 'Gagal menambah pelanggan', variant: 'destructive' });
        return;
      }
      toast({ title: 'Berhasil', description: 'Pelanggan baru ditambahkan' });
    }

    setDialogOpen(false);
    resetForm();
    fetchCustomers();
  };

  const handleAddTier = async () => {
    if (!selectedCustomer) return;

    const validation = tierSchema.safeParse(tierFormData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const { error } = await supabase.from('customer_pricing_tiers').insert({
      customer_id: selectedCustomer.id,
      tier_name: tierFormData.tier_name.trim(),
      discount_percentage: tierFormData.discount_percentage,
      description: tierFormData.description.trim() || null,
    });

    if (error) {
      toast({ title: 'Error', description: 'Gagal menambah tier harga', variant: 'destructive' });
      return;
    }

    toast({ title: 'Berhasil', description: 'Tier harga ditambahkan' });
    setTierDialogOpen(false);
    setTierFormData({ tier_name: '', discount_percentage: 0, description: '' });
    fetchCustomers();
  };

  const handleDeleteCustomer = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Gagal menghapus pelanggan', variant: 'destructive' });
      return;
    }
    toast({ title: 'Berhasil', description: 'Pelanggan dihapus' });
    fetchCustomers();
  };

  const handleDeleteTier = async (tierId: string) => {
    const { error } = await supabase.from('customer_pricing_tiers').delete().eq('id', tierId);
    if (error) {
      toast({ title: 'Error', description: 'Gagal menghapus tier harga', variant: 'destructive' });
      return;
    }
    toast({ title: 'Berhasil', description: 'Tier harga dihapus' });
    fetchCustomers();
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      address: customer.address || '',
      phone: customer.phone || '',
      email: customer.email || '',
      notes: customer.notes || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({ name: '', address: '', phone: '', email: '', notes: '' });
    setErrors({});
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Manajemen Pelanggan</h1>
          <p className="text-muted-foreground">Kelola pelanggan dan tier harga khusus</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4" />
              Tambah Pelanggan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama pelanggan"
                />
                {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap"
                  rows={2}
                />
                {errors.address && <p className="text-destructive text-sm">{errors.address}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telepon</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                  />
                  {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan tambahan..."
                  rows={2}
                />
                {errors.notes && <p className="text-destructive text-sm">{errors.notes}</p>}
              </div>
              <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">
                {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
      ) : customers.length === 0 ? (
        <Card className="shadow-card border-border">
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Belum ada data pelanggan</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Pelanggan Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {customers.map((customer) => (
            <Card key={customer.id} className="shadow-card border-border overflow-hidden">
              <CardHeader className="bg-secondary/30 border-b border-border py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    {customer.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(customer)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteCustomer(customer.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Contact Info */}
                  <div className="space-y-3">
                    {customer.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span className="text-foreground">{customer.address}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{customer.email}</span>
                      </div>
                    )}
                    {customer.notes && (
                      <p className="text-sm text-muted-foreground italic mt-2">{customer.notes}</p>
                    )}
                  </div>

                  {/* Pricing Tiers */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <Tag className="w-4 h-4 text-primary" />
                        Tier Harga Khusus
                      </h4>
                      <Dialog open={tierDialogOpen && selectedCustomer?.id === customer.id} onOpenChange={(open) => {
                        setTierDialogOpen(open);
                        if (open) setSelectedCustomer(customer);
                        else setErrors({});
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            Tambah Tier
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Tambah Tier Harga</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Nama Tier *</Label>
                              <Input
                                value={tierFormData.tier_name}
                                onChange={(e) => setTierFormData({ ...tierFormData, tier_name: e.target.value })}
                                placeholder="Contoh: Gold, Silver, VIP"
                              />
                              {errors.tier_name && <p className="text-destructive text-sm">{errors.tier_name}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Diskon (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={tierFormData.discount_percentage}
                                onChange={(e) => setTierFormData({ ...tierFormData, discount_percentage: Number(e.target.value) })}
                              />
                              {errors.discount_percentage && <p className="text-destructive text-sm">{errors.discount_percentage}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Deskripsi</Label>
                              <Input
                                value={tierFormData.description}
                                onChange={(e) => setTierFormData({ ...tierFormData, description: e.target.value })}
                                placeholder="Keterangan tambahan..."
                              />
                              {errors.description && <p className="text-destructive text-sm">{errors.description}</p>}
                            </div>
                            <Button onClick={handleAddTier} className="w-full gradient-primary text-primary-foreground">
                              Tambah Tier
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {customer.pricing_tiers && customer.pricing_tiers.length > 0 ? (
                      <div className="space-y-2">
                        {customer.pricing_tiers.map((tier) => (
                          <div key={tier.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-semibold">
                                {tier.tier_name}
                              </Badge>
                              <span className="text-sm font-medium text-success">
                                -{tier.discount_percentage}%
                              </span>
                              {tier.description && (
                                <span className="text-xs text-muted-foreground">• {tier.description}</span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleDeleteTier(tier.id)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum ada tier harga</p>
                    )}
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
