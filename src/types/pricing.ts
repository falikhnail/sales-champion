export interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  unit: string;
}

export interface Region {
  id: string;
  name: string;
  priceMultiplier: number;
  region: 'A' | 'B';
}

export interface Discount {
  id: number;
  label: string;
  type: 'percentage' | 'nominal';
  value: number;
  enabled: boolean;
}

export interface ProfitMargin {
  type: 'cash' | 'tempo';
  marginType: 'percentage' | 'nominal';
  value: number;
  tempoTerm?: string;
}

export interface PriceCalculation {
  basePrice: number;
  regionPrice: number;
  discounts: { label: string; amount: number }[];
  netPrice: number;
  margin: number;
  finalPrice: number;
}
