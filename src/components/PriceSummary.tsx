import { PriceCalculation } from '@/types/pricing';
import { Product, Region, ProfitMargin } from '@/types/pricing';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Copy, Check, Calculator, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';

interface PriceSummaryProps {
  product: Product | null;
  region: Region | null;
  calculation: PriceCalculation | null;
  margin: ProfitMargin;
}

export function PriceSummary({ product, region, calculation, margin }: PriceSummaryProps) {
  const [copied, setCopied] = useState(false);

  if (!product || !region || !calculation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-2">Ringkasan Harga</h3>
        <p className="text-sm text-muted-foreground">
          Pilih produk dan region untuk melihat kalkulasi harga
        </p>
      </div>
    );
  }

  const copyToClipboard = () => {
    const text = `
${product.name}
Region: ${region.name}

Harga Pricelist: Rp ${calculation.regionPrice.toLocaleString('id-ID')}
${calculation.discounts.map(d => `${d.label}: -Rp ${d.amount.toLocaleString('id-ID')}`).join('\n')}
Harga Nett: Rp ${calculation.netPrice.toLocaleString('id-ID')}
Margin (${margin.type}): +Rp ${calculation.margin.toLocaleString('id-ID')}

HARGA JUAL: Rp ${calculation.finalPrice.toLocaleString('id-ID')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Ringkasan harga disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportExcel = () => {
    try {
      exportToExcel({ product, region, calculation, margin });
      toast.success('File Excel berhasil diunduh!');
    } catch (error) {
      toast.error('Gagal mengunduh file Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF({ product, region, calculation, margin });
      toast.success('File PDF berhasil diunduh!');
    } catch (error) {
      toast.error('Gagal mengunduh file PDF');
    }
  };

  const discountTotal = calculation.discounts.reduce((sum, d) => sum + d.amount, 0);
  const discountPercentage = calculation.regionPrice > 0 
    ? ((discountTotal / calculation.regionPrice) * 100).toFixed(1)
    : '0';

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex-1 space-y-4">
        {/* Product Info */}
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="font-medium text-foreground">{product.name}</p>
          <p className="text-sm text-muted-foreground">{region.name}</p>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Harga Pricelist</span>
            <span className="font-medium">Rp {calculation.regionPrice.toLocaleString('id-ID')}</span>
          </div>

          {calculation.discounts.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                {calculation.discounts.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="text-destructive font-medium">
                      -Rp {d.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-muted-foreground">Total Diskon</span>
                  <span className="text-destructive font-semibold">
                    -{discountPercentage}%
                  </span>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex justify-between">
            <span className="font-medium text-foreground">Harga Nett</span>
            <span className="font-semibold text-lg">
              Rp {calculation.netPrice.toLocaleString('id-ID')}
            </span>
          </div>

          {calculation.margin > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Margin ({margin.type === 'tempo' ? `Tempo ${margin.tempoTerm} hari` : 'Cash'})
              </span>
              <span className="text-accent font-medium">
                +Rp {calculation.margin.toLocaleString('id-ID')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Final Price */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="p-4 rounded-xl gradient-success text-success-foreground mb-4">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-1">Harga Jual per {product.unit}</p>
            <p className="text-3xl font-bold">
              Rp {calculation.finalPrice.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="flex-1 gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="flex-1 gap-2"
            >
              <FileText className="w-4 h-4 text-red-600" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
