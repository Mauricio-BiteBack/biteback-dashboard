"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TransactionsPage() {
  const router = useRouter();

  // FIX IMPORTANTE: evitar never[] → usar any[]
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar sesión
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

  // Cargar transacciones
  async function fetchTransactions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("transactions")
      .select("*, members(email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setTransactions([]);
    } else {
      setTransactions(data || []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-2xl">
        Wird geladen...
      </div>
    );
  }

  return (
    <main>
      <h1 className="text-3xl font-bold mb-8">Transaktionen</h1>

      {transactions.length === 0 ? (
        <p>Keine Transaktionen gefunden.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead className="bg-purple-100">
            <tr>
              <th className="p-3 text-left">Datum</th>
              <th className="p-3 text-left">E-Mail</th>
              <th className="p-3 text-left">Δ Punkte</th>
              <th className="p-3 text-left">Grund</th>
              <th className="p-3 text-left">Quelle</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t: any, i: number) => (
              <tr
                key={t.id}
                className={i % 2 === 0 ? "bg-white" : "bg-purple-50"}
              >
                <td className="p-3">
                  {new Date(t.created_at).toLocaleString("de-DE")}
                </td>

                <td className="p-3">{t.members?.email ?? "–"}</td>

                {/* FIX: Mostrar points_added */}
                <td className="p-3 font-bold">
                  {t.points_added > 0
                    ? `+${t.points_added}`
                    : t.points_added}
                </td>

                <td className="p-3">{t.reason ?? "–"}</td>
                <td className="p-3">{t.source ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}