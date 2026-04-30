import { PageHeader } from '../components/PageHeader';
import {
  Heart, Users, ShieldCheck, Target, Sprout, MapPin, Mountain, Footprints,
  Home as HomeIcon, Utensils, Stethoscope, BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About KalingaLink"
        title="A small sitio's recurring program — supported by software"
        description="KalingaLink exists to make the long-running Sitio Villegas feeding & development program easier to coordinate, more transparent for donors, and gentler on the families it serves."
      />

      {/* Story + audience */}
      <section className="container-page grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <span className="eyebrow">Our story</span>
          <h2 className="section-title mt-2">A monthly visit, kept consistent since 2023</h2>
          <p className="mt-3 text-ink-700 leading-relaxed">
            Sitio Villegas is a small upland community of about <strong>18 households and 30+ children</strong>,
            tucked into Brgy. Putho-Tuntungin along the access road that climbs toward Mt. Makiling.
            For three years, a rotating circle of UPLB student volunteers, parish helpers, IRRI staff
            members, and the barangay's own health workers have shown up — every month — to cook,
            tutor, weigh, vaccinate, and play with the children.
          </p>
          <p className="mt-3 text-ink-700 leading-relaxed">
            KalingaLink began as an HUME 100 student project. The work itself was already happening;
            what kept slowing things down was the coordination — chat threads, paper sign-up sheets,
            duplicate donations, and the difficulty of telling, month over month, whether the
            children were actually getting healthier. The platform replaces that friction with one
            shared, consent-first record.
          </p>
        </div>

        <div className="card">
          <span className="eyebrow">Who we serve</span>
          <ul className="mt-3 space-y-3 text-sm text-ink-700">
            <li className="flex gap-3"><Users     className="text-maximum-600 shrink-0" size={18}/><span><strong>30+ children</strong> ages 3–12 at every monthly visit.</span></li>
            <li className="flex gap-3"><HomeIcon  className="text-maximum-600 shrink-0" size={18}/><span><strong>~18 caretaker / driver / informal-farmer</strong> households.</span></li>
            <li className="flex gap-3"><Heart     className="text-maximum-600 shrink-0" size={18}/><span>The nanays, lolas, and barangay tanods who host every visit.</span></li>
            <li className="flex gap-3"><Sprout    className="text-maximum-600 shrink-0" size={18}/><span>UPLB student-volunteers learning kapwa-driven service.</span></li>
          </ul>
        </div>
      </section>

      {/* Where the sitio sits */}
      <section className="container-page mt-10">
        <div className="card">
          <span className="eyebrow">Where the sitio sits</span>
          <h2 className="section-title mt-1">Geography &amp; access</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-ink-700 leading-relaxed">
                Sitio Villegas is reached via Brgy. Putho-Tuntungin's barangay road, then an
                unpaved foot path that climbs into the lower slopes of Mt. Makiling. From the
                UPLB main gate, it is roughly a 25-minute jeepney ride and a 15-minute walk uphill.
                The sitio shares water from a single spring-fed reservoir; mobile signal is
                intermittent in the upper houses.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink-700">
                <li className="flex gap-2"><MapPin    size={16} className="mt-0.5 text-maximum-600 shrink-0"/> <span>Brgy. Putho-Tuntungin, Los Baños, Laguna 4031</span></li>
                <li className="flex gap-2"><Mountain  size={16} className="mt-0.5 text-maximum-600 shrink-0"/> <span>Adjacent to the Makiling Forest Reserve buffer zone</span></li>
                <li className="flex gap-2"><Footprints size={16} className="mt-0.5 text-maximum-600 shrink-0"/> <span>~25-min jeepney + 15-min walk uphill from UPLB</span></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-bone-200 bg-bone-50 p-4">
              <h3 className="font-semibold text-phthalo-500">Why this sitio, specifically?</h3>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed">
                Larger barangay-wide nutrition programs in Los Baños often miss the smallest
                upland sitios because they fall outside formal sitio-level statistics. Villegas
                is close enough to UPLB to be reachable for student volunteers, but far enough
                up the road that municipal feeding cycles rarely include it. Filling exactly
                that gap — in one place, consistently — is the program's whole reason for being.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What a visit looks like */}
      <section className="container-page mt-10">
        <span className="eyebrow">What a typical Villegas visit looks like</span>
        <h2 className="section-title mt-1">A Saturday morning, repeated monthly</h2>
        <div className="mt-5 grid md:grid-cols-3 gap-4">
          {[
            { icon: Utensils,    t: 'Cook & serve', b: '7am: cooking team prepares lugaw / arroz caldo / ulam-rice for 30–40 children at the host household.' },
            { icon: Stethoscope, t: 'Weigh & screen', b: '9am: barangay health workers and partner nurses log weight, height, and any concerns onto KalingaLink with guardian consent.' },
            { icon: BookOpen,    t: 'Read & play', b: '10am: tutorial buddies run a 45-minute reading + story circle; older kids join an art / sportsfest activity.' },
          ].map(({ icon: Icon, t, b }) => (
            <div key={t} className="card">
              <div className="h-11 w-11 grid place-items-center rounded-xl bg-maximum-50 text-maximum-600"><Icon size={20}/></div>
              <h3 className="mt-3 font-semibold text-phthalo-500">{t}</h3>
              <p className="mt-1 text-sm text-ink-700 leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission / principles / people */}
      <section className="container-page py-12 grid md:grid-cols-3 gap-6">
        {[
          { icon: Target,      title: 'Our mission',   body: 'Make every Villegas visit well-coordinated, well-resourced, and measurable so the program improves over time — not just this month, but next year.' },
          { icon: ShieldCheck, title: 'Our principles', body: 'Consent first. Privacy by default. Transparent gaps and pledges. The community owns its data; we are stewards.' },
          { icon: Heart,       title: 'Our people',    body: 'Sitio leaders, barangay health workers, UPLB students, parish volunteers, and donors — each with a clear, respectful role inside the platform.' },
        ].map(({ icon: Icon, title, body }) => (
          <article key={title} className="card">
            <div className="h-11 w-11 rounded-xl bg-phthalo-50 grid place-items-center text-phthalo-500"><Icon size={22}/></div>
            <h3 className="mt-3 font-semibold text-phthalo-500">{title}</h3>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">{body}</p>
          </article>
        ))}
      </section>

      {/* CTA */}
      <section className="container-page pb-16">
        <div className="card bg-phthalo-500 text-milk border-phthalo-700">
          <h2 className="text-2xl font-display font-bold">Want to be part of the next Villegas visit?</h2>
          <p className="mt-2 text-bone-200/90 max-w-xl">
            Whether you can give an hour of cooking, a kilo of rice, art supplies, a ride up the trail,
            or a quiet 30 minutes of reading aloud — there is a place for you.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/register" className="btn-accent">Volunteer with us</Link>
            <Link to="/donate"   className="btn bg-milk text-phthalo-500 hover:bg-bone-100">Pledge supplies</Link>
          </div>
        </div>
      </section>
    </>
  );
}
