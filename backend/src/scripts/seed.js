import 'dotenv/config';
import argon2 from 'argon2';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Committee } from '../models/Committee.js';
import { ResourceNeed } from '../models/ResourceNeed.js';
import { VolunteerSignup } from '../models/VolunteerSignup.js';
import { Pledge } from '../models/Pledge.js';
import { ChildRecord } from '../models/ChildRecord.js';
import { Measurement } from '../models/Measurement.js';

// ============================================================================
// KalingaLink seed — Los Baños, Laguna context
// 22 users · 12 events across 6 program types · 60 committees · ~120 signups
// 132 resource needs · ~250 pledges · 18 child records · 54 measurements
// ============================================================================

const days = (n) => 24 * 60 * 60 * 1000 * n;
const at = (n) => new Date(Date.now() + days(n));
const pick = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

const run = async () => {
  await connectDB();

  console.log('🧹  Wiping previous data…');
  await Promise.all([
    User.deleteMany({}), Event.deleteMany({}), Committee.deleteMany({}),
    ResourceNeed.deleteMany({}), VolunteerSignup.deleteMany({}),
    Pledge.deleteMany({}), ChildRecord.deleteMany({}), Measurement.deleteMany({}),
  ]);

  // ---------- USERS ----------
  console.log('👥  Creating users…');
  const passwordHash = await argon2.hash('password123', { type: argon2.argon2id });
  const usersToCreate = [
    // Organizers (3)
    { email: 'organizer@kalingalink.local', fullName: 'Kristine Villegas',     role: 'organizer', affiliation: 'Sitio Villegas Lead, Brgy. Batong Malake' },
    { email: 'mark@kalingalink.local',      fullName: 'Mark Reyes',            role: 'organizer', affiliation: 'UPLB Community Service Sangguniang' },
    { email: 'rhea@kalingalink.local',      fullName: 'Rhea Bautista',         role: 'organizer', affiliation: 'Brgy. Anos Outreach' },

    // Health workers (3)
    { email: 'health@kalingalink.local',    fullName: 'Dr. Maria Santos',      role: 'health',    affiliation: 'Brgy. Batong Malake Health Center' },
    { email: 'liza.cruz@kalingalink.local', fullName: 'Liza Cruz, RN',         role: 'health',    affiliation: 'UPLB University Health Service' },
    { email: 'noel.dela@kalingalink.local', fullName: 'Noel Dela Peña, RMT',   role: 'health',    affiliation: 'Los Baños Doctors Hospital' },

    // Volunteers (12) — UPLB students & faculty
    { email: 'volunteer@kalingalink.local', fullName: 'Sample Volunteer',      role: 'volunteer', affiliation: 'UPLB BS Bio' },
    { email: 'aira@kalingalink.local',      fullName: 'Aira Mendoza',          role: 'volunteer', affiliation: 'UPLB BS Bio' },
    { email: 'jb@kalingalink.local',        fullName: 'JB Ramos',              role: 'volunteer', affiliation: 'UPLB BS CS' },
    { email: 'patricia@kalingalink.local',  fullName: 'Patricia Lim',          role: 'volunteer', affiliation: 'UPLB BS DC' },
    { email: 'enzo@kalingalink.local',      fullName: 'Enzo Garcia',           role: 'volunteer', affiliation: 'UPLB BSA' },
    { email: 'mika@kalingalink.local',      fullName: 'Mika Tan',              role: 'volunteer', affiliation: 'UPLB BS Stat' },
    { email: 'jp@kalingalink.local',        fullName: 'Juan Paulo Santos',     role: 'volunteer', affiliation: 'UPLB BS HE' },
    { email: 'cathy@kalingalink.local',     fullName: 'Cathy Dela Cruz',       role: 'volunteer', affiliation: 'UPLB BSE' },
    { email: 'rico@kalingalink.local',      fullName: 'Rico Andrada',          role: 'volunteer', affiliation: 'UPLB BS Forestry' },
    { email: 'shey@kalingalink.local',      fullName: 'Shey Villaflor',        role: 'volunteer', affiliation: 'UPLB BS Nutrition' },
    { email: 'kim@kalingalink.local',       fullName: 'Kim Aquino',            role: 'volunteer', affiliation: 'UPLB BS Educ' },
    { email: 'mike@kalingalink.local',      fullName: 'Mike Fernandez',        role: 'volunteer', affiliation: 'IRRI Staff' },

    // Donors (4) — partner orgs / local LB businesses
    { email: 'donor@kalingalink.local',     fullName: 'Sample Donor',          role: 'donor',     affiliation: 'Community Partner' },
    { email: 'umc@kalingalink.local',       fullName: 'UPLB Mountaineers',     role: 'donor',     affiliation: 'UPLB Student Org' },
    { email: 'lbcc@kalingalink.local',      fullName: 'Los Baños Coffee Club', role: 'donor',     affiliation: 'Local Business · Lopez Ave' },
    { email: 'irri@kalingalink.local',      fullName: 'IRRI Staff Council',    role: 'donor',     affiliation: 'IRRI · Brgy. Maahas' },
  ];

  const users = await User.create(usersToCreate.map((u) => ({ ...u, passwordHash })));
  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  const organizers = users.filter((u) => u.role === 'organizer');
  const healths    = users.filter((u) => u.role === 'health');
  const volunteers = users.filter((u) => u.role === 'volunteer');
  const donors     = users.filter((u) => u.role === 'donor');
  const organizer  = byEmail['organizer@kalingalink.local'];
  const health     = byEmail['health@kalingalink.local'];
  console.log(`   ✓ ${users.length} users (${organizers.length} organizers, ${healths.length} health, ${volunteers.length} volunteers, ${donors.length} donors)`);

  // ---------- EVENTS (12 programs) ----------
  console.log('📅  Creating events…');
  /** Helpers for a couple of organizers / locations */
  const ORG = organizer._id;
  const RHEA = byEmail['rhea@kalingalink.local']._id;
  const MARK = byEmail['mark@kalingalink.local']._id;

  const eventSeeds = [
    // ----- COMPLETED (track record) -----
    {
      title: 'Sitio Villegas Feeding — January (baseline)',
      description: 'Year-opener feeding & re-baseline of growth measurements for tracked children.',
      program: 'feeding', barangay: 'Batong Malake', sitio: 'Sitio Villegas',
      partnerOrg: 'Brgy. Batong Malake', location: 'Sitio Villegas Covered Court',
      eventDate: at(-110), startTime: '09:00', endTime: '12:00', targetChildren: 28, status: 'completed', createdBy: ORG,
    },
    {
      title: 'Sitio Villegas Feeding — February',
      description: 'Second cycle. Introduced bubbles & street-art committees alongside food prep.',
      program: 'feeding', barangay: 'Batong Malake', sitio: 'Sitio Villegas',
      partnerOrg: 'UPLB Community Service Sangguniang', location: 'Sitio Villegas Covered Court',
      eventDate: at(-78), startTime: '09:00', endTime: '12:00', targetChildren: 30, status: 'completed', createdBy: ORG,
    },
    {
      title: 'Brgy. Anos Deworming & Vitamins Drive',
      description: 'Quarterly deworming and vitamin A distribution coordinated with the Los Baños Rural Health Unit.',
      program: 'health', barangay: 'Anos', sitio: 'Sitio Maligaya',
      partnerOrg: 'LB Rural Health Unit', location: 'Brgy. Anos Health Center',
      eventDate: at(-46), startTime: '08:00', endTime: '11:00', targetChildren: 60, status: 'completed', createdBy: RHEA,
    },
    {
      title: 'Sitio Villegas Feeding — March (outcome)',
      description: 'Outcome cycle for Q1. 30 children served · 18 improved · 22 volunteers attended.',
      program: 'feeding', barangay: 'Batong Malake', sitio: 'Sitio Villegas',
      partnerOrg: 'UPLB Mountaineers', location: 'Sitio Villegas Covered Court',
      eventDate: at(-18), startTime: '09:00', endTime: '12:00', targetChildren: 30, status: 'completed', createdBy: ORG,
    },

    // ----- ONGOING / IMMEDIATE (this week) -----
    {
      title: 'Reading Buddies — Brgy. Bambang',
      description: 'After-school tutorial in Filipino & English literacy for grades 1–3, partnered with Bambang Elementary.',
      program: 'learning', barangay: 'Bambang', sitio: 'Purok 3',
      partnerOrg: 'Bambang Elementary School', location: 'Bambang Elementary School Library',
      eventDate: at(2), startTime: '14:00', endTime: '17:00', targetChildren: 25, status: 'published', createdBy: MARK,
    },

    // ----- PUBLISHED (next 30 days) -----
    {
      title: 'Sitio Villegas Feeding — May',
      description: 'Monthly feeding and child development support, in partnership with Ms. Kristine and the Sitio Villegas community since 2023.',
      program: 'feeding', barangay: 'Batong Malake', sitio: 'Sitio Villegas',
      partnerOrg: 'Brgy. Batong Malake', location: 'Sitio Villegas Covered Court',
      eventDate: at(8), startTime: '09:00', endTime: '12:00', targetChildren: 30, status: 'published', createdBy: ORG,
    },
    {
      title: 'Mt. Makiling Trailhead Cleanup',
      description: 'Half-day cleanup along the Mudspring trailhead with segregation training, in coordination with MENRO.',
      program: 'environment', barangay: 'Bayog', sitio: 'Trailhead Sector',
      partnerOrg: 'LB MENRO · UPLB Mountaineers', location: 'Mt. Makiling Mudspring Trailhead',
      eventDate: at(12), startTime: '06:30', endTime: '11:00', targetChildren: 0, status: 'published', createdBy: MARK,
    },
    {
      title: 'Brgy. Maahas Hilot & BP Screening',
      description: 'Free blood-pressure screening and basic check-ups for senior citizens, with IRRI medical volunteers.',
      program: 'health', barangay: 'Maahas', sitio: 'Phase 1',
      partnerOrg: 'IRRI Staff Council · LB Doctors Hospital', location: 'Brgy. Maahas Multi-purpose Hall',
      eventDate: at(15), startTime: '08:30', endTime: '12:00', targetChildren: 0, status: 'published', createdBy: RHEA,
    },
    {
      title: 'Pahiyas-themed Art Day — Brgy. Tadlac',
      description: 'Mural painting and recycled-materials art with kids near Tadlac Lake. Tied to the Pahiyas season.',
      program: 'youth', barangay: 'Tadlac', sitio: 'Lakeside',
      partnerOrg: 'Tadlac Lake Stewards', location: 'Tadlac Lakeside Pavilion',
      eventDate: at(20), startTime: '13:00', endTime: '17:00', targetChildren: 35, status: 'published', createdBy: MARK,
    },
    {
      title: 'Hilot at Hapag — Sitio Villegas June',
      description: 'June feeding bundled with maternal nutrition counseling for guardians.',
      program: 'feeding', barangay: 'Batong Malake', sitio: 'Sitio Villegas',
      partnerOrg: 'UPLB BS Nutrition Society', location: 'Sitio Villegas Covered Court',
      eventDate: at(38), startTime: '09:00', endTime: '12:30', targetChildren: 32, status: 'published', createdBy: ORG,
    },

    // ----- DRAFT (planning) -----
    {
      title: 'Tahanan Livelihood Workshop — Brgy. Putho-Tuntungin',
      description: 'Soap-making and budgeting workshop for guardians of children we monitor. Two-Saturday series.',
      program: 'livelihood', barangay: 'Putho-Tuntungin', sitio: 'Purok 2',
      partnerOrg: 'UPLB BS HE · Brgy. Putho-Tuntungin', location: 'Brgy. Putho-Tuntungin Hall',
      eventDate: at(55), startTime: '09:00', endTime: '15:00', targetChildren: 0, status: 'draft', createdBy: MARK,
    },
    {
      title: 'Christmas Feeding & Toy Drive — Sitio Villegas',
      description: 'December special with extended art, games, and a community gift exchange for tracked children.',
      program: 'feeding', barangay: 'Batong Malake', sitio: 'Sitio Villegas',
      partnerOrg: 'Los Baños Coffee Club · UPLB Mountaineers', location: 'Sitio Villegas Covered Court',
      eventDate: at(75), startTime: '09:00', endTime: '14:00', targetChildren: 40, status: 'draft', createdBy: ORG,
    },
  ];

  const events = await Event.create(eventSeeds);
  console.log(`   ✓ ${events.length} events`);

  // ---------- COMMITTEES ----------
  // Per-program committee templates so each event makes sense.
  console.log('👨‍🍳  Creating committees…');
  const committeeTemplates = {
    feeding: [
      { name: 'Food Preparation', description: 'Cook and pack meals onsite.',                  slotCount: 6 },
      { name: 'Measuring',        description: 'Record height/weight (with health lead).',     slotCount: 3 },
      { name: 'Bubbles & Games',  description: 'Engage kids during waiting time.',             slotCount: 4 },
      { name: 'Street Art',       description: 'Lead the community art activity.',             slotCount: 4 },
      { name: 'Documentation',    description: 'Photos and notes for reporting.',              slotCount: 2 },
    ],
    health: [
      { name: 'Triage',           description: 'Sign in beneficiaries and route to stations.',  slotCount: 3 },
      { name: 'BP & Vitals',      description: 'Take blood pressure and basic vitals.',         slotCount: 4 },
      { name: 'Counseling',       description: 'One-on-one health & nutrition counseling.',     slotCount: 3 },
      { name: 'Documentation',    description: 'Record-keeping and consent forms.',             slotCount: 2 },
    ],
    learning: [
      { name: 'Reading Buddy',    description: 'Pair up 1-on-1 with a learner for the session.', slotCount: 8 },
      { name: 'Materials Prep',   description: 'Prepare flashcards, worksheets, and snacks.',    slotCount: 3 },
      { name: 'Snack & Logistics',description: 'Distribute snacks and manage transitions.',      slotCount: 3 },
    ],
    environment: [
      { name: 'Trail Sweep',      description: 'Pick up litter along assigned trail segment.',   slotCount: 10 },
      { name: 'Segregation Lead', description: 'Sort collected waste & log volumes.',            slotCount: 4 },
      { name: 'Safety Marshal',   description: 'Keep volunteers safe; first-aid trained.',       slotCount: 3 },
    ],
    livelihood: [
      { name: 'Workshop Facilitator', description: 'Guide guardians through each module.',       slotCount: 4 },
      { name: 'Materials & Setup',     description: 'Prep ingredients, jigs, and worksheets.',   slotCount: 3 },
      { name: 'Childcare Corner',      description: 'Mind the kids so guardians can focus.',     slotCount: 4 },
    ],
    youth: [
      { name: 'Art Lead',         description: 'Lead the art / mural activity.',                 slotCount: 4 },
      { name: 'Materials & Setup',description: 'Prep paint, brushes, and recycled materials.',   slotCount: 3 },
      { name: 'Games & Energy',   description: 'Run icebreakers and keep kids engaged.',         slotCount: 4 },
      { name: 'Documentation',    description: 'Photos and consent-respectful storytelling.',    slotCount: 2 },
    ],
  };

  const allCommittees = [];
  for (const ev of events) {
    const tpl = committeeTemplates[ev.program] ?? committeeTemplates.feeding;
    const created = await Committee.create(tpl.map((c) => ({
      ...c,
      eventId: ev._id,
      leadUserId: c.name === 'Measuring' || c.name === 'BP & Vitals' || c.name === 'Counseling'
        ? health._id
        : ev.createdBy,
    })));
    allCommittees.push({ event: ev, committees: created });
  }
  console.log(`   ✓ ${allCommittees.flatMap((g) => g.committees).length} committees`);

  // ---------- VOLUNTEER SIGNUPS ----------
  console.log('🙋  Creating signups…');
  const signups = [];
  for (const { event: ev, committees } of allCommittees) {
    const isPast = ev.status === 'completed' || ev.status === 'ongoing';
    const isImminent = !isPast && ev.eventDate.getTime() - Date.now() < days(20);
    for (const c of committees) {
      const fillRate = isPast ? rand(0.75, 1.0) : isImminent ? rand(0.5, 0.9) : rand(0.2, 0.5);
      const fill = Math.min(c.slotCount, Math.round(c.slotCount * fillRate));
      for (const v of pick(volunteers, fill)) {
        signups.push({
          committeeId: c._id, userId: v._id,
          status: isPast ? (Math.random() < 0.92 ? 'attended' : 'no_show') : 'signed_up',
        });
      }
    }
  }
  const seen = new Set();
  const dedup = signups.filter((s) => {
    const k = String(s.committeeId) + String(s.userId);
    if (seen.has(k)) return false; seen.add(k); return true;
  });
  await VolunteerSignup.insertMany(dedup, { ordered: false }).catch(() => {});
  console.log(`   ✓ ${dedup.length} signups`);

  // ---------- RESOURCE NEEDS ----------
  console.log('📦  Creating resource needs…');
  const resourceTemplates = {
    feeding: [
      { itemName: 'Rice (well-milled)',  category: 'food',      quantityNeeded: 6,  unit: 'kg' },
      { itemName: 'Chicken',             category: 'food',      quantityNeeded: 4,  unit: 'kg' },
      { itemName: 'Vegetables (sayote/pechay)', category: 'food', quantityNeeded: 4, unit: 'kg' },
      { itemName: 'Cooking oil',         category: 'food',      quantityNeeded: 2,  unit: 'L'  },
      { itemName: 'Bottled water',       category: 'food',      quantityNeeded: 30, unit: 'pcs' },
      { itemName: 'Disposable bowls',    category: 'utensils',  quantityNeeded: 40, unit: 'pcs' },
      { itemName: 'Spoons & forks',      category: 'utensils',  quantityNeeded: 40, unit: 'set' },
      { itemName: 'Crayons',             category: 'art',       quantityNeeded: 10, unit: 'box' },
      { itemName: 'Bond paper',          category: 'art',       quantityNeeded: 1,  unit: 'ream' },
      { itemName: 'Hygiene kits',        category: 'hygiene',   quantityNeeded: 30, unit: 'pcs' },
      { itemName: 'Transport (van)',     category: 'transport', quantityNeeded: 1,  unit: 'trip' },
    ],
    health: [
      { itemName: 'Deworming tablets',   category: 'other',     quantityNeeded: 60, unit: 'pcs' },
      { itemName: 'Vitamin A',           category: 'other',     quantityNeeded: 60, unit: 'pcs' },
      { itemName: 'Alcohol (70%)',       category: 'hygiene',   quantityNeeded: 4,  unit: 'L' },
      { itemName: 'Cotton & gauze',      category: 'hygiene',   quantityNeeded: 1,  unit: 'set' },
      { itemName: 'BP monitor',          category: 'equipment', quantityNeeded: 2,  unit: 'pc' },
      { itemName: 'Snacks for waiting',  category: 'food',      quantityNeeded: 60, unit: 'pcs' },
      { itemName: 'Transport (van)',     category: 'transport', quantityNeeded: 1,  unit: 'trip' },
    ],
    learning: [
      { itemName: 'Storybooks (Filipino)', category: 'art',     quantityNeeded: 10, unit: 'pcs' },
      { itemName: 'Storybooks (English)',  category: 'art',     quantityNeeded: 10, unit: 'pcs' },
      { itemName: 'Pencils',               category: 'art',     quantityNeeded: 30, unit: 'pcs' },
      { itemName: 'Notebooks',             category: 'art',     quantityNeeded: 30, unit: 'pcs' },
      { itemName: 'Snacks (biscuits)',     category: 'food',    quantityNeeded: 30, unit: 'pcs' },
      { itemName: 'Juice packs',           category: 'food',    quantityNeeded: 30, unit: 'pcs' },
    ],
    environment: [
      { itemName: 'Trash bags (large)',  category: 'other',     quantityNeeded: 30, unit: 'pcs' },
      { itemName: 'Work gloves',         category: 'other',     quantityNeeded: 25, unit: 'pair' },
      { itemName: 'Trash pickers',       category: 'equipment', quantityNeeded: 10, unit: 'pc' },
      { itemName: 'Bottled water',       category: 'food',      quantityNeeded: 40, unit: 'pcs' },
      { itemName: 'Energy snacks',       category: 'food',      quantityNeeded: 25, unit: 'pcs' },
      { itemName: 'First-aid kit',       category: 'equipment', quantityNeeded: 1,  unit: 'set' },
    ],
    livelihood: [
      { itemName: 'Soap-making base',    category: 'other',     quantityNeeded: 5,  unit: 'kg' },
      { itemName: 'Essential oils',      category: 'other',     quantityNeeded: 5,  unit: 'pcs' },
      { itemName: 'Molds',               category: 'equipment', quantityNeeded: 10, unit: 'pcs' },
      { itemName: 'Worksheets (printed)',category: 'art',       quantityNeeded: 25, unit: 'pcs' },
      { itemName: 'Lunch for participants', category: 'food',   quantityNeeded: 25, unit: 'pcs' },
    ],
    youth: [
      { itemName: 'Acrylic paint',       category: 'art',       quantityNeeded: 20, unit: 'pcs' },
      { itemName: 'Paint brushes',       category: 'art',       quantityNeeded: 30, unit: 'pcs' },
      { itemName: 'Recycled materials',  category: 'art',       quantityNeeded: 1,  unit: 'set' },
      { itemName: 'Drinking water',      category: 'food',      quantityNeeded: 35, unit: 'pcs' },
      { itemName: 'Snacks',              category: 'food',      quantityNeeded: 35, unit: 'pcs' },
    ],
  };

  const allResources = [];
  for (const ev of events) {
    const tpl = resourceTemplates[ev.program] ?? resourceTemplates.feeding;
    const created = await ResourceNeed.create(tpl.map((r) => ({ ...r, eventId: ev._id })));
    allResources.push({ event: ev, resources: created });
  }
  console.log(`   ✓ ${allResources.flatMap((g) => g.resources).length} resource needs`);

  // ---------- PLEDGES ----------
  console.log('🎁  Creating pledges…');
  const pledges = [];
  for (const { event: ev, resources } of allResources) {
    const isPast = ev.status === 'completed' || ev.status === 'ongoing';
    const isImminent = !isPast && ev.eventDate.getTime() - Date.now() < days(20);
    for (const r of resources) {
      const fillRate = isPast ? rand(0.9, 1.0) : isImminent ? rand(0.4, 0.9) : rand(0.1, 0.5);
      let toFill = Math.min(r.quantityNeeded, Math.round(r.quantityNeeded * fillRate));
      while (toFill > 0) {
        const chunk = Math.max(1, Math.min(toFill, Math.ceil(r.quantityNeeded / 3)));
        const donor = donors[Math.floor(Math.random() * donors.length)];
        pledges.push({
          resourceNeedId: r._id, donorUserId: donor._id, donorName: donor.fullName,
          donorContact: donor.email, quantity: chunk,
          status: isPast ? 'received' : (Math.random() < 0.6 ? 'received' : 'pledged'),
          receivedAt: isPast ? ev.eventDate : null,
        });
        toFill -= chunk;
      }
    }
  }
  await Pledge.insertMany(pledges);
  console.log(`   ✓ ${pledges.length} pledges`);

  // ---------- CHILDREN ----------
  console.log('🧒  Creating child records…');
  const childrenSeed = [
    { firstName: 'Maria',     age: 5, sex: 'F', guardianName: 'Ms. Reyes',    guardianContact: '0917-100-0001' },
    { firstName: 'Joaquin',   age: 6, sex: 'M', guardianName: 'Mr. Cruz',     guardianContact: '0917-100-0002' },
    { firstName: 'Liza',      age: 4, sex: 'F', guardianName: 'Ms. Tan',      guardianContact: '0917-100-0003' },
    { firstName: 'Noah',      age: 7, sex: 'M', guardianName: 'Ms. Garcia',   guardianContact: '0917-100-0004' },
    { firstName: 'Sofia',     age: 5, sex: 'F', guardianName: 'Mr. Lim',      guardianContact: '0917-100-0005' },
    { firstName: 'Mateo',     age: 6, sex: 'M', guardianName: 'Ms. Ramos',    guardianContact: '0917-100-0006' },
    { firstName: 'Andrea',    age: 3, sex: 'F', guardianName: 'Ms. Aquino',   guardianContact: '0917-100-0007' },
    { firstName: 'Diego',     age: 8, sex: 'M', guardianName: 'Mr. Reyes',    guardianContact: '0917-100-0008' },
    { firstName: 'Bea',       age: 4, sex: 'F', guardianName: 'Ms. Castro',   guardianContact: '0917-100-0009' },
    { firstName: 'Iñigo',     age: 7, sex: 'M', guardianName: 'Mr. Mendoza',  guardianContact: '0917-100-0010' },
    { firstName: 'Althea',    age: 5, sex: 'F', guardianName: 'Ms. Bautista', guardianContact: '0917-100-0011' },
    { firstName: 'Carlos',    age: 6, sex: 'M', guardianName: 'Mr. Villaflor',guardianContact: '0917-100-0012' },
    { firstName: 'Daniela',   age: 4, sex: 'F', guardianName: 'Ms. Andrada',  guardianContact: '0917-100-0013' },
    { firstName: 'Emman',     age: 8, sex: 'M', guardianName: 'Mr. Pascual',  guardianContact: '0917-100-0014' },
    { firstName: 'Francheska',age: 3, sex: 'F', guardianName: 'Ms. Ocampo',   guardianContact: '0917-100-0015' },
    { firstName: 'Gio',       age: 5, sex: 'M', guardianName: 'Mr. Soriano',  guardianContact: '0917-100-0016' },
    { firstName: 'Hannah',    age: 7, sex: 'F', guardianName: 'Ms. Lazaro',   guardianContact: '0917-100-0017' },
    { firstName: 'Isaiah',    age: 4, sex: 'M', guardianName: 'Mr. Manalo',   guardianContact: '0917-100-0018' },
  ];
  const children = await ChildRecord.create(
    childrenSeed.map((c) => ({ ...c, consentGiven: true, consentDate: at(-115), createdBy: health._id })),
  );
  console.log(`   ✓ ${children.length} child records`);

  // ---------- MEASUREMENTS ----------
  console.log('📏  Creating measurements (3 cycles per child)…');
  // Use the 3 completed feeding events as the measurement cycles.
  const completedFeeding = events.filter((e) => e.program === 'feeding' && e.status === 'completed');
  const [c1, c2, c3] = completedFeeding;

  const measurements = [];
  for (const child of children) {
    const baseH = 90 + child.age * 6 + rand(0, 5);
    const baseW = 12 + child.age * 1.8 + rand(0, 2);

    measurements.push({
      childId: child._id, eventId: c1._id, recordedBy: health._id,
      heightCm: +baseH.toFixed(1), weightKg: +baseW.toFixed(1),
      status: 'baseline', recordedAt: c1.eventDate, notes: 'Baseline measurement.',
    });
    measurements.push({
      childId: child._id, eventId: c2._id, recordedBy: health._id,
      heightCm: +(baseH + 0.5 + rand(0, 0.6)).toFixed(1),
      weightKg: +(baseW + 0.2 + rand(0, 0.5)).toFixed(1),
      status: 'monitored', recordedAt: c2.eventDate,
    });
    const o = Math.random();
    measurements.push({
      childId: child._id, eventId: c3._id, recordedBy: health._id,
      heightCm: +(baseH + 1.0 + rand(0, 0.8)).toFixed(1),
      weightKg: +(baseW + 0.5 + rand(0, 0.8)).toFixed(1),
      status: o < 0.6 ? 'improved' : o < 0.9 ? 'no_change' : 'declined',
      recordedAt: c3.eventDate,
      notes: o < 0.6 ? 'Steady improvement noted.' : '',
    });
  }
  await Measurement.insertMany(measurements);
  console.log(`   ✓ ${measurements.length} measurements`);

  console.log('\n✅ Seed complete.');
  console.log('\n🔐 Sample logins (password: password123):');
  console.log('   organizer@kalingalink.local  · Kristine Villegas (organizer)');
  console.log('   mark@kalingalink.local       · Mark Reyes (organizer · UPLB CSS)');
  console.log('   health@kalingalink.local     · Dr. Maria Santos (health)');
  console.log('   volunteer@kalingalink.local  · Sample Volunteer (volunteer · UPLB)');
  console.log('   irri@kalingalink.local       · IRRI Staff Council (donor)');

  await mongoose.disconnect();
};

run().catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); });
