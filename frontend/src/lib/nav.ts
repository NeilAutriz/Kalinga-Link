import type { Role } from './types';
import {
  Home, Info, CalendarDays, Package, HeartHandshake,
  LayoutDashboard, Stethoscope, ClipboardList, type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Where this link is shown. */
  group: 'public' | 'account';
  /**
   * Roles allowed to see this link.
   * - omitted: visible to everyone
   * - empty []: visible to anyone signed in (any role)
   */
  roles?: Role[];
  /** If true, hidden when this user is signed in (e.g. Donate is hidden for organizers in nav). */
  hideForRoles?: Role[];
};

/**
 * Single source of truth for navigation. The Header renders these dynamically
 * based on the current user's role, and ProtectedRoute mirrors the same intent.
 *
 * Scoping rules:
 *  ┌──────────────┬──────┬───────┬─────────┬─────────┬──────────┐
 *  │ Page         │ Pub. │ Volun.│ Donor   │ Health  │ Organizer│
 *  ├──────────────┼──────┼───────┼─────────┼─────────┼──────────┤
 *  │ Home/About   │  ✓   │  ✓    │  ✓      │  ✓      │  ✓       │
 *  │ Events       │  ✓   │  ✓    │  ✓      │  ✓      │  ✓       │
 *  │ Resources    │  ✓   │  ✓    │  ✓      │  —      │  ✓       │
 *  │ Donate       │  ✓   │  ✓    │  ✓      │  —      │  —       │
 *  │ Dashboard    │  —   │  ✓    │  ✓      │  ✓      │  ✓       │
 *  │ Children     │  —   │  —    │  —      │  ✓      │  ✓       │
 *  │ Organizer    │  —   │  —    │  —      │  —      │  ✓       │
 *  └──────────────┴──────┴───────┴─────────┴─────────┴──────────┘
 */
export const NAV: NavItem[] = [
  // ── Public-facing ──────────────────────────────
  { to: '/',          label: 'Home',      icon: Home,          group: 'public' },
  { to: '/about',     label: 'About',     icon: Info,          group: 'public' },
  { to: '/events',    label: 'Events',    icon: CalendarDays,  group: 'public' },
  { to: '/resources', label: 'Resources', icon: Package,       group: 'public', hideForRoles: ['health'] },
  { to: '/donate',    label: 'Donate',    icon: HeartHandshake,group: 'public', hideForRoles: ['health', 'organizer'] },

  // ── Account-area (signed-in only, role-gated) ──
  { to: '/dashboard', label: 'My dashboard', icon: LayoutDashboard,
    group: 'account', roles: ['volunteer', 'donor', 'organizer', 'health'] },

  { to: '/organizer', label: 'Organizer',    icon: ClipboardList,
    group: 'account', roles: ['organizer'] },

  { to: '/children',  label: 'Children',     icon: Stethoscope,
    group: 'account', roles: ['organizer', 'health'] },
];

export const visibleNav = (group: NavItem['group'], role?: Role) =>
  NAV.filter((n) => {
    if (n.group !== group) return false;
    if (role && n.hideForRoles?.includes(role)) return false;
    if (!n.roles) return true;          // public to everyone
    if (!role) return false;            // requires a signed-in user
    return n.roles.includes(role);
  });

/** Where each role lands after login or when /dashboard is requested generically. */
export const HOME_FOR_ROLE: Record<Role, string> = {
  organizer: '/organizer',
  health:    '/children',
  volunteer: '/dashboard',
  donor:     '/dashboard',
};

export const ROLE_HEADLINE: Record<Role, string> = {
  organizer: 'Operations console',
  health:    'Child monitoring',
  volunteer: 'Your sign-ups',
  donor:     'Your pledges',
};

/** Roles that may take a committee slot (volunteer or organizer). */
export const CAN_VOLUNTEER: Role[] = ['volunteer', 'organizer'];
/** Roles that pledge supplies (everyone except health partners). */
export const CAN_DONATE: Role[] = ['volunteer', 'donor', 'organizer'];
