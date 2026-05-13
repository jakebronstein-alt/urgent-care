import { getAdminStats } from "@/lib/admin-stats";
import { SortableClinicTable } from "@/app/urgentcare/admin/SortableTable";
import { Building2, ClipboardList, Eye, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function JakeAdminPage() {
  const stats = await getAdminStats();
  const claimTotal = Object.values(stats.claimsByStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Generated {new Date(stats.generatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Clinics
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 inline-block">
            <p className="text-sm text-gray-500">Total clinics in directory</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">
              {stats.totalClinics.toLocaleString()}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Claim Requests
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{claimTotal.toLocaleString()}</p>
            </div>
            {(["PENDING", "APPROVED", "REJECTED"] as const).map((status) => {
              const count = stats.claimsByStatus[status] ?? 0;
              const color =
                status === "PENDING"
                  ? "text-amber-600"
                  : status === "APPROVED"
                  ? "text-green-600"
                  : "text-red-500";
              return (
                <div key={status} className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500 capitalize">{status.toLowerCase()}</p>
                  <p className={`text-3xl font-bold mt-1 ${color}`}>{count.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" /> Page Views per Clinic
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Click any column header to sort. 24 h / 7 d / 30 d windows.
          </p>
          <SortableClinicTable rows={stats.pageViewsPerClinic} defaultSortKey="d7" />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Wait Time Updates per Clinic
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Click any column header to sort. 24 h / 7 d / 30 d windows.
          </p>
          <SortableClinicTable rows={stats.waitReportsPerClinic} defaultSortKey="d7" />
        </section>

      </div>
    </div>
  );
}
