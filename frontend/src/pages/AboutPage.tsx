import { PageHeader } from '../components/PageHeader';
import { Heart, Users, ShieldCheck, Target, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About KalingaLink"
        title="A community feeding program, supported by software"
        description="We exist to make the recurring Sitio Villegas feeding program easier to coordinate, more transparent for donors, and gentler on the families it serves."
      />

      <section className="container-page grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <span className="eyebrow">Our story</span>
          <h2 className="section-title mt-2">Built with the community since 2023</h2>
          <p className="mt-3 text-ink-700 leading-relaxed">
            The Sitio Villegas feeding program has run consistently with the help of UPLB students,
            barangay health workers, and Ms. Kristine — one of the community leaders. KalingaLink began as
            an HUME 100 student project to address what kept slowing things down: spreadsheet sign-ups,
            duplicate donations, and the difficulty of telling, month over month, whether the children
            were actually doing better.
          </p>
          <p className="mt-3 text-ink-700 leading-relaxed">
            Today it coordinates volunteer committees, tracks resource needs and pledges, and gives
            authorized workers a private, consent-aware way to log child measurements.
          </p>
        </div>

        <div className="card">
          <span className="eyebrow">Who we serve</span>
          <ul className="mt-3 space-y-3 text-sm text-ink-700">
            <li className="flex gap-3"><Users className="text-maximum-600 shrink-0" size={18}/>30+ children at every monthly event in Sitio Villegas.</li>
            <li className="flex gap-3"><Heart className="text-maximum-600 shrink-0" size={18}/>Their families and barangay leaders.</li>
            <li className="flex gap-3"><Sprout className="text-maximum-600 shrink-0" size={18}/>UPLB student-volunteers learning service.</li>
          </ul>
        </div>
      </section>

      <section className="container-page py-12 grid md:grid-cols-3 gap-6">
        {[
          { icon: Target, title: 'Our mission', body: 'Make every feeding event well-coordinated, well-resourced, and measurable so the program improves over time.' },
          { icon: ShieldCheck, title: 'Our principles', body: 'Consent first. Privacy by default. Transparent gaps and pledges. Community ownership over data.' },
          { icon: Heart, title: 'Our people', body: 'Organizers, health workers, student volunteers, and donors — each with a clear, respectful role in the platform.' },
        ].map(({icon:Icon, title, body}) => (
          <article key={title} className="card">
            <div className="h-11 w-11 rounded-xl bg-phthalo-50 grid place-items-center text-phthalo-500"><Icon size={22}/></div>
            <h3 className="mt-3 font-semibold text-phthalo-500">{title}</h3>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">{body}</p>
          </article>
        ))}
      </section>

      <section className="container-page pb-16">
        <div className="card bg-phthalo-500 text-milk border-phthalo-700">
          <h2 className="text-2xl font-display font-bold">Want to be part of the next event?</h2>
          <p className="mt-2 text-bone-200/90 max-w-xl">Whether you can give time, food, art supplies, or a ride — there's a place for you.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/register" className="btn-accent">Volunteer with us</Link>
            <Link to="/donate" className="btn bg-milk text-phthalo-500 hover:bg-bone-100">Donate resources</Link>
          </div>
        </div>
      </section>
    </>
  );
}
