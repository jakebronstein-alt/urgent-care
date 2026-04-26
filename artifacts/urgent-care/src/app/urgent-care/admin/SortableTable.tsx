"use client";

import { useState, useMemo } from "react";
import type { ClinicRow } from "@/lib/admin-stats";

type SortKey = "name" | "city" | "state" | "h24" | "d7" | "d30";

export function SortableClinicTable({
  rows,
  defaultSortKey = "d7",
}: {
  rows: ClinicRow[];
  defaultSortKey?: SortKey;
}) {
  const [sortKey, setSortKey] = useState<SortKey>(defaultSortKey);
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
  }, [rows, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const arrow = (key: SortKey) => {
    if (key !== sortKey) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>;
  };

  const headers: { key: SortKey; label: string; numeric?: boolean }[] = [
    { key: "name", label: "Clinic" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "h24", label: "24 h", numeric: true },
    { key: "d7", label: "7 d", numeric: true },
    { key: "d30", label: "30 d", numeric: true },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {headers.map((h) => (
              <th
                key={h.key}
                onClick={() => handleSort(h.key)}
                className={`px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors whitespace-nowrap ${
                  h.numeric ? "text-right" : "text-left"
                }`}
              >
                {h.label}
                {arrow(h.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((row, i) => (
            <tr key={row.clinicId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
              <td className="px-4 py-2.5 text-gray-800 font-medium max-w-[220px] truncate">{row.name}</td>
              <td className="px-4 py-2.5 text-gray-600">{row.city}</td>
              <td className="px-4 py-2.5 text-gray-600">{row.state}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{row.h24 > 0 ? row.h24.toLocaleString() : <span className="text-gray-300">—</span>}</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-medium">{row.d7 > 0 ? row.d7.toLocaleString() : <span className="text-gray-300">—</span>}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{row.d30 > 0 ? row.d30.toLocaleString() : <span className="text-gray-300">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
