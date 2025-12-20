import { 
  Sofa, 
  Armchair, 
  BedDouble, 
  Table, 
  DoorClosed,
  Lamp,
  BookOpen,
  Tv,
  Bath,
  UtensilsCrossed,
  Package,
  type LucideIcon
} from 'lucide-react';

export interface FurnitureCategory {
  name: string;
  icon: LucideIcon;
  color: string;
}

export const FURNITURE_CATEGORIES: FurnitureCategory[] = [
  { name: 'Sofa', icon: Sofa, color: 'bg-amber-500/20 text-amber-600' },
  { name: 'Kursi', icon: Armchair, color: 'bg-orange-500/20 text-orange-600' },
  { name: 'Meja', icon: Table, color: 'bg-emerald-500/20 text-emerald-600' },
  { name: 'Lemari', icon: DoorClosed, color: 'bg-blue-500/20 text-blue-600' },
  { name: 'Tempat Tidur', icon: BedDouble, color: 'bg-purple-500/20 text-purple-600' },
  { name: 'Lampu', icon: Lamp, color: 'bg-yellow-500/20 text-yellow-600' },
  { name: 'Rak Buku', icon: BookOpen, color: 'bg-rose-500/20 text-rose-600' },
  { name: 'Meja TV', icon: Tv, color: 'bg-slate-500/20 text-slate-600' },
  { name: 'Kamar Mandi', icon: Bath, color: 'bg-cyan-500/20 text-cyan-600' },
  { name: 'Dapur', icon: UtensilsCrossed, color: 'bg-red-500/20 text-red-600' },
];

export function getCategoryIcon(categoryName: string): LucideIcon {
  const category = FURNITURE_CATEGORIES.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  return category?.icon || Package;
}

export function getCategoryColor(categoryName: string): string {
  const category = FURNITURE_CATEGORIES.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  return category?.color || 'bg-secondary text-primary';
}

export function getCategoryData(categoryName: string): FurnitureCategory | null {
  return FURNITURE_CATEGORIES.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase()
  ) || null;
}