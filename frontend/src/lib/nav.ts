import type { Role } from './types';
import {
  Home, Info, CalendarDays, Package, HeartHandshake,
  LayoutDashboard, Stethoscope, ClipboardList,
  Users, Gift, ShieldCheck, MessageSquare, type LucideIcon,
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
  { to: '/community', label: 'Community', icon: MessageSquare,  group: 'public' },

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
/**
 * Roles that pledge supplies. Health partners and organizers are excluded:
 *   - Health partners don't pledge (they are event partners on the ground).
 *   - Organizers manage pledges; they should use a separate donor account to
 *     give personally so dashboards stay clean.
 * Anonymous (signed-out) visitors can still pledge via the public donate page.
 */
export const CAN_DONATE: Role[] = ['volunteer', 'donor'];

/**
 * Single source of truth for what each role *means* to a person reading the app.
 * Keep these short — they appear in the role badge tooltip, the register form,
 * and the About page. Don't drift from the actual permission rules above.
 */
export type RoleInfo = {
  /** Capitalised display name shown to users (never the lowercase enum). */
  label: string;
  /** One-liner shown next to the badge / on cards. */
  tagline: string;
  /** Plain-language description for the register form & About page. */
  summary: string;
  /** Concrete capabilities (UI affordances), in plain language. */
  can: string[];
  /** Things this role does NOT do — kept short to avoid feeling restrictive. */
  cannot: string[];
  /** Lucide icon used in cards. */
  icon: LucideIcon;
  /** Tailwind classes for the role badge background/text. */
  badgeClass: string;
  /** Tailwind classes for the larger role card accent (icon chip). */
  chipClass: string;
};

export const ROLE_INFO: Record<Role, RoleInfo> = {
  organizer: {
    label: 'Organizer',
    tagline: 'Runs the program',
    summary: 'Plans visits, opens committees, manages resources, and reviews child measurements.',
    can: ['Create & publish events', 'Open committee slots', 'Access child monitoring', 'See operations console'],
    cannot: ['Pledge as a donor (use a donor account for that)'],
    icon: ClipboardList,
    badgeClass: 'bg-phthalo-500 text-milk',
    chipClass:  'bg-phthalo-50 text-phthalo-500',
  },
  health: {
    label: 'Health partner',
    tagline: 'Child monitoring access',
    summary: 'Barangay health workers, RHU midwives, and partner clinicians who log child measurements with guardian consent.',
    can: ['Open the Children page', 'Record measurements', 'See assigned events'],
    cannot: ['Take volunteer committee slots', 'Pledge supplies'],
    icon: Stethoscope,
    badgeClass: 'bg-maximum-500 text-milk',
    chipClass:  'bg-maximum-50 text-maximum-600',
  },
  volunteer: {
    label: 'Volunteer',
    tagline: 'Joins event committees',
    summary: 'Students, parishioners, and staff who sign up for a committee — cooking, measuring, tutorial, art, or documentation — and show up on visit day.',
    can: ['Sign up for committees', 'Pledge supplies', 'Track hours volunteered'],
    cannot: ['Create events', 'Access child records'],
    icon: Users,
    badgeClass: 'bg-maximum-100 text-maximum-700',
    chipClass:  'bg-maximum-50 text-maximum-600',
  },
  donor: {
    label: 'Donor',
    tagline: 'Pledges supplies',
    summary: 'Individuals, orgs, or local businesses who pledge rice, hygiene kits, art supplies, or any listed need for an upcoming visit.',
    can: ['Pledge against any open need', 'See pledge history', 'Cancel a pledge before fulfilment'],
    cannot: ['Take volunteer committee slots', 'Create events'],
    icon: Gift,
    badgeClass: 'bg-bone-200 text-ink-700',
    chipClass:  'bg-bone-100 text-phthalo-500',
  },
};

/** Convenience: ordered list for forms / About page. */
export const ROLE_ORDER: Role[] = ['volunteer', 'donor', 'health', 'organizer'];

/** Role-agnostic disclaimer used on the register form. */
export const ROLE_REVIEW_NOTE =
  'Organizer and health-partner roles are reviewed by an admin before sensitive features unlock. Pick the role that best matches how you plan to help — you can ask an admin to change it later.';

// Keep references to icons used elsewhere lint-clean.
void ShieldCheck;
