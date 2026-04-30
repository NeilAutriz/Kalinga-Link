import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, HeartHandshake, Users, Gift, Activity, Loader2,
  Utensils, Stethoscope, BookOpen, Leaf, Briefcase, Palette,
  MapPin, CalendarDays, ShieldCheck, Database, MessageCircle,
  TreePine, Mountain, Home as HomeIcon, Footprints,
} from 'lucide-react';
import { Stat } from '../components/Stat';
import { EventCard } from '../components/EventCard';
import { useApi } from '../lib/useApi';
import type { EventItem, ImpactStats, Program } from '../lib/types';
import { norm, PROGRAM_LABELS } from '../lib/types';
import { formatDate } from '../lib/format';

/* ── Wikimedia Commons (public domain / CC) imagery ── */
const HERO_IMG     = 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Los_Banos%2C_Mount_Makiling.jpg';
const MAKILING_IMG = 'https://upload.wikimedia.org/wikipedia/commons/8/81/LosBa%C3%B1osHalljf8752_06.JPG';

const PROGRAM_CARDS: { program: Program; icon: typeof Utensils; blurb: string }[] = [
  { program: 'feeding',     icon: Utensils,    blurb: 'Hot lugaw, arroz caldo, and ulam-rice cycles for the 30+ children of Sitio Villegas every month.' },
  { program: 'health',      icon: Stethoscope, blurb: 'Quarterly deworming, vitamin A, and basic check-ups with the Brgy. Putho-Tuntungin RHU midwife.' },
  { program: 'learning',    icon: BookOpen,    blurb: 'Saturday tutorial sessions, reading buddies, and a small lending library run by UPLB student orgs.' },
  { program: 'environment', icon: Leaf,        blurb: 'Trail clean-ups along the Sitio Villegas–Makiling foothill, segregation drives, native-tree planting.' },
  { program: 'livelihood',  icon: Briefcase,   blurb: 'Workshops on sayote home-gardening, food prep, and small-scale handicraft for the nanays.' },
  { program: 'youth',       icon: Palette,     blurb: 'Pahiyas-inspired art days, sportsfests, and music nights for the kabataan ng sitio.' },
];

const PARTNERS = [
  'UPLB CSS · Sociology',
  'UPLB CHE · Community Nutrition',
  'UPLB COFS · Forestry student orgs',
  'Brgy. Putho-Tuntungin Council',
  'Putho-Tuntungin RHU midwives',
  'IRRI Staff Council volunteers',
  'Parish of San Antonio de Padua, Bayog',
  'UPLB Mountaineers · trail partners',
];

