import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { Mail, MapPin, Heart, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 bg-phthalo-500 text-milk">
      <div className="container-page py-12 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <Logo size={40} tone="light" />
          <p className="mt-4 text-sm text-bone-200/80 max-w-sm leading-relaxed">
            A volunteer and resource coordination platform powering feeding, health, learning,
            environment, livelihood, and youth-arts programs across Los Baños, Laguna —
            built with our barangays, UPLB, IRRI, and parish partners.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-maximum-200">
            <Heart size={14} className="fill-maximum-200"/> An HUME 100 community project.
          </p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.16em] text-maximum-200 font-semibold">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/about"     className="hover:text-maximum-200">About</Link></li>
            <li><Link to="/events"    className="hover:text-maximum-200">Events</Link></li>
            <li><Link to="/resources" className="hover:text-maximum-200">Resources</Link></li>
            <li><Link to="/donate"    className="hover:text-maximum-200">Donate</Link></li>
            <li><Link to="/register"  className="hover:text-maximum-200">Volunteer</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.16em] text-maximum-200 font-semibold">Reach us</h4>
          <ul className="mt-3 space-y-2 text-sm text-bone-200/80">
            <li className="flex gap-2"><MapPin size={14} className="mt-0.5 shrink-0"/> KalingaLink hub, UPLB CSS Office, Los Baños 4031, Laguna</li>
            <li className="flex gap-2"><Mail   size={14} className="mt-0.5 shrink-0"/> hello@kalingalink.ph</li>
            <li className="flex gap-2"><Phone  size={14} className="mt-0.5 shrink-0"/> (049) 536-LINK</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-phthalo-700">
        <div className="container-page py-4 flex flex-col md:flex-row gap-2 items-center justify-between text-xs text-bone-200/70">
          <span>© {new Date().getFullYear()} KalingaLink · Los Baños, Laguna.</span>
          <span>Tunay na malasakit, sama-sama.</span>
        </div>
      </div>
    </footer>
  );
}
