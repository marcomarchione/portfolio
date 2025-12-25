/**
 * Not Found Page
 *
 * 404 error page for unmatched routes.
 */
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/routes';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <div className="text-center">
        {/* 404 Text */}
        <h1 className="text-8xl font-display font-bold gradient-text mb-4">
          404
        </h1>

        {/* Message */}
        <h2 className="text-2xl font-display font-semibold text-neutral-200 mb-2">
          Page Not Found
        </h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={ROUTES.DASHBOARD}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-ring"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 glass text-neutral-200 font-medium rounded-lg hover:bg-white/10 transition-colors focus-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
