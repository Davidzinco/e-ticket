export interface EventTimestamp {
  seconds: number;
  nanoseconds?: number;
}

export interface TicketPackageInterface {
  id: string;
  name: string;
  price: number;
  ticket?: number;
  quota?: number;
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
  packages?: TicketPackageInterface[];
  ticket_types?: TicketPackageInterface[];
  src: string;
  sub_title: string;
  ticket: number;
  timestamp: EventTimestamp;
  title: string;
  closeTime: EventTimestamp;
}
