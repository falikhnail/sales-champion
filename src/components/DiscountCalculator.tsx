import { Discount } from '@/types/pricing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Percent, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiscountCalculatorProps {
  discounts: Discount[];
  onDiscountsChange: (discounts: Discount[]) => void;
  basePrice: number;
}

export function DiscountCalculator({ discounts, onDiscountsChange, basePrice }: DiscountCalculatorProps) {
  const updateDiscount = (id: number, updates: Partial<Discount>) => {
    onDiscountsChange(
      discounts.map(d => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const addDiscount = () => {
    if (discounts.length < 4) {
      onDiscountsChange([
        ...discounts,
        {
          id: discounts.length + 1,
          label: `Diskon ${discounts.length + 1}`,
          type: 'percentage',
          value: 0,
          enabled: true,
        },
      ]);
    }
  };

  const removeDiscount = (id: number) => {
    onDiscountsChange(discounts.filter(d => d.id !== id));
  };

  const calculateRunningPrice = (upToIndex: number): number => {
    let price = basePrice;
    for (let i = 0; i <= upToIndex; i++) {
      const d = discounts[i];
      if (d.enabled && d.value > 0) {
        if (d.type === 'percentage') {
          price = price * (1 - d.value / 100);
        } else {
          price = price - d.value;
        }
      }
    }
    return Math.max(0, price);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Percent className="w-4 h-4 text-primary" />
          Diskon Bertingkat
        </Label>
        {discounts.length < 4 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addDiscount}
            className="h-8 gap-1 text-xs"
          >
            <Plus className="w-3 h-3" />
            Tambah Diskon
          </Button>
        )}
      </div>

      {discounts.length === 0 ? (
        <div className="p-6 rounded-lg border-2 border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">Belum ada diskon</p>
          <Button
            variant="outline"
            size="sm"
            onClick={addDiscount}
            className="mt-2 gap-1"
          >
            <Plus className="w-3 h-3" />
            Tambah Diskon Pertama
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map((discount, index) => (
            <div
              key={discount.id}
              className={`p-4 rounded-lg border transition-all animate-slide-up ${
                discount.enabled
                  ? 'bg-card border-primary/20 shadow-sm'
                  : 'bg-muted/50 border-border opacity-60'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                <Switch
                  checked={discount.enabled}
                  onCheckedChange={(checked) => updateDiscount(discount.id, { enabled: checked })}
                  className="mt-1"
                />

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={discount.label}
                      onChange={(e) => updateDiscount(discount.id, { label: e.target.value })}
                      className="h-8 text-sm font-medium bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                      placeholder="Label diskon..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={discount.type}
                      onValueChange={(value: 'percentage' | 'nominal') =>
                        updateDiscount(discount.id, { type: value })
                      }
                    >
                      <SelectTrigger className="h-9 w-28 bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Persen (%)</SelectItem>
                        <SelectItem value="nominal">Rupiah (Rp)</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min={0}
                        value={discount.value || ''}
                        onChange={(e) =>
                          updateDiscount(discount.id, { value: parseFloat(e.target.value) || 0 })
                        }
                        className="h-9 pr-10 bg-secondary/50"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {discount.type === 'percentage' ? '%' : 'Rp'}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDiscount(discount.id)}
                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>

                  {discount.enabled && discount.value > 0 && basePrice > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Setelah {discount.label}:{' '}
                      <span className="font-semibold text-foreground">
                        Rp {Math.round(calculateRunningPrice(index)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
