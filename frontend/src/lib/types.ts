export type Role = 'organizer' | 'health' | 'volunteer' | 'donor';

export type User = {
  id?: string;
  _id?: string;
  email: string;
  fullName: string;
  role: Role;
  affiliation?: string;
};

export type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
export type Program = 'feeding' | 'health' | 'learning' | 'environment' | 'livelihood' | 'youth';

export type EventItem = {
  id: string;
  _id?: string;
  title: string;
  description: string;
  program?: Program;
  barangay?: string;
  sitio?: string;
  partnerOrg?: string;
  location: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  targetChildren: number;
  status: EventStatus;
};

export type Committee = {
  id: string;
  _id?: string;
  eventId: string;
  name: string;
  description: string;
  slotCount: number;
  filled: number;
};

export type ResourceCategory =
  | 'food' | 'utensils' | 'art' | 'hygiene' | 'equipment' | 'transport' | 'other';

export type ResourceNeed = {
  id: string;
  _id?: string;
  eventId: string;
  itemName: string;
  category: ResourceCategory;
  quantityNeeded: number;
  quantityReceived: number;
  unit: string;
};

export type Pledge = {
  id: string;
  _id?: string;
  resourceNeedId: string;
  donorName: string;
  quantity: number;
  status: 'pledged' | 'received' | 'cancelled';
  createdAt: string;
};

export type ChildRecord = {
  id: string;
  _id?: string;
  anonCode: string;
  firstName: string;
  age: number;
  sex: 'M' | 'F' | 'X';
  guardianName: string;
  consentGiven: boolean;
  lastStatus: 'baseline' | 'monitored' | 'improved' | 'no_change' | 'declined';
  lastMeasuredAt: string | null;
  lastHeightCm?: number;
  lastWeightKg?: number;
};

export type ImpactStats = {
  eventsCompleted: number;
  childrenServed: number;
  childrenImproved: number;
  volunteersEngaged: number;
  pledgesReceived: number;
  hoursVolunteered: number;
};

/** Normalize a Mongo doc with `_id` to a UI shape with `id`. */
export const norm = <T extends { _id?: string; id?: string }>(x: T): T & { id: string } => ({
  ...x, id: (x.id ?? x._id) as string,
});

export const PROGRAM_LABELS: Record<Program, string> = {
  feeding: 'Feeding',
  health: 'Health',
  learning: 'Learning',
  environment: 'Environment',
  livelihood: 'Livelihood',
  youth: 'Youth & Arts',
};

export const PROGRAM_TONES: Record<Program, string> = {
  feeding: 'bg-maximum-50 text-maximum-700',
  health: 'bg-rose-50 text-rose-700',
  learning: 'bg-amber-50 text-amber-700',
  environment: 'bg-emerald-50 text-emerald-700',
  livelihood: 'bg-indigo-50 text-indigo-700',
  youth: 'bg-fuchsia-50 text-fuchsia-700',
};
