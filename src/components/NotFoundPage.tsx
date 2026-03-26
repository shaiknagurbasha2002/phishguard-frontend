import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Shield, Home, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a15_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-red-600/20 rounded-full border-2 border-red-600">
            <AlertTriangle className="h-16 w-16 text-red-500" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-400 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/dashboard">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
              <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
              Back to Login
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
