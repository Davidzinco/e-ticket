import { Timestamp } from "firebase/firestore";

export interface TicketPackageInterface {
  id: string;
  name: string;
  price: number;
  badge?: string;
  badgeBg?: string;
  badgeText?: string;
  description?: string;
}

export interface EventInterface {
  id: string;
  description: string;
  isSoldOut: boolean;
  location: string;
  price: number;
  price_festival?: number;
  price_vip?: number;
  packages?: TicketPackageInterface[];
  ticket_types?: TicketPackageInterface[];
  src: string;
  sub_title: string;
  ticket: number;
  timestamp: Timestamp;
  title: string;
  closeTime: Timestamp;
}
