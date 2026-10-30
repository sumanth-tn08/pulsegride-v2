import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  TrendingUp,
  Globe,
  CheckSquare,
  ShieldAlert,
  Radio
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Navbar />

      {/* Administrator Header Banner */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
                Health Directorate · Karnataka State
              </span>
              <span className="text-xs text-slate-500 font-mono">Central BBMP Command</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Bengaluru Healthcare Network Administrator
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              40 Primary Health Centres · 4 Zones · Live Monitoring, ML Forecasting & Human-in-the-Loop Approvals
            </p>
          </div>

          {/* Admin Navigation Subtabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </NavLink>
            <NavLink
              to="/admin/phcs"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>All 40 PHCs</span>
            </NavLink>
            <NavLink
              to="/admin/analytics"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </NavLink>
            <NavLink
              to="/admin/predictions"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ML Predictions</span>
            </NavLink>
            <NavLink
              to="/admin/investigation"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-white text-teal-800 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>TinyFish Evidence</span>
            </NavLink>
            <NavLink
              to="/admin/approvals"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-700 text-white shadow-sm font-bold'
                    : 'text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50'
                }`
              }
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Approvals Queue</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Main Admin Outlet */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
};
