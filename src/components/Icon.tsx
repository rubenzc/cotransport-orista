import {
  Backpack,
  Bell,
  Briefcase,
  CalendarDays,
  Car,
  CircleCheck,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  Hand,
  Languages,
  Leaf,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  MonitorSmartphone,
  Moon,
  PartyPopper,
  Pencil,
  Phone,
  Plus,
  Repeat,
  ShoppingCart,
  Star,
  Stethoscope,
  Sun,
  User,
} from 'lucide-react';

// Iconos planos de trazo redondeado; heredan el color del texto (currentColor).
const ICONS = {
  map: MapIcon,
  plus: Plus,
  list: ClipboardList,
  user: User,
  pin: MapPin,
  calendar: CalendarDays,
  repeat: Repeat,
  work: Briefcase,
  medical: Stethoscope,
  shop: ShoppingCart,
  school: Backpack,
  docs: FileText,
  party: PartyPopper,
  car: Car,
  leaf: Leaf,
  check: CircleCheck,
  bell: Bell,
  edit: Pencil,
  phone: Phone,
  chat: MessageCircle,
  eye: Eye,
  eyeOff: EyeOff,
  hand: Hand,
  star: Star,
  languages: Languages,
  sun: Sun,
  moon: Moon,
  auto: MonitorSmartphone,
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const Component = ICONS[name];
  return <Component className={className ? `ico ${className}` : 'ico'} aria-hidden="true" focusable="false" strokeWidth={2.2} />;
}
