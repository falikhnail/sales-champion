import { Product, Region } from '@/types/pricing';

export const sampleProducts: Product[] = [
  { id: '1', name: 'Semen Portland 50kg', category: 'Material Bangunan', basePrice: 75000, unit: 'sak' },
  { id: '2', name: 'Besi Beton 10mm', category: 'Material Bangunan', basePrice: 125000, unit: 'batang' },
  { id: '3', name: 'Cat Tembok 5L', category: 'Cat & Finishing', basePrice: 185000, unit: 'galon' },
  { id: '4', name: 'Keramik 40x40', category: 'Lantai', basePrice: 65000, unit: 'm²' },
  { id: '5', name: 'Pipa PVC 4"', category: 'Pipa & Fitting', basePrice: 95000, unit: 'batang' },
  { id: '6', name: 'Kabel NYY 2.5mm', category: 'Elektrikal', basePrice: 850000, unit: 'roll' },
  { id: '7', name: 'Atap Galvalum', category: 'Atap', basePrice: 125000, unit: 'lembar' },
  { id: '8', name: 'Triplek 18mm', category: 'Kayu', basePrice: 285000, unit: 'lembar' },
];

export const sampleRegions: Region[] = [
  // Region A
  { id: 'a1', name: 'Kudus', priceMultiplier: 1.0, region: 'A' },
  { id: 'a2', name: 'Semarang', priceMultiplier: 1.0, region: 'A' },
  { id: 'a3', name: 'Pati', priceMultiplier: 1.0, region: 'A' },
  { id: 'a4', name: 'Rembang', priceMultiplier: 1.0, region: 'A' },
  // Region B (+5%)
  { id: 'b1', name: 'Kendal', priceMultiplier: 1.05, region: 'B' },
  { id: 'b2', name: 'Kaliwungu', priceMultiplier: 1.05, region: 'B' },
  { id: 'b3', name: 'Batang', priceMultiplier: 1.05, region: 'B' },
  { id: 'b4', name: 'Pekalongan', priceMultiplier: 1.05, region: 'B' },
  { id: 'b5', name: 'Tuban', priceMultiplier: 1.05, region: 'B' },
  { id: 'b6', name: 'Bangilan', priceMultiplier: 1.05, region: 'B' },
  { id: 'b7', name: 'Bojonegoro', priceMultiplier: 1.05, region: 'B' },
  { id: 'b8', name: 'Blora', priceMultiplier: 1.05, region: 'B' },
  { id: 'b9', name: 'Ngawi', priceMultiplier: 1.05, region: 'B' },
  { id: 'b10', name: 'Madiun', priceMultiplier: 1.05, region: 'B' },
];
