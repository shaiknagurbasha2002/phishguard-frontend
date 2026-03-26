import { Outlet } from 'react-router';
import { motion } from 'motion/react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Cybersecurity grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a15_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
