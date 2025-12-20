import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  Package, 
  Plus, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Armchair,
  Users,
  History,
  Receipt,
  ListOrdered,
  Database,
  Cloud,
  CloudOff,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type MenuView = 'calculator' | 'products' | 'customers' | 'history' | 'summary' | 'pricelist' | 'backup';

interface ProductSidebarProps {
  currentView: MenuView;
  onViewChange: (view: MenuView) => void;
  onOpenAddProduct: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  productCount: number;
  customerCount?: number;
}

export function ProductSidebar({
  currentView,
  onViewChange,
  onOpenAddProduct,
  isCollapsed,
  onToggleCollapse,
  productCount,
  customerCount = 0,
}: ProductSidebarProps) {
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('customers').select('id').limit(1);
        setCloudStatus(error ? 'disconnected' : 'connected');
      } catch {
        setCloudStatus('disconnected');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);
  const menuItems = [
    {
      id: 'calculator' as MenuView,
      label: 'Kalkulator Harga',
      icon: Calculator,
      description: 'Hitung harga jual',
    },
    {
      id: 'summary' as MenuView,
      label: 'Ringkasan Harga',
      icon: Receipt,
      description: 'Lihat ringkasan',
    },
    {
      id: 'pricelist' as MenuView,
      label: 'Daftar Harga',
      icon: ListOrdered,
      description: 'Cash & Tempo',
    },
    {
      id: 'products' as MenuView,
      label: 'Daftar Produk',
      icon: Package,
      description: `${productCount} produk`,
    },
    {
      id: 'customers' as MenuView,
      label: 'Pelanggan',
      icon: Users,
      description: `${customerCount} pelanggan`,
    },
    {
      id: 'history' as MenuView,
      label: 'Riwayat Harga',
      icon: History,
      description: 'Lihat riwayat',
    },
    {
      id: 'backup' as MenuView,
      label: 'Backup & Sync',
      icon: Database,
      description: 'Kelola data',
    },
  ];

  if (isCollapsed) {
    return (
      <div className="w-16 min-h-screen gradient-sidebar flex flex-col items-center py-6 border-r border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-6 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div className="w-10 h-10 rounded-xl gradient-wood flex items-center justify-center shadow-wood mb-8">
          <Armchair className="w-5 h-5 text-primary-foreground" />
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="icon"
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-10 h-10 rounded-lg transition-all",
                currentView === item.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5" />
            </Button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">
          {/* Cloud Status Indicator - Collapsed */}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            cloudStatus === 'connected' && "bg-green-500/20",
            cloudStatus === 'disconnected' && "bg-red-500/20",
            cloudStatus === 'checking' && "bg-yellow-500/20"
          )}>
            {cloudStatus === 'connected' && <Cloud className="w-4 h-4 text-green-500" />}
            {cloudStatus === 'disconnected' && <CloudOff className="w-4 h-4 text-red-500" />}
            {cloudStatus === 'checking' && <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenAddProduct}
            className="w-10 h-10 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 min-h-screen gradient-sidebar flex flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-wood flex items-center justify-center shadow-wood">
              <Armchair className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-sidebar-foreground text-sm">FurniPrice</h1>
              <p className="text-xs text-sidebar-muted">Furniture Pricing</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="text-xs font-semibold text-sidebar-muted uppercase tracking-wider mb-3 px-3">
          Menu
        </p>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                currentView === item.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{item.label}</p>
                <p className={cn(
                  "text-xs truncate",
                  currentView === item.id ? "text-sidebar-primary-foreground/70" : "text-sidebar-muted"
                )}>
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <p className="text-xs font-semibold text-sidebar-muted uppercase tracking-wider mb-3 px-3">
            Aksi Cepat
          </p>
          <Button
            onClick={onOpenAddProduct}
            className="w-full justify-start gap-3 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </Button>
        </div>
      </nav>

      {/* Footer with Cloud Status */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {/* Cloud Status Indicator */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg",
          cloudStatus === 'connected' && "bg-green-500/10",
          cloudStatus === 'disconnected' && "bg-red-500/10",
          cloudStatus === 'checking' && "bg-yellow-500/10"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            cloudStatus === 'connected' && "bg-green-500/20",
            cloudStatus === 'disconnected' && "bg-red-500/20",
            cloudStatus === 'checking' && "bg-yellow-500/20"
          )}>
            {cloudStatus === 'connected' && <Cloud className="w-4 h-4 text-green-500" />}
            {cloudStatus === 'disconnected' && <CloudOff className="w-4 h-4 text-red-500" />}
            {cloudStatus === 'checking' && <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-sidebar-muted">Status Cloud</p>
            <p className={cn(
              "font-medium text-sm",
              cloudStatus === 'connected' && "text-green-500",
              cloudStatus === 'disconnected' && "text-red-500",
              cloudStatus === 'checking' && "text-yellow-500"
            )}>
              {cloudStatus === 'connected' && "Tersinkron"}
              {cloudStatus === 'disconnected' && "Offline"}
              {cloudStatus === 'checking' && "Memeriksa..."}
            </p>
          </div>
        </div>

        {/* Product Count */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50">
          <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center">
            <Settings className="w-4 h-4 text-accent-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-sidebar-muted">Total Produk</p>
            <p className="font-bold text-sidebar-foreground">{productCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
