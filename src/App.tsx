/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ClientForm from './pages/ClientForm';
import AdminDashboard from './pages/AdminDashboard';
import { User, Settings } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      {/* Dev Navigation (Hidden from actual end users ideally, but helps previewing) */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Link to="/" className="w-10 h-10 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-colors shadow-2xl backdrop-blur-md" title="Client Form">
          <User className="w-4 h-4" />
        </Link>
        <Link to="/admin" className="w-10 h-10 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-colors shadow-2xl backdrop-blur-md" title="Admin Panel">
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      <Routes>
        <Route path="/" element={<ClientForm />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

