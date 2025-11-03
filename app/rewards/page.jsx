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
  const [showForm, setShowForm] = useState(false);
  const [newReward, setNewReward] = useState({ name: "", cost: 0 });
  const [busy, setBusy] = useState(false);

  // 🔹 1️⃣ Definir la función primero
  async function loadRewards() {
    setLoading(true);
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setRewards(data || []);
    setLoading(false);
  }

  // 🔹 2️⃣ Luego el useEffect que la usa
  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) router.replace("/auth");
      else loadRewards();
    }
    init();
  }, [router]);

  async function handleCreateReward(e) {
    e.preventDefault();
    if (!newReward.name || newReward.cost <= 0)
      return alert("Bitte alle Felder ausfüllen.");

    setBusy(true);
    const { error } = await supabase
      .from("rewards")
      .insert([{ name: newReward.name, cost: newReward.cost, active: true }]);
    setBusy(false);

    if (error) alert("Fehler beim Erstellen.");
    else {
      setNewReward({ name: "", cost: 0 });
      setShowForm(false);
      loadRewards();
    }
  }

  async function toggleActive(id, active) {
    await supabase.from("rewards").update({ active: !active }).eq("id", id);
    loadRewards();
  }

  async function deleteReward(id) {
    if (!confirm("Diese Belohnung wirklich löschen?")) return;
    await supabase.from("rewards").delete().eq("id", id);
    loadRewards();
  }

  if (loading) {
    return (
      <main
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fffbf7",
          fontFamily: "Inter, sans-serif",
          color: "#072049",
        }}
      >
        <h2>Wird geladen...</h2>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#fffbf7",
        fontFamily: "Inter, sans-serif",
        color: "#072049",
        padding: "3rem 2rem",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: "800",
              margin: 0,
              color: "#072049",
            }}
          >
            BiteBack Belohnungen 🎁
          </h1>
          <p style={{ color: "#2a2a2e", marginTop: "0.5rem", fontSize: "1rem" }}>
            Erstelle und verwalte deine Prämien für treue Kunden.
          </p>
        </div>

        <button
          style={{
            backgroundColor: "#742cff",
            border: "none",
            borderRadius: "10px",
            color: "white",
            fontWeight: "600",
            padding: "0.8rem 1.6rem",
            cursor: "pointer",
            fontSize: "0.95rem",
            boxShadow: "0 4px 12px rgba(116,44,255,0.25)",
            transition: "0.3s ease",
          }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Schließen" : "+ Neue Belohnung"}
        </button>
      </header>

      {/* Formular */}
      {showForm && (
        <form
          onSubmit={handleCreateReward}
          style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 6px 25px rgba(7,32,73,0.08)",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Neue Belohnung erstellen</h3>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Name (z. B. Kaffee gratis)"
              value={newReward.name}
              onChange={(e) =>
                setNewReward({ ...newReward, name: e.target.value })
              }
              style={{
                flex: 2,
                padding: "0.8rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "1rem",
              }}
            />
            <input
              type="number"
              placeholder="Kosten (Punkte)"
              value={newReward.cost}
              onChange={(e) =>
                setNewReward({ ...newReward, cost: Number(e.target.value) })
              }
              style={{
                flex: 1,
                padding: "0.8rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "1rem",
              }}
            />
            <button
              type="submit"
              disabled={busy}
              style={{
                backgroundColor: busy ? "#ccc" : "#742cff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.8rem 1.2rem",
                cursor: busy ? "default" : "pointer",
                fontWeight: "600",
              }}
            >
              Speichern
            </button>
          </div>
        </form>
      )}

      {/* Tabelle */}
      <section
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 6px 25px rgba(7,32,73,0.08)",
          padding: "2rem",
        }}
      >
        {rewards.length === 0 ? (
          <p style={{ textAlign: "center", color: "#2a2a2e" }}>
            Keine Belohnungen gefunden.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.95rem",
            }}
          >
            <thead style={{ backgroundColor: "#f4f2ff" }}>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Kosten</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8f6ff",
                    transition: "0.2s",
                  }}
                >
                  <td style={tdStyle}>{r.name}</td>
                  <td style={tdStyle}>{r.cost}</td>
                  <td
                    style={{
                      ...tdStyle,
                      color: r.active ? "green" : "#fd6429",
                    }}
                  >
                    {r.active ? "Aktiv" : "Inaktiv"}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => toggleActive(r.id, r.active)}
                      style={smallBtnStyle("#742cff")}
                    >
                      {r.active ? "Deaktivieren" : "Aktivieren"}
                    </button>
                    <button
                      onClick={() => deleteReward(r.id)}
                      style={smallBtnStyle("#fd6429")}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

const thStyle = {
  padding: "1rem",
  textAlign: "left",
  fontWeight: "700",
  color: "#072049",
  borderBottom: "2px solid #eee",
};

const tdStyle = {
  padding: "1rem",
  color: "#2a2a2e",
  borderBottom: "1px solid #f0f0f0",
};

function smallBtnStyle(color) {
  return {
    backgroundColor: color,
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "0.4rem 0.8rem",
    cursor: "pointer",
    fontWeight: "600",
    marginRight: "0.5rem",
  };
}