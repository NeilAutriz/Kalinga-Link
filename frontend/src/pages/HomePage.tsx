import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, HeartHandshake, Users, Gift, Activity, Loader2,
  Utensils, Stethoscope, BookOpen, Leaf, Briefcase, Palette,
  MapPin, CalendarDays, ShieldCheck, Database, MessageCircle,
} from 'lucide-react';
import { Stat } from '../components/Stat';
import { EventCard } from '../components/EventCard';
import { useApi } from '../lib/useApi';
import type { EventItem, ImpactStats, Program } from '../lib/types';
import { norm, PROGRAM_LABELS } from '../lib/types';
import { formatDate } from '../lib/format';

/* ── Wikimedia Commons (public domain / CC) imagery of Los Baños ── */
const HERO_IMG = 'https://upload.wikimedia.org/wikipedia/commons/8/81/LosBa%C3%B1osHalljf8752_06.JPG';
const MAKILING_IMG = 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Los_Banos%2C_Mount_Makiling.jpg';

const PROGRAM_CARDS: { program: Program; icon: typeof Utensils; blurb: string }[] = [
  { program: 'feeding',     icon: Utensils,   blurb: 'Hot, balanced meals every cycle for children in our partner sitios.' },
  { program: 'health',      icon: Stethoscope,blurb: 'Free check-ups, deworming, vitamins, and BP screening with the LB RHU.' },
  { program: 'learning',    icon: BookOpen,   blurb: 'Reading buddies, tutorial sessions, and library deliveries with UPLB student orgs.' },
  { program: 'environment', icon: Leaf,       blurb: 'Trail clean-ups, segregation drives, and Mt. Makiling stewardship.' },
  { program: 'livelihood',  icon: Briefcase,  blurb: 'Workshops on home gardening, food prep, and microenterprise for guardians.' },
  { program: 'youth',       icon: Palette,    blurb: 'Pahiyas-inspired art days, sportsfests, and music nights for our kabataan.' },
];

const PARTNERS = [
  'UPLB CHE · Community Nutrition',
  'UPLB CSS · Sociology',
  'IRRI Staff Council',
  'LB Rural Health Unit',
  'Brgys. Batong Malake · Anos · Bambang · Bayog · Maahas · Tadlac · Putho-Tuntungin',
  'Parish of St. Therese & San Antonio',
  'Los Baños Coffee Club, Lopez Ave',
  'UPLB Mountaineers',
];

