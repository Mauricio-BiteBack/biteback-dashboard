"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RewardsPage() {
  const router = useRouter();

  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeemEmail, setRedeemEmail] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.replace("/auth");
      } else {
        loadRewards();
      }
    }
    init();
  }, [router]);

  async function loadRewards() {
    setLoading(true);
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setRewards(data || []);
    setLoading(false);
  }

  // 🔥 1) Abrir modal
  function openRedeemModal(reward) {
    setSelectedReward(reward);
    setShowRedeemModal(true);
  }

  // 🔥 2) Ejecutar canje
  async function handleRedeemReward() {
    if (!redeemEmail) return alert("Bitte E-Mail eingeben.");
    setRedeemLoading(true);

    try {
      // 1. Buscar miembro por email
      const { data: memberData, error: memberErr } = await supabase
        .from("members")
        .select("*")
        .eq("email", redeemEmail.trim())
        .single();

      if (memberErr || !memberData) {
        alert("Mitglied nicht gefunden.");
        setRedeemLoading(false);
        return;
      }

      // 2. Validar puntos suficientes
      if (memberData.points < selectedReward.cost) {
        alert("Nicht genug Punkte!");
        setRedeemLoading(false);
        return;
      }

      const newPoints = memberData.points - selectedReward.cost;

      // 3. Restar puntos
      const { error: updateErr } = await supabase
        .from("members")
        .update({ points: newPoints })
        .eq("id", memberData.id);

      if (updateErr) {
        alert("Fehler beim Abziehen der Punkte.");
        setRedeemLoading(false);
        return;
      }

      // 4. Insertar transacción
      await supabase.from("transactions").insert([
        {
          member_id: memberData.id,
          points_added: -selectedReward.cost,
          reason: "reward_redeem",
          source: "dashboard",
        },
      ]);

      // 5. Cerrar modal + refrescar
      setShowRedeemModal(false);
      setRedeemEmail("");
      loadRewards();

      alert("Belohnung erfolgreich eingelöst! 🎉");
    } catch (e) {
      console.error(e);
      alert("Fehler.");
    }

    setRedeemLoading(false);
  }

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center text-2xl">
        Wird geladen...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#fffbf7",
        padding: "3rem 2rem",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 className="text-3xl font-extrabold text-[#072049] mb-6">
        BiteBack Belohnungen 🎁
      </h1>

      {/* Tabla */}
      <section
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "2rem",
        }}
      >
        <table className="w-full border-collapse">
          <thead className="bg-purple-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Kosten</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Aktion</th>
            </tr>
          </thead>

          <tbody>
            {rewards.map((r, i) => (
              <tr
                key={r.id}
                className={i % 2 === 0 ? "bg-white" : "bg-purple-50"}
              >
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.cost}</td>
                <td className="p-3">{r.active ? "Aktiv" : "Inaktiv"}</td>

                <td className="p-3">
                  {/* 🔥 Einlösen */}
                  <button
                    onClick={() => openRedeemModal(r)}
                    className="px-3 py-1 rounded-md font-bold text-white mr-2"
                    style={{ backgroundColor: "#742cff" }}
                  >
                    Einlösen
                  </button>

                  {/* Deaktivieren */}
                  <button
                    className="px-3 py-1 rounded-md font-bold text-white"
                    style={{ backgroundColor: "#072049" }}
                  >
                    Deaktivieren
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 🔥 MODAL DE REDEEM */}
      {showRedeemModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedReward?.name} einlösen
            </h2>

            <p className="mb-2">Mitglied E-Mail:</p>

            <input
              type="email"
              value={redeemEmail}
              onChange={(e) => setRedeemEmail(e.target.value)}
              placeholder="kunde@email.com"
              className="w-full p-2 border rounded mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRedeemModal(false)}
                className="px-4 py-2 rounded bg-gray-300"
              >
                Abbrechen
              </button>

              <button
                onClick={handleRedeemReward}
                disabled={redeemLoading}
                className="px-4 py-2 rounded font-bold text-white"
                style={{
                  backgroundColor: redeemLoading ? "#aaa" : "#742cff",
                }}
              >
                {redeemLoading ? "..." : "Bestätigen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}