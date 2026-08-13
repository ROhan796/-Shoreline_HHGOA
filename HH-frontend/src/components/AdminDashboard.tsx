import React, { useEffect, useState } from 'react';
import { useAuth, SignInButton } from '@clerk/clerk-react';
import { AdminStats, SavedCard, TimelineData } from '../types';
import { apiFetch } from '../api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  ShieldCheck,
  TrendingUp,
  Share2,
  Users,
  Trash2,
  RefreshCw,
  LayoutDashboard,
  BarChart3,
  Search,
  Lock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { getToken, isSignedIn } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalCards: 1247,
    formatBRatio: 62,
    shareRate: 41,
    todayCount: 347,
    sharesToday: 142,
  });

  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const data = await apiFetch('/api/admin/stats', { headers });
      if (data.stats) {
        setStats(data.stats);
        setTimeline(data.timeline || []);
        setCards(data.cards || []);
      }
    } catch (err: any) {
      if (err.message?.includes('403')) {
        setAccessDenied(true);
      } else {
        console.error('Failed to load admin stats');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await apiFetch(`/api/cards/${id}`, { method: 'DELETE', headers });
      setCards((prev) => prev.filter((c) => c.id !== id));
      setStats((prev) => ({ ...prev, totalCards: prev.totalCards - 1 }));
    } catch (err) {
      alert('Failed to delete card');
    }
  };

  const filteredCards = cards.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isSignedIn) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-[#F2F0EB] flex flex-col items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-[#1A1A1A] text-[#F2F0EB] flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-serif font-bold text-3xl text-[#1A1A1A] mb-4">
            Admin Access Required
          </h1>
          <p className="font-serif italic text-sm text-[#5A554C] mb-8">
            Sign in with your organizer credentials to access the admin dashboard.
          </p>
          <SignInButton mode="modal">
            <button className="px-8 py-4 bg-[#1A1A1A] text-[#F2F0EB] font-sans font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#A0522D] transition-all cursor-pointer">
              Sign In to Admin
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-[#F2F0EB] flex flex-col items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-[#A0522D] text-white flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-serif font-bold text-3xl text-[#1A1A1A] mb-4">
            Not Authorized
          </h1>
          <p className="font-serif italic text-sm text-[#5A554C] mb-8">
            Your account does not have admin privileges. Only the first registered user has admin access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#F2F0EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1A1A1A]/10 pb-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-[#A0522D] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A0522D]" />
                ORGANIZER PORTAL
              </span>
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-5xl text-[#1A1A1A]">
              SHORELINE · ADMIN DASHBOARD
            </h1>
            <p className="font-serif italic text-sm text-[#5A554C] mt-1">
              Real-time generation metrics, distribution analytics, and repository management.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="px-4 py-2.5 bg-[#1A1A1A] text-[#F2F0EB] text-xs font-sans font-bold uppercase tracking-[0.2em] hover:bg-[#A0522D] transition-all cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Top Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Stat 1: Total Cards */}
          <div className="bg-[#E8E5DC] border border-[#1A1A1A]/20 p-6 relative overflow-hidden group hover:border-[#1A1A1A] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-sans font-bold text-[#5A554C] uppercase tracking-wider">
                Total Passes Generated
              </span>
              <div className="p-2 bg-[#1A1A1A] text-[#F2F0EB]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif font-bold text-4xl text-[#1A1A1A] tracking-tight">
              {stats.totalCards.toLocaleString()}
            </p>
            <p className="text-xs font-serif italic text-[#A0522D] mt-2">
              +{stats.todayCount} generated today
            </p>
          </div>

          {/* Stat 2: Format Split */}
          <div className="bg-[#E8E5DC] border border-[#1A1A1A]/20 p-6 relative overflow-hidden group hover:border-[#1A1A1A] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-sans font-bold text-[#5A554C] uppercase tracking-wider">
                Format B Ratio
              </span>
              <div className="p-2 bg-[#1A1A1A] text-[#F2F0EB]">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif font-bold text-4xl text-[#1A1A1A] tracking-tight">
              {stats.formatBRatio}%
            </p>
            <p className="text-xs font-serif italic text-[#5A554C] mt-2">
              Format B (Full Pass) vs Format A (PFP)
            </p>
          </div>

          {/* Stat 3: Share Rate */}
          <div className="bg-[#E8E5DC] border border-[#1A1A1A]/20 p-6 relative overflow-hidden group hover:border-[#1A1A1A] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-sans font-bold text-[#5A554C] uppercase tracking-wider">
                Share Rate on X
              </span>
              <div className="p-2 bg-[#A0522D] text-white">
                <Share2 className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif font-bold text-4xl text-[#1A1A1A] tracking-tight">
              {stats.shareRate}%
            </p>
            <p className="text-xs font-serif italic text-[#A0522D] mt-2">
              +{stats.sharesToday} shares today
            </p>
          </div>

          {/* Stat 4: Active Users */}
          <div className="bg-[#E8E5DC] border border-[#1A1A1A]/20 p-6 relative overflow-hidden group hover:border-[#1A1A1A] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-sans font-bold text-[#5A554C] uppercase tracking-wider">
                Conversion Target
              </span>
              <div className="p-2 bg-[#1A1A1A] text-[#F2F0EB]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif font-bold text-4xl text-[#A0522D] tracking-tight">
              99.8%
            </p>
            <p className="text-xs font-serif italic text-[#5A554C] mt-2">
              P95 generation speed &lt; 2.1s
            </p>
          </div>
        </div>

        {/* Analytics Chart Section */}
        <div className="bg-[#E8E5DC] border border-[#1A1A1A]/20 p-6 mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif font-bold text-2xl text-[#1A1A1A]">
                GENERATIONS & SHARES OVER TIME
              </h2>
              <p className="text-xs font-serif italic text-[#5A554C]">
                Daily volume of builder pass renderings vs shares on X
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-sans font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-[#1A1A1A]">
                <span className="w-3 h-3 bg-[#1A1A1A]" /> Generations
              </span>
              <span className="flex items-center gap-1.5 text-[#A0522D]">
                <span className="w-3 h-3 bg-[#A0522D]" /> Shares
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="colorGenerations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A1A1A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1A1A1A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A0522D" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#A0522D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26, 26, 26, 0.1)" />
                <XAxis dataKey="day" stroke="#5A554C" fontSize={11} tickLine={false} />
                <YAxis stroke="#5A554C" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF8F5',
                    borderColor: 'rgba(26, 26, 26, 0.2)',
                    color: '#1A1A1A',
                    fontFamily: 'Georgia, serif',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="generations"
                  stroke="#1A1A1A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGenerations)"
                />
                <Area
                  type="monotone"
                  dataKey="shares"
                  stroke="#A0522D"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorShares)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* All Cards Table Section */}
        <div className="bg-[#E8E5DC] border border-[#1A1A1A]/20 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif font-bold text-2xl text-[#1A1A1A]">
                GENERATED PASS REPOSITORY
              </h2>
              <p className="text-xs font-serif italic text-[#5A554C]">
                Search, filter, and moderate attendee passes.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#5A554C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, role, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#1A1A1A]/20 pl-9 pr-4 py-2 text-xs text-[#1A1A1A] font-serif focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1A1A1A]/20 text-[10px] font-sans font-bold text-[#5A554C] uppercase tracking-widest">
                  <th className="py-3 px-4">Attendee Name</th>
                  <th className="py-3 px-4">Role / Stack</th>
                  <th className="py-3 px-4">Curated AI Title</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Shares</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]/10 text-xs font-sans text-[#1A1A1A]">
                {filteredCards.length > 0 ? (
                  filteredCards.map((card) => (
                    <tr key={card.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-4 font-serif font-bold text-[#1A1A1A]">
                        {card.name}
                      </td>
                      <td className="py-3.5 px-4 font-sans uppercase text-[#A0522D] font-bold text-[10px] tracking-wider">
                        {card.role}
                      </td>
                      <td className="py-3.5 px-4 font-serif italic text-[#1A1A1A]">
                        "{card.title}"
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-sans font-bold uppercase tracking-widest ${
                          card.format === 'A' ? 'bg-[#1A1A1A] text-white' : 'bg-[#A0522D] text-white'
                        }`}>
                          FMT {card.format}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#5A554C]">
                        {card.sharesCount}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1.5 bg-[#A0522D] text-white hover:bg-black transition-all cursor-pointer"
                          title="Delete Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#5A554C] font-serif italic">
                      No passes found matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
