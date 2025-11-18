"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar"; // ✅ INTEGRADO

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TransactionsPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ------------------------
  //   Verificar sesión
  // ------------------------
  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/auth");
        return;
      }
      fetchTransactions();
    }
    load();
  }, []);

  // ------------------------
  //  Cargar transacciones
  // ------------------------
  async function fetchTransactions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("transactions")
      .select("*, members(email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("⚠️ Fehler beim Laden:", error);
      setTransactions([]);
    } else {
      setTransactions(data || []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="w-full h-screen flex items-center justify-center bg-[#fffbf7] text-[#072049] text-2xl">
        Wird geladen...
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#fffbf7] font-[Inter] text-[#072049]"
    >
      {/* ⭐⭐⭐ NAVBAR ARRIBA ⭐⭐⭐ */}
      <NavBar />

      <div className="px-8 py-10 max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-bitepurple mb-8">
          Transaktionen
        </h1>

        {transactions.length === 0 ? (
          <p className="text-lg text-gray-600">Keine Transaktionen gefunden.</p>
        ) : (
          <table className="w-full border-collapse bg-white shadow-md rounded-xl overflow-hidden">
            <thead className="bg-purple-100 text-gray-800">
              <tr>
                <th className="p-3 text-left">Datum</th>
                <th className="p-3 text-left">E-Mail</th>
                <th className="p-3 text-left">Δ Punkte</th>
                <th className="p-3 text-left">Quelle</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((t, i) => (
                <tr
                  key={t.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-purple-50"}
                >
                  <td className="p-3">
                    {new Date(t.created_at).toLocaleString("de-DE")}
                  </td>

                  <td className="p-3">{t.members?.email ?? "–"}</td>

                  <td
                    className={`p-3 font-bold ${
                      t.points_added < 0
                        ? "text-red-500"
                        : "text-bitepurple"
                    }`}
                  >
                    {t.points_added > 0
                      ? `+${t.points_added}`
                      : t.points_added}
                  </td>

                  <td className="p-3">{t.source ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}