"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Topbar from "../components/Topbar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AnalyticsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalMembers: 0,
    pointsGivenToday: 0,
    redemptionsToday: 0,
  });
  const [topMembers, setTopMembers] = useState([]);

  // 🔒 Verificar sesión + cargar datos
  useEffect(() => {
    async function init() {
      // 1) Check session
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.replace("/auth");
        return;
      }

      // 2) Cargar KPIs
      await loadData();
    }

    init();
  }, [router]);

  async function loadData() {
    setLoading(true);

    // 👉 Hoy a las 00:00 en ISO
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoToday = today.toISOString();

    // 1) Nº miembros
    const { count: totalMembers } = await supabase
      .from("members")
      .select("id", { count: "exact", head: true });

    // 2) Puntos otorgados hoy (points_added > 0)
    const { data: txPosToday } = await supabase
      .from("transactions")
      .select("points_added, created_at")
      .gte("created_at", isoToday)
      .gt("points_added", 0);

    const pointsGivenToday =
      txPosToday?.reduce(
        (sum, t) => sum + (t.points_added ?? 0),
        0
      ) ?? 0;

    // 3) Canjes hoy (points_added < 0, reason = 'reward_redeem')
    const { data: txRedeemsToday } = await supabase
      .from("transactions")
      .select("id")
      .gte("created_at", isoToday)
      .lt("points_added", 0)
      .eq("reason", "reward_redeem");

    const redemptionsToday = txRedeemsToday?.length ?? 0;

    // 4) Top 5 clientes por puntos
    const { data: topMembersData } = await supabase
      .from("members")
      .select("id, first_name, last_name, email, points")
      .order("points", { ascending: false })
      .limit(5);

    setKpis({
      totalMembers: totalMembers ?? 0,
      pointsGivenToday,
      redemptionsToday,
    });
    setTopMembers(topMembersData || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="w-full h-screen flex items-center justify-center text-2xl">
        Wird geladen...
      </main>
    );
  }

  return (
    <main className="px-8 py-6 min-h-screen bg-[#fffbf7] text-[#072049]">
      <Topbar />

      <h1 className="text-3xl font-extrabold text-bitepurple mb-6">
        Analytics
      </h1>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KpiCard
          label="Mitglieder gesamt"
          value={kpis.totalMembers}
        />
        <KpiCard
          label="Heute vergebene Punkte"
          value={kpis.pointsGivenToday}
        />
        <KpiCard
          label="Heute eingelöste Rewards"
          value={kpis.redemptionsToday}
        />
      </section>

      {/* Top Members */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Top 5 Kunden nach Punkten</h2>

        {topMembers.length === 0 ? (
          <p className="text-gray-600">Noch keine Daten.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-purple-100 text-gray-800">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">E-Mail</th>
                <th className="p-3 text-left">Punkte</th>
              </tr>
            </thead>
            <tbody>
              {topMembers.map((m) => (
                <tr key={m.id} className="odd:bg-white even:bg-purple-50">
                  <td className="p-3">
                    {m.first_name} {m.last_name}
                  </td>
                  <td className="p-3">{m.email}</td>
                  <td className="p-3 font-bold">{m.points ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-extrabold text-bitepurple">
        {value}
      </span>
    </div>
  );
}