export default function HomePage() {
  const { data: eventsRaw, loading: eventsLoading } = useApi<EventItem[]>('/events?status=published');
  const { data: impact } = useApi<ImpactStats>('/dashboard/impact');

  const events  = (eventsRaw ?? []).map(norm);
  // Prioritise Sitio Villegas events on the homepage (sitio match OR Putho-Tuntungin barangay)
  const villegas = events.filter((e) =>
    (e.sitio?.toLowerCase().includes('villegas') ?? false) ||
    (e.barangay?.toLowerCase().includes('putho') ?? false),
  );
  const today    = new Date(new Date().toDateString());
  const future   = (villegas.length ? villegas : events)
    .filter((e) => new Date(e.eventDate) >= today)
    .sort((a, b) => +new Date(a.eventDate) - +new Date(b.eventDate));
  const next     = future[0] ?? events[0];
  const upcoming = future.filter((e) => e.id !== next?.id).slice(0, 3);

  return (
    <div className="pb-20">
      {/* ─────────────────── HERO ─────────────────── */}
      <section className="relative overflow-hidden border-b border-bone-200">
        <div className="absolute inset-0 -z-10 leaf-bg" />
        <div className="container-page pt-12 md:pt-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <span className="eyebrow">Sitio Villegas · Brgy. Putho-Tuntungin · Los Baños</span>
            <h1 className="mt-2 text-4xl md:text-5xl font-display font-bold text-phthalo-500 leading-[1.05]">
              One sitio at the foot of Makiling. <span className="text-maximum-600">One promise we keep coming back to.</span>
            </h1>
            <p className="mt-4 text-ink-700 max-w-xl text-lg">
              KalingaLink coordinates the long-running monthly feeding & development
              program at <strong>Sitio Villegas</strong> — a small upland community of about
              <strong> 18 families and 30+ children</strong> tucked along the trail to Mt. Makiling.
              UPLB students, parish volunteers, the barangay council, and donors keep showing up.
              We just made it easier to stay coordinated.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/events"   className="btn-primary">See the next visit <ArrowRight size={16}/></Link>
              <Link to="/donate"   className="btn-outline">Pledge supplies</Link>
              <Link to="/register" className="btn-ghost">Join as a volunteer</Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5"><HomeIcon size={14} className="text-maximum-600"/> ~18 households</span>
              <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-maximum-600"/> 30+ children, ages 3–12</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-maximum-600"/> Consent-first records</span>
              <span className="inline-flex items-center gap-1.5"><Database size={14} className="text-maximum-600"/> Live MongoDB</span>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-bone-200 shadow-soft">
              <img
                src={HERO_IMG}
                alt="Mount Makiling — backdrop of Sitio Villegas"
                loading="eager"
                className="w-full h-[360px] md:h-[440px] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-phthalo-700/70 via-phthalo-700/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-milk">
                <div className="text-[10px] uppercase tracking-[0.18em] text-maximum-200 font-semibold">Where we serve</div>
                <div className="text-xl font-semibold leading-tight">Sitio Villegas, foothills of Mt. Makiling</div>
                <div className="text-xs text-bone-200/90">Brgy. Putho-Tuntungin · Los Baños · photo via Wikimedia Commons</div>
              </div>
            </div>

            {/* Floating "next visit" callout */}
            <div className="hidden md:block absolute -bottom-10 -left-6 w-[320px]">
              <div className="card">
                <div className="flex items-center justify-between">
                  <span className="eyebrow !mb-0">Next visit</span>
                  <span className="badge-green">Live</span>
                </div>
                {eventsLoading && <div className="mt-3 flex items-center gap-2 text-ink-500 text-sm"><Loader2 className="animate-spin" size={14}/> Loading…</div>}
                {!eventsLoading && !next && <p className="mt-2 text-sm text-ink-500">No upcoming visits scheduled yet.</p>}
                {next && (
                  <>
                    <h3 className="mt-1 text-base font-semibold text-phthalo-500 leading-snug">{next.title}</h3>
                    <div className="mt-2 text-xs text-ink-700 space-y-1">
                      <div className="flex items-center gap-1.5"><CalendarDays size={13} className="text-maximum-600"/>{formatDate(next.eventDate)} · {next.startTime}</div>
                      <div className="flex items-center gap-1.5"><MapPin size={13} className="text-maximum-600"/>{next.sitio ? `${next.sitio}, ` : ''}{next.barangay ? `Brgy. ${next.barangay}` : next.location}</div>
                    </div>
                    <Link to={`/events/${next.id}`} className="btn-accent btn-sm w-full justify-center mt-3">Open details</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="h-12 md:h-16" />
      </section>

      {/* ─────────────────── IMPACT NUMBERS ─────────────────── */}
      <section className="container-page mt-16">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="eyebrow">Sitio Villegas, by the numbers</span>
            <h2 className="section-title mt-1">A small community we measure carefully</h2>
          </div>
          <p className="text-sm text-ink-500 max-w-md">Live counts pulled from KalingaLink — every monthly visit, every consented child measurement, every pledge.</p>
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat icon={<Sparkles size={18}/>}       label="Visits done"      value={impact?.eventsCompleted ?? '—'} />
          <Stat icon={<Users size={18}/>}          label="Children"         value={impact?.childrenServed   ?? '—'} tone="phthalo" hint="Registered in program"/>
          <Stat icon={<Activity size={18}/>}       label="Improving"        value={impact?.childrenImproved ?? '—'} hint="Measured WFA gains"/>
          <Stat icon={<HeartHandshake size={18}/>} label="Volunteers"       value={impact?.volunteersEngaged?? '—'} tone="bone"/>
          <Stat icon={<Gift size={18}/>}           label="Pledges"          value={impact?.pledgesReceived  ?? '—'} hint="Received this cycle"/>
          <Stat                                     label="Volunteer hrs"   value={impact?.hoursVolunteered ?? '—'} tone="phthalo"/>
        </div>
      </section>

      {/* ─────────────────── PROGRAMS GRID ─────────────────── */}
      <section className="container-page mt-16">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="eyebrow">Six programs, one sitio</span>
            <h2 className="section-title mt-1">What we run for the families of Villegas</h2>
          </div>
          <Link to="/events" className="text-sm text-maximum-700 font-medium hover:underline">Browse upcoming visits →</Link>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROGRAM_CARDS.map(({ program, icon: Icon, blurb }) => (
            <Link key={program} to={`/events?program=${program}`} className="card group hover:border-maximum-300 transition relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 grid place-items-center rounded-xl bg-maximum-50 text-maximum-600 group-hover:bg-maximum-100">
                  <Icon size={20}/>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] font-semibold text-maximum-600">{PROGRAM_LABELS[program]}</div>
                  <h3 className="text-lg font-semibold text-phthalo-500">{PROGRAM_LABELS[program]} program</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-700 leading-relaxed">{blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-phthalo-500 group-hover:text-maximum-600">
                See {PROGRAM_LABELS[program].toLowerCase()} visits <ArrowRight size={14}/>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────────────── ABOUT THE SITIO ─────────────────── */}
      <section className="mt-20">
        <div className="container-page grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden border border-bone-200 shadow-soft">
              <img
                src={MAKILING_IMG}
                alt="Los Baños at the foot of Mt. Makiling"
                loading="lazy"
                className="w-full h-[300px] md:h-[420px] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-phthalo-700/85 to-transparent p-4 text-milk">
                <div className="text-[10px] uppercase tracking-[0.18em] text-maximum-200 font-semibold">Walking distance to UPLB</div>
                <div className="text-lg font-semibold">~25-min jeepney + 15-min walk uphill from UP gate</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2">
            <span className="eyebrow">About Sitio Villegas</span>
            <h2 className="section-title mt-1">A small upland community, often left out of the bigger plans.</h2>
            <p className="mt-3 text-ink-700 leading-relaxed">
              Sitio Villegas sits along an unpaved access road in Brgy. Putho-Tuntungin,
              tucked between residential subdivisions and the lower slopes of Mt. Makiling.
              Most households are caretakers, drivers, sari-sari stall owners, and informal
              farmers. Children walk down to public elementary schools; the nearest health
              center is in the barangay proper.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-700">
              <li className="flex gap-2"><HomeIcon size={16} className="mt-0.5 text-maximum-600 shrink-0"/> <span><strong>~18 households</strong> · approx. 90 residents</span></li>
              <li className="flex gap-2"><Users size={16} className="mt-0.5 text-maximum-600 shrink-0"/> <span><strong>30+ children</strong> ages 3–12 in the regular feeding cycle</span></li>
              <li className="flex gap-2"><Mountain size={16} className="mt-0.5 text-maximum-600 shrink-0"/> <span>Adjacent to the <strong>Makiling Forest Reserve</strong> buffer zone</span></li>
              <li className="flex gap-2"><Footprints size={16} className="mt-0.5 text-maximum-600 shrink-0"/> <span>Reached by tricycle from the barangay road, then a short walk uphill</span></li>
              <li className="flex gap-2"><TreePine size={16} className="mt-0.5 text-maximum-600 shrink-0"/> <span>Households share water from a single spring-fed reservoir</span></li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/about"  className="btn-primary">Read our approach</Link>
              <Link to="/events" className="btn-outline">See planned visits</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── UPCOMING EVENTS ─────────────────── */}
      <section className="container-page mt-20">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="eyebrow">On the calendar</span>
            <h2 className="section-title mt-1">Coming up at Sitio Villegas</h2>
          </div>
          <Link to="/events" className="text-sm text-maximum-700 font-medium hover:underline">See all events →</Link>
        </div>
        {eventsLoading ? (
          <div className="mt-6 flex items-center gap-2 text-ink-500"><Loader2 className="animate-spin" size={16}/> Loading…</div>
        ) : upcoming.length === 0 ? (
          <p className="mt-6 text-sm text-ink-500">No additional published visits at the moment. Check back after the next planning meeting.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </section>

      {/* ─────────────────── HOW IT WORKS ─────────────────── */}
      <section className="container-page mt-20">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="eyebrow">From sign-up to served</span>
            <h2 className="section-title mt-1">How a Villegas visit comes together</h2>
          </div>
        </div>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { n:'01', title:'Plan',    body:'Organizers post the next monthly visit with date, committees (cooking, distribution, learning), and supplies needed.' },
            { n:'02', title:'Commit',  body:'UPLB student volunteers sign up to a committee; donors pledge a specific item — rice, eggs, vitamins, art materials.' },
            { n:'03', title:'Measure', body:'Brgy. health workers record consented child measurements. Improvements feed back into next month\u2019s menu and screening.' },
          ].map((s) => (
            <div key={s.n} className="card relative overflow-hidden">
              <span className="absolute right-4 top-3 text-5xl font-display font-bold text-bone-200 select-none">{s.n}</span>
              <h3 className="text-lg font-semibold text-phthalo-500">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── PARTNERS ─────────────────── */}
      <section className="container-page mt-20">
        <div className="card-tight">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="eyebrow">Hand in hand with</span>
              <h2 className="section-title mt-1">Who keeps the program alive</h2>
            </div>
            <p className="text-sm text-ink-500 md:max-w-sm">A small, recurring coalition: the families themselves, their barangay council, UPLB student orgs, parish volunteers, and the trail community.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {PARTNERS.map((p) => (
              <span key={p} className="badge-bone !text-xs !py-1 !px-2.5">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── CTA ─────────────────── */}
      <section className="container-page mt-20">
        <div className="rounded-3xl bg-phthalo-500 text-milk p-8 md:p-12 grid md:grid-cols-3 gap-8 items-center shadow-soft">
          <div className="md:col-span-2">
            <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-maximum-200">Three ways to help</span>
            <h2 className="mt-1 text-3xl md:text-4xl font-display font-bold leading-tight">Be part of the next Villegas visit.</h2>
            <p className="mt-3 text-bone-200/90 max-w-xl">
              An hour of cooking, a kilo of rice, a session of reading aloud — small gifts, repeated monthly,
              are how this program has lasted. There is always a slot waiting.
            </p>
          </div>
          <div className="grid gap-2">
            <Link to="/register" className="btn-accent justify-center">Volunteer with us</Link>
            <Link to="/donate"   className="btn bg-milk text-phthalo-500 hover:bg-bone-100 justify-center">Pledge supplies</Link>
            <Link to="/about"    className="btn text-milk border border-milk/40 hover:bg-phthalo-600 justify-center">Get in touch <MessageCircle size={14}/></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
