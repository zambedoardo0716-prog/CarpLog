import {
  BarChart3,
  History,
  Home,
  MapPinned,
  PlusCircle,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navigation: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/nuova-cattura", label: "Cattura", icon: PlusCircle },
  { href: "/storico", label: "Storico", icon: History },
  { href: "/statistiche", label: "Stats", icon: BarChart3 },
  { href: "/spot", label: "Spot", icon: MapPinned },
];
