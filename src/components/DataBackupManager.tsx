import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAutoBackup, AutoBackupData } from "@/hooks/useAutoBackup";
import { Download, Upload, RefreshCw, Database, FileJson, Clock, CheckCircle2, HardDrive, Cloud } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BackupData {
  version: string;
  exportedAt: string;
  customers: any[];
  priceHistory: any[];
  customerPricingTiers: any[];
  products?: any[];
  productRegions?: any[];
}

export const DataBackupManager = () => {
  const { toast } = useToast();
  const { getLastBackup, performBackup } = useAutoBackup();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [syncToCloudDialogOpen, setSyncToCloudDialogOpen] = useState(false);
  const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<BackupData | null>(null);
  const [lastAutoBackup, setLastAutoBackup] = useState<AutoBackupData | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  useEffect(() => {
    const backup = getLastBackup();
    setLastAutoBackup(backup);
    
    // Refresh auto-backup info every 5 seconds
    const interval = setInterval(() => {
      setLastAutoBackup(getLastBackup());
    }, 5000);

    return () => clearInterval(interval);
  }, [getLastBackup]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const [customersRes, priceHistoryRes, tiersRes, productsRes, regionsRes] = await Promise.all([
        supabase.from("customers").select("*"),
        supabase.from("price_history").select("*"),
        supabase.from("customer_pricing_tiers").select("*"),
        (supabase as any).from("products").select("*"),
        (supabase as any).from("product_regions").select("*"),
      ]);

      if (customersRes.error) throw customersRes.error;
      if (priceHistoryRes.error) throw priceHistoryRes.error;
      if (tiersRes.error) throw tiersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (regionsRes.error) throw regionsRes.error;

      const backupData: BackupData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        customers: customersRes.data || [],
        priceHistory: priceHistoryRes.data || [],
        customerPricingTiers: tiersRes.data || [],
        products: productsRes.data || [],
        productRegions: regionsRes.data || [],
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: `Data berhasil diexport: ${backupData.customers.length} pelanggan, ${backupData.priceHistory.length} riwayat, ${backupData.products?.length || 0} produk`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Gagal",
        description: "Gagal mengexport data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        
        // Support both old and new backup formats
        if (!data.version || !data.customers || !data.priceHistory || !data.customerPricingTiers) {
          throw new Error("Format file backup tidak valid");
        }

        // Ensure products and productRegions arrays exist (for old backups)
        if (!data.products) data.products = [];
        if (!data.productRegions) data.productRegions = [];

        setPendingImportData(data);
        setImportDialogOpen(true);
      } catch (error) {
        console.error("Parse error:", error);
        toast({
          title: "Gagal",
          description: "File backup tidak valid atau rusak",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleConfirmImport = async (data: BackupData) => {
    setIsImporting(true);
    setImportDialogOpen(false);
    setRestoreDialogOpen(false);

    try {
      // Products first (before regions due to FK)
      if (data.products && data.products.length > 0) {
        const { error } = await (supabase as any)
          .from("products")
          .upsert(data.products, { onConflict: "id" });
        if (error) throw error;
      }

      // Product regions
      if (data.productRegions && data.productRegions.length > 0) {
        const { error } = await (supabase as any)
          .from("product_regions")
          .upsert(data.productRegions, { onConflict: "id" });
        if (error) throw error;
      }

      // Customers
      if (data.customers.length > 0) {
        const { error } = await supabase
          .from("customers")
          .upsert(data.customers, { onConflict: "id" });
        if (error) throw error;
      }

      // Price history
      if (data.priceHistory.length > 0) {
        const { error } = await supabase
          .from("price_history")
          .upsert(data.priceHistory, { onConflict: "id" });
        if (error) throw error;
      }

      // Customer pricing tiers
      if (data.customerPricingTiers.length > 0) {
        const { error } = await supabase
          .from("customer_pricing_tiers")
          .upsert(data.customerPricingTiers, { onConflict: "id" });
        if (error) throw error;
      }

      toast({
        title: "Berhasil",
        description: `Data berhasil diimport: ${data.products?.length || 0} produk, ${data.customers.length} pelanggan, ${data.priceHistory.length} riwayat`,
      });

      window.location.reload();
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Gagal",
        description: "Gagal mengimport data. Periksa format file.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setPendingImportData(null);
    }
  };

  const handleSyncToCloud = async () => {
    if (!lastAutoBackup) return;

    setIsSyncingToCloud(true);
    setSyncToCloudDialogOpen(false);

    try {
      // Products first
      if (lastAutoBackup.products && lastAutoBackup.products.length > 0) {
        const { error } = await (supabase as any)
          .from("products")
          .upsert(lastAutoBackup.products, { onConflict: "id" });
        if (error) throw error;
      }

      // Product regions
      if (lastAutoBackup.productRegions && lastAutoBackup.productRegions.length > 0) {
        const { error } = await (supabase as any)
          .from("product_regions")
          .upsert(lastAutoBackup.productRegions, { onConflict: "id" });
        if (error) throw error;
      }

      // Customers
      if (lastAutoBackup.customers.length > 0) {
        const { error } = await supabase
          .from("customers")
          .upsert(lastAutoBackup.customers, { onConflict: "id" });
        if (error) throw error;
      }

      // Price history
      if (lastAutoBackup.priceHistory.length > 0) {
        const { error } = await supabase
          .from("price_history")
          .upsert(lastAutoBackup.priceHistory, { onConflict: "id" });
        if (error) throw error;
      }

      // Customer pricing tiers
      if (lastAutoBackup.customerPricingTiers.length > 0) {
        const { error } = await supabase
          .from("customer_pricing_tiers")
          .upsert(lastAutoBackup.customerPricingTiers, { onConflict: "id" });
        if (error) throw error;
      }

      toast({
        title: "Berhasil",
        description: `Data lokal berhasil dikirim ke cloud: ${lastAutoBackup.products?.length || 0} produk, ${lastAutoBackup.customers.length} pelanggan`,
      });

      window.location.reload();
    } catch (error) {
      console.error("Sync to cloud error:", error);
      toast({
        title: "Gagal",
        description: "Gagal mengirim data ke cloud.",
        variant: "destructive",
      });
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      window.location.reload();
    } catch (error) {
      console.error("Refresh error:", error);
      toast({
        title: "Gagal",
        description: "Gagal memuat ulang data",
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  };

  const handleManualAutoBackup = async () => {
    await performBackup();
    setLastAutoBackup(getLastBackup());
    toast({
      title: "Berhasil",
      description: "Auto-backup berhasil disimpan ke penyimpanan lokal",
    });
  };

  const formatBackupTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    return date.toLocaleString("id-ID");
  };

  return (
    <>
      <div className="space-y-6">
        {/* Cloud Status Info */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Status Cloud: Aktif
            </CardTitle>
            <CardDescription>
              Data Anda <strong>otomatis tersimpan ke cloud</strong> setiap kali Anda membuat, edit, atau hapus data. Tidak perlu sinkronisasi manual.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Auto-Backup Status Card */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-5 w-5 text-amber-500" />
                Cadangan Lokal (Darurat)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-backup-toggle" className="text-sm text-muted-foreground">
                  {autoBackupEnabled ? "Aktif" : "Nonaktif"}
                </Label>
                <Switch
                  id="auto-backup-toggle"
                  checked={autoBackupEnabled}
                  onCheckedChange={setAutoBackupEnabled}
                />
              </div>
            </div>
            <CardDescription>
              Cadangan tersimpan di browser sebagai backup darurat. <strong className="text-amber-600">Hanya gunakan Restore jika data cloud hilang!</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastAutoBackup ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Backup tersedia</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatBackupTime(lastAutoBackup.exportedAt)}</span>
                        <span>•</span>
                        <span>{lastAutoBackup.products?.length || 0} produk</span>
                        <span>•</span>
                        <span>{lastAutoBackup.customers.length} pelanggan</span>
                        <span>•</span>
                        <span>{lastAutoBackup.priceHistory.length} riwayat</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleManualAutoBackup}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Backup
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setRestoreDialogOpen(true)}>
                      Restore
                    </Button>
                  </div>
                </div>
                
                {/* Sync to Cloud Button */}
                <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Cloud className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Kirim ke Cloud</p>
                      <p className="text-xs text-muted-foreground">
                        Upload backup lokal ke database cloud (upsert)
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => setSyncToCloudDialogOpen(true)}
                    disabled={isSyncingToCloud}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSyncingToCloud ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1" />
                        Sinkronkan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Belum ada backup</p>
                    <p className="text-xs text-muted-foreground">
                      Backup akan dibuat otomatis saat ada perubahan data
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleManualAutoBackup}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Backup Sekarang
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Backup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup & Sinkronisasi Manual
            </CardTitle>
            <CardDescription>
              Export, import, dan sinkronisasi data dengan cloud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Section */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Export Backup</p>
                  <p className="text-sm text-muted-foreground">
                    Download semua data ke file JSON
                  </p>
                </div>
              </div>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Mengexport...
                  </>
                ) : (
                  <>
                    <FileJson className="mr-2 h-4 w-4" />
                    Export JSON
                  </>
                )}
              </Button>
            </div>

            {/* Import Section */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Import Data</p>
                  <p className="text-sm text-muted-foreground">
                    Restore data dari file backup JSON
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="import-file" className="cursor-pointer">
                  <Button asChild disabled={isImporting}>
                    <span>
                      {isImporting ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Mengimport...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Pilih File
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isImporting}
                />
              </div>
            </div>

            {/* Refresh Section */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Sinkronisasi Cloud</p>
                  <p className="text-sm text-muted-foreground">
                    Muat ulang data terbaru dari database cloud
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import from File Confirmation Dialog */}
      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Import Data</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Anda akan mengimport data dari backup:</p>
              {pendingImportData && (
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>{pendingImportData.products?.length || 0} produk</li>
                  <li>{pendingImportData.customers.length} pelanggan</li>
                  <li>{pendingImportData.priceHistory.length} riwayat harga</li>
                  <li>{pendingImportData.customerPricingTiers.length} tier harga</li>
                  <li className="text-muted-foreground">
                    Backup dibuat: {new Date(pendingImportData.exportedAt).toLocaleString("id-ID")}
                  </li>
                </ul>
              )}
              <p className="mt-4 text-amber-600 font-medium">
                Data yang sudah ada dengan ID yang sama akan ditimpa!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingImportData && handleConfirmImport(pendingImportData)}>
              Import Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore from Auto-Backup Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠️ Peringatan: Restore Data Lama</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-medium text-destructive">
                PERHATIAN: Ini akan menimpa data di cloud dengan data lama dari cadangan lokal!
              </p>
              <p>Hanya gunakan fitur ini jika:</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Data cloud Anda hilang/rusak</li>
                <li>Anda yakin data cadangan lebih akurat</li>
              </ul>
              {lastAutoBackup && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Data dalam cadangan:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>{lastAutoBackup.products?.length || 0} produk</li>
                    <li>{lastAutoBackup.customers.length} pelanggan</li>
                    <li>{lastAutoBackup.priceHistory.length} riwayat harga</li>
                    <li>{lastAutoBackup.customerPricingTiers.length} tier harga</li>
                    <li className="text-muted-foreground">
                      Waktu backup: {new Date(lastAutoBackup.exportedAt).toLocaleString("id-ID")}
                    </li>
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => lastAutoBackup && handleConfirmImport(lastAutoBackup)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Restore Data Lama
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Sync to Cloud Confirmation Dialog */}
      <AlertDialog open={syncToCloudDialogOpen} onOpenChange={setSyncToCloudDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-500" />
              Kirim Backup Lokal ke Cloud
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Ini akan <strong>mengirim semua data dari backup lokal</strong> ke database cloud.
              </p>
              <p className="text-sm text-muted-foreground">
                Data dengan ID yang sama di cloud akan ditimpa dengan data dari backup lokal.
              </p>
              {lastAutoBackup && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Data yang akan dikirim:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>{lastAutoBackup.products?.length || 0} produk</li>
                    <li>{lastAutoBackup.productRegions?.length || 0} region produk</li>
                    <li>{lastAutoBackup.customers.length} pelanggan</li>
                    <li>{lastAutoBackup.priceHistory.length} riwayat harga</li>
                    <li>{lastAutoBackup.customerPricingTiers.length} tier harga</li>
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSyncToCloud}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ya, Kirim ke Cloud
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