export default function HomePage() {
  const { data: eventsRaw, loading: eventsLoading } = useApi<EventItem[]>('/events?status=published');
  const { data: impact } = useApi<ImpactStats>('/dashboard/impact');

  const events  = (eventsRaw ?? []).map(norm);
  const today   = new Date(new Date().toDateString());
  const future  = events.filter((e) => new Date(e.eventDate) >= today).sort((a,b) => +new Date(a.eventDate) - +new Date(b.eventDate));
  const next    = future[0] ?? events[0];
  const upcoming= future.filter((e) => e.id !== next?.id).slice(0, 3);

  return (
    <div className="pb-20">
      {/* ─────────────────── HERO ─────────────────── */}
      <section className="relative overflow-hidden border-b border-bone-200">
        <div className="absolute inset-0 -z-10 leaf-bg" />
        <div className="container-page pt-12 md:pt-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <span className="eyebrow">Los Baños · Laguna</span>
            <h1 className="mt-2 text-4xl md:text-5xl font-display font-bold text-phthalo-500 leading-[1.05]">
              Feeding hope, <span className="text-maximum-600">building tomorrow</span> — across our barangays.
            </h1>
            <p className="mt-4 text-ink-700 max-w-xl text-lg">
              KalingaLink unites <strong>UPLB students</strong>, IRRI staff, parish volunteers,
              local barangays, and donors to deliver weekly feeding, health, learning,
              environment, livelihood, and youth-arts programs for children in Los Baños.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/events"   className="btn-primary">Find an event <ArrowRight size={16}/></Link>
              <Link to="/donate"   className="btn-outline">Donate supplies</Link>
              <Link to="/register" className="btn-ghost">Become a volunteer</Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-maximum-600"/> Consent-first child records</span>
              <span className="inline-flex items-center gap-1.5"><Database size={14} className="text-maximum-600"/> Live MongoDB Atlas</span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-maximum-600"/> 7 barangays served</span>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-bone-200 shadow-soft">
              <img
                src={HERO_IMG}
                alt="Los Baños Municipal Hall"
                loading="eager"
                className="w-full h-[360px] md:h-[440px] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-phthalo-700/70 via-phthalo-700/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-milk">
                <div className="text-[10px] uppercase tracking-[0.18em] text-maximum-200 font-semibold">Where we serve</div>
                <div className="text-xl font-semibold leading-tight">Bayan ng Los Baños</div>
                <div className="text-xs text-bone-200/90">Municipal Hall · photo: Wikimedia Commons</div>
              </div>
            </div>

            {/* Floating "next event" callout */}
            <div className="hidden md:block absolute -bottom-10 -left-6 w-[320px]">
              <div className="card">
                <div className="flex items-center justify-between">
                  <span className="eyebrow !mb-0">Next event</span>
                  <span className="badge-green">Live · Atlas</span>
                </div>
                {eventsLoading && <div className="mt-3 flex items-center gap-2 text-ink-500 text-sm"><Loader2 className="animate-spin" size={14}/> Loading…</div>}
                {!eventsLoading && !next && <p className="mt-2 text-sm text-ink-500">No published events yet.</p>}
                {next && (
                  <>
                    <h3 className="mt-1 text-base font-semibold text-phthalo-500 leading-snug">{next.title}</h3>
                    <div className="mt-2 text-xs text-ink-700 space-y-1">
                      <div className="flex items-center gap-1.5"><CalendarDays size={13} className="text-maximum-600"/>{formatDate(next.eventDate)} · {next.startTime}</div>
                      <div className="flex items-center gap-1.5"><MapPin size={13} className="text-maximum-600"/>{next.barangay ? `Brgy. ${next.barangay}` : next.location}</div>
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
            <span className="eyebrow">Community impact</span>
            <h2 className="section-title mt-1">Numbers from the field</h2>
          </div>
          <p className="text-sm text-ink-500 max-w-md">Live counts pulled from KalingaLink — every cycle, child measurement, and pledge is recorded.</p>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat icon={<Sparkles size={18}/>}       label="Events completed"  value={impact?.eventsCompleted ?? '—'} />
          <Stat icon={<Users size={18}/>}          label="Children served"   value={impact?.childrenServed   ?? '—'} tone="phthalo"/>
          <Stat icon={<Activity size={18}/>}       label="Children improved" value={impact?.childrenImproved ?? '—'} hint="Measured WFA gains"/>
          <Stat icon={<HeartHandshake size={18}/>} label="Volunteers"        value={impact?.volunteersEngaged?? '—'} tone="bone"/>
          <Stat icon={<Gift size={18}/>}           label="Pledges received"  value={impact?.pledgesReceived  ?? '—'} />
          <Stat                                     label="Volunteer hours"  value={impact?.hoursVolunteered ?? '—'} tone="phthalo"/>
        </div>
      </section>

      {/* ─────────────────── PROGRAMS GRID ─────────────────── */}
      <section className="container-page mt-16">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="eyebrow">Six programs, one community</span>
            <h2 className="section-title mt-1">What we run in Los Baños</h2>
          </div>
          <Link to="/events" className="text-sm text-maximum-700 font-medium hover:underline">Browse upcoming events →</Link>
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
                See {PROGRAM_LABELS[program].toLowerCase()} events <ArrowRight size={14}/>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────────────── WHERE WE WORK (Mt. Makiling band) ─────────────────── */}
      <section className="mt-20">
        <div className="container-page grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <span className="eyebrow">Our shared backyard</span>
            <h2 className="section-title mt-1">Rooted at the foot of Mt. Makiling.</h2>
            <p className="mt-3 text-ink-700">
              From the lakeshore barangays of Bayog and Tadlac to the highland sitios near
              the trailhead, KalingaLink works with families across <strong>seven barangays</strong> in Los Baños.
              We design every cycle around what the community asks for — meals, medicine, books,
              clean trails, livelihood, and youth-led art.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-700">
              <li className="flex gap-2"><MapPin size={16} className="mt-0.5 text-maximum-600 shrink-0"/> <span><strong>Lowlands:</strong> Batong Malake, Bambang, Maahas, Anos</span></li>
              <li className="flex gap-2"><MapPin size={16} className="mt-0.5 text-maximum-600 shrink-0"/> <span><strong>Lakeshore:</strong> Bayog, Tadlac</span></li>
              <li className="flex gap-2"><MapPin size={16} className="mt-0.5 text-maximum-600 shrink-0"/> <span><strong>Upland:</strong> Putho-Tuntungin (Sitio Villegas, near the Makiling trailhead)</span></li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/events" className="btn-primary">See all events</Link>
              <Link to="/about"  className="btn-outline">Read our approach</Link>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl overflow-hidden border border-bone-200 shadow-soft">
              <img
                src={MAKILING_IMG}
                alt="Mount Makiling viewed from Los Baños"
                loading="lazy"
                className="w-full h-[300px] md:h-[420px] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-phthalo-700/80 to-transparent p-4 text-milk">
                <div className="text-[10px] uppercase tracking-[0.18em] text-maximum-200 font-semibold">Stewardship</div>
                <div className="text-lg font-semibold">Mt. Makiling, our living classroom</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── UPCOMING EVENTS ─────────────────── */}
      <section className="container-page mt-20">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="eyebrow">On the calendar</span>
            <h2 className="section-title mt-1">Coming up in Los Baños</h2>
          </div>
          <Link to="/events" className="text-sm text-maximum-700 font-medium hover:underline">See all events →</Link>
        </div>
        {eventsLoading ? (
          <div className="mt-6 flex items-center gap-2 text-ink-500"><Loader2 className="animate-spin" size={16}/> Loading from MongoDB Atlas…</div>
        ) : upcoming.length === 0 ? (
          <p className="mt-6 text-sm text-ink-500">No additional published events at the moment.</p>
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
            <h2 className="section-title mt-1">How KalingaLink works</h2>
          </div>
        </div>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { n:'01', title:'Discover', body:'Browse events filtered by program and barangay. Every event lists committees and supplies needed.' },
            { n:'02', title:'Commit',   body:'Volunteers sign up to a committee; donors pledge a specific item. Everything is tracked live.' },
            { n:'03', title:'Measure',  body:'Health partners record consented child measurements. Outcomes feed back into the next cycle.' },
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
              <h2 className="section-title mt-1">Our partner organizations</h2>
            </div>
            <p className="text-sm text-ink-500 md:max-w-sm">A coalition of UPLB units, IRRI staff, barangay councils, parishes, and local businesses on Lopez Ave.</p>
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
            <h2 className="mt-1 text-3xl md:text-4xl font-display font-bold leading-tight">Be part of the next Los Baños cycle.</h2>
            <p className="mt-3 text-bone-200/90 max-w-xl">Whether you can give an hour, a kilo of rice, or a pediatric check-up — there's a slot waiting for you.</p>
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
