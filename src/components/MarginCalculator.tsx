import { ProfitMargin } from '@/types/pricing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Clock, TrendingUp } from 'lucide-react';

interface MarginCalculatorProps {
  margin: ProfitMargin;
  onMarginChange: (margin: ProfitMargin) => void;
  netPrice: number;
}

const tempoOptions = [
  { value: '7', label: '7 Hari' },
  { value: '14', label: '14 Hari' },
  { value: '30', label: '30 Hari' },
  { value: '45', label: '45 Hari' },
  { value: '60', label: '60 Hari' },
  { value: '90', label: '90 Hari' },
];

export function MarginCalculator({ margin, onMarginChange, netPrice }: MarginCalculatorProps) {
  const calculatedMargin =
    margin.marginType === 'percentage'
      ? netPrice * (margin.value / 100)
      : margin.value;

  const finalPrice = netPrice + calculatedMargin;

  return (
    <div className="space-y-5 animate-fade-in">
      <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <TrendingUp className="w-4 h-4 text-accent" />
        Margin Keuntungan
      </Label>

      <RadioGroup
        value={margin.type}
        onValueChange={(value: 'cash' | 'tempo') =>
          onMarginChange({ ...margin, type: value })
        }
        className="grid grid-cols-2 gap-3"
      >
        <Label
          htmlFor="cash"
          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            margin.type === 'cash'
              ? 'border-accent bg-accent/5 shadow-sm'
              : 'border-border hover:border-accent/50'
          }`}
        >
          <RadioGroupItem value="cash" id="cash" />
          <div className="flex items-center gap-2">
            <Wallet className={`w-5 h-5 ${margin.type === 'cash' ? 'text-accent' : 'text-muted-foreground'}`} />
            <div>
              <span className="font-medium">Cash</span>
              <p className="text-xs text-muted-foreground">Bayar langsung</p>
            </div>
          </div>
        </Label>

        <Label
          htmlFor="tempo"
          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            margin.type === 'tempo'
              ? 'border-accent bg-accent/5 shadow-sm'
              : 'border-border hover:border-accent/50'
          }`}
        >
          <RadioGroupItem value="tempo" id="tempo" />
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${margin.type === 'tempo' ? 'text-accent' : 'text-muted-foreground'}`} />
            <div>
              <span className="font-medium">Tempo</span>
              <p className="text-xs text-muted-foreground">Bayar kemudian</p>
            </div>
          </div>
        </Label>
      </RadioGroup>

      {margin.type === 'tempo' && (
        <div className="space-y-2 animate-scale-in">
          <Label className="text-sm text-muted-foreground">Jatuh Tempo</Label>
          <Select
            value={margin.tempoTerm || '30'}
            onValueChange={(value) => onMarginChange({ ...margin, tempoTerm: value })}
          >
            <SelectTrigger className="h-11 bg-card">
              <SelectValue placeholder="Pilih jatuh tempo" />
            </SelectTrigger>
            <SelectContent>
              {tempoOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Tipe Margin</Label>
          <Select
            value={margin.marginType}
            onValueChange={(value: 'percentage' | 'nominal') =>
              onMarginChange({ ...margin, marginType: value })
            }
          >
            <SelectTrigger className="h-11 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Persen (%)</SelectItem>
              <SelectItem value="nominal">Nominal (Rp)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Nilai Margin</Label>
          <div className="relative">
            <Input
              type="number"
              min={0}
              value={margin.value || ''}
              onChange={(e) =>
                onMarginChange({ ...margin, value: parseFloat(e.target.value) || 0 })
              }
              className="h-11 pr-10 bg-card"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {margin.marginType === 'percentage' ? '%' : 'Rp'}
            </span>
          </div>
        </div>
      </div>

      {margin.value > 0 && netPrice > 0 && (
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 animate-scale-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Margin Keuntungan</p>
              <p className="text-lg font-semibold text-accent">
                + Rp {Math.round(calculatedMargin).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Harga Jual</p>
              <p className="text-xl font-bold text-foreground">
                Rp {Math.round(finalPrice).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
