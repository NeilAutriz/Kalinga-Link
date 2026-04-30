import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function NotFoundPage() {
  return (
    <section className="container-page py-24 text-center">
      <Logo size={48} variant="mark" />
      <h1 className="mt-4 text-4xl font-display font-bold text-phthalo-500">Page not found</h1>
      <p className="mt-2 text-ink-700">That page didn't make it to the next event. Let's get you back.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link to="/" className="btn-primary">Go home</Link>
        <Link to="/events" className="btn-outline">See events</Link>
      </div>
    </section>
  );
}
