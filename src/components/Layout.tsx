import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FiBook } from 'react-icons/fi';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 text-gray-800 hover:text-indigo-600 transition-colors">
          <FiBook className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-lg">Writing Tools</span>
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
