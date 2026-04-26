"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart2,
  Users,
  Building2,
  ClipboardList,
  Clock,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface StatsResponse {
  clinics: {
    total: number;
    claimed: number;
    unclaimedRate: string;
  };
  pageViews: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  waitReports: {
    last24h: number;
    last7d: number;
  };
  claims: {
    pending: number;
    recent: Array<{
      id: string;
      contactName: string;
      contactEmail: string;
      createdAt: string;
      clinic: {
        name: string;
        city: string;
        state: string;
        stateSlug: string;
        citySlug: string;
        addressSlug: string;
        clinicSlug: string;
      };
    }>;
  };
  users: {
    total: number;
    newLast7d: number;
  };
  outOfAreaSearches7d: number;
  topClinics: Array<{
    clinic: {
      id: string;
      name: string;
      city: string;
      state: string;
      stateSlug: string;
      citySlug: string;
      addressSlug: string;
      clinicSlug: string;
    };
    views: number;
  }>;
  generatedAt: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${accent ?? "bg-blue-50"}`}>
        <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-blue-600"}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/urgent-care/api/admin/stats");
      if (res.status === 403) {
        setError("Access denied. Admin role required.");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch stats");
      setStats(await res.json());
    } catch {
      setError("Could not load stats. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/urgent-care/login?callbackUrl=/urgent-care/admin");
      return;
    }
    if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.replace("/urgent-care");
        return;
      }
      fetchStats();
    }
  }, [status, session]);

  if (status === "loading" || (status === "authenticated" && loading && !error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const generatedAt = new Date(stats.generatedAt).toLocaleString();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Last updated: {generatedAt}</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Page Views */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Page Views
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={TrendingUp} label="Last 24 hours" value={stats.pageViews.last24h.toLocaleString()} />
            <StatCard icon={TrendingUp} label="Last 7 days" value={stats.pageViews.last7d.toLocaleString()} />
            <StatCard icon={TrendingUp} label="Last 30 days" value={stats.pageViews.last30d.toLocaleString()} />
          </div>
        </section>

        {/* Clinic Stats */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Clinics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={Building2} label="Total clinics" value={stats.clinics.total.toLocaleString()} />
            <StatCard icon={Building2} label="Claimed" value={stats.clinics.claimed.toLocaleString()} sub={`${(100 - Number(stats.clinics.unclaimedRate)).toFixed(1)}% claimed`} />
            <StatCard icon={ClipboardList} label="Pending claims" value={stats.claims.pending} accent={stats.claims.pending > 0 ? "bg-amber-500" : undefined} />
          </div>
        </section>

        {/* Wait Reports & Users */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Activity
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard icon={Clock} label="Wait reports (24h)" value={stats.waitReports.last24h.toLocaleString()} />
            <StatCard icon={Clock} label="Wait reports (7d)" value={stats.waitReports.last7d.toLocaleString()} />
            <StatCard icon={Users} label="Total users" value={stats.users.total.toLocaleString()} />
            <StatCard icon={Users} label="New users (7d)" value={stats.users.newLast7d.toLocaleString()} />
          </div>
          {stats.outOfAreaSearches7d > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              Out-of-area searches (7d): <span className="font-semibold text-gray-700">{stats.outOfAreaSearches7d.toLocaleString()}</span>
            </p>
          )}
        </section>

        {/* Top Clinics by Views */}
        {stats.topClinics.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Top Clinics by Page Views (Last 7 Days)
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Clinic</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topClinics.map((row, i) => (
                    <tr key={row.clinic?.id ?? i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-4 py-3">
                        {row.clinic ? (
                          <Link
                            href={`/urgent-care/${row.clinic.stateSlug}/${row.clinic.citySlug}/${row.clinic.addressSlug}/${row.clinic.clinicSlug}`}
                            className="text-blue-600 hover:underline flex items-center gap-1"
                            target="_blank"
                          >
                            {row.clinic.name}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </Link>
                        ) : (
                          <span className="text-gray-400">Unknown</span>
                        )}
                        {row.clinic && (
                          <span className="text-xs text-gray-400 ml-1">
                            {row.clinic.city}, {row.clinic.state}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{row.views.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Pending Claim Requests */}
        {stats.claims.recent.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Pending Claim Requests
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Clinic</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Contact</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.claims.recent.map((req) => (
                    <tr key={req.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/urgent-care/${req.clinic.stateSlug}/${req.clinic.citySlug}/${req.clinic.addressSlug}/${req.clinic.clinicSlug}`}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                          target="_blank"
                        >
                          {req.clinic.name}
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </Link>
                        <span className="text-xs text-gray-400">{req.clinic.city}, {req.clinic.state}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>{req.contactName}</div>
                        <div className="text-xs text-gray-400">{req.contactEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {stats.claims.pending === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No pending claim requests.</p>
        )}
      </div>
    </div>
  );
}
