import { useState } from 'react';
import { Product } from '@/types/pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Search, Edit2, Trash2, Plus, Armchair, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FURNITURE_CATEGORIES, getCategoryIcon, getCategoryColor } from '@/lib/furnitureCategories';

interface ProductManagerProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelectProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export function ProductManager({
  products,
  selectedProduct,
  onSelectProduct,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  dialogOpen,
  setDialogOpen,
}: ProductManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    newCategory: '',
    basePrice: '',
    unit: '',
  });

  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) acc[product.category] = [];
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Get unique categories from products for filter tabs
  const productCategories = [...new Set(products.map(p => p.category))];

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData({ name: '', category: '', newCategory: '', basePrice: '', unit: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      newCategory: '',
      basePrice: product.basePrice.toString(),
      unit: product.unit,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.basePrice || !formData.unit) return;
    
    const finalCategory = formData.category === '__new__' ? formData.newCategory : formData.category;
    if (!finalCategory) return;

    const productData: Product = {
      id: editingProduct?.id || crypto.randomUUID(),
      name: formData.name,
      category: finalCategory,
      basePrice: parseInt(formData.basePrice),
      unit: formData.unit,
    };

    if (editingProduct) {
      onEditProduct(productData);
      toast.success(`Produk "${productData.name}" berhasil diupdate!`);
    } else {
      onAddProduct(productData);
      toast.success(`Produk "${productData.name}" berhasil ditambahkan!`);
    }

    setDialogOpen(false);
  };

  const handleDelete = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Hapus produk "${product.name}"?`)) {
      onDeleteProduct(product.id);
      toast.success(`Produk "${product.name}" berhasil dihapus!`);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Daftar Produk</h2>
            <p className="text-muted-foreground">Kelola semua produk Anda di sini</p>
          </div>
          <Button onClick={openAddDialog} className="gradient-primary shadow-glow">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Button>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-card border-border"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "h-9 gap-2",
                selectedCategory === null && "gradient-primary shadow-glow"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Semua
              <span className="text-xs bg-background/20 px-1.5 py-0.5 rounded-full">
                {products.length}
              </span>
            </Button>
            {productCategories.map(cat => {
              const CategoryIcon = getCategoryIcon(cat);
              const categoryColor = getCategoryColor(cat);
              const count = products.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length;
              const isSelected = selectedCategory?.toLowerCase() === cat.toLowerCase();
              
              return (
                <Button
                  key={cat}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(isSelected ? null : cat)}
                  className={cn(
                    "h-9 gap-2 transition-all",
                    isSelected ? "gradient-primary shadow-glow" : "hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center",
                    isSelected ? "bg-background/20" : categoryColor
                  )}>
                    <CategoryIcon className="w-3.5 h-3.5" />
                  </div>
                  {cat}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    isSelected ? "bg-background/20" : "bg-secondary"
                  )}>
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {Object.entries(groupedProducts).map(([category, prods]) => {
          const CategoryIcon = getCategoryIcon(category);
          const categoryColor = getCategoryColor(category);
          
          return (
            <div key={category} className="space-y-3 animate-fade-in">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", categoryColor)}>
                  <CategoryIcon className="w-4 h-4" />
                </div>
                {category}
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{prods.length}</span>
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {prods.map(product => (
                <Card
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-card group",
                    selectedProduct?.id === product.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", categoryColor)}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => openEditDialog(product, e)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(product, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{product.name}</h4>
                  <p className="text-lg font-bold text-primary">
                    Rp {product.basePrice.toLocaleString('id-ID')}
                    <span className="text-sm font-normal text-muted-foreground ml-1">/ {product.unit}</span>
                  </p>
                </Card>
              ))}
            </div>
          </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Armchair className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery ? 'Coba kata kunci lain' : 'Mulai dengan menambahkan produk pertama'}
            </p>
            {!searchQuery && (
              <Button onClick={openAddDialog} className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nama Produk</Label>
              <Input
                placeholder="Contoh: Sofa Minimalis 3 Seater"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-secondary/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Kategori Furniture</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Pilih kategori furniture..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-[300px]">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50">
                    Kategori Furniture
                  </div>
                  {FURNITURE_CATEGORIES.map(cat => {
                    const CatIcon = cat.icon;
                    return (
                      <SelectItem key={cat.name} value={cat.name} className="py-2">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-6 h-6 rounded flex items-center justify-center", cat.color)}>
                            <CatIcon className="w-3.5 h-3.5" />
                          </div>
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                  {categories.filter(c => !FURNITURE_CATEGORIES.some(fc => fc.name.toLowerCase() === c.toLowerCase())).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50 mt-1">
                        Kategori Lainnya
                      </div>
                      {categories.filter(c => !FURNITURE_CATEGORIES.some(fc => fc.name.toLowerCase() === c.toLowerCase())).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </>
                  )}
                  <SelectItem value="__new__">+ Kategori Baru</SelectItem>
                </SelectContent>
              </Select>
              {formData.category === '__new__' && (
                <Input
                  placeholder="Nama kategori baru..."
                  value={formData.newCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, newCategory: e.target.value }))}
                  className="mt-2 bg-secondary/50"
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga Dasar (Rp)</Label>
                <Input
                  type="number"
                  placeholder="75000"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Satuan</Label>
                <Input
                  placeholder="sak, batang, m²"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="bg-secondary/50"
                />
              </div>
            </div>
            
            <Button onClick={handleSubmit} className="w-full gradient-primary shadow-glow">
              {editingProduct ? 'Simpan Perubahan' : 'Simpan Produk'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
