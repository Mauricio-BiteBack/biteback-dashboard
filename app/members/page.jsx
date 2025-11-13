"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🧠 Cargar miembros
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("members").select("*");
    if (error) {
      console.error("❌ Fehler beim Laden:", error);
      setMembers([]);
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  }, []);

  // 🔒 Verificar sesión antes de cargar datos
  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ Auth Error:", error.message);
        router.replace("/auth");
        return;
      }

      if (!session) {
        console.log("🚫 Keine aktive Sitzung. Weiterleitung...");
        router.replace("/auth");
        return;
      }

      console.log("✅ Sitzung erkannt. Mitglieder werden geladen...");
      fetchMembers();
    }

    checkSession();
  }, [router, fetchMembers]);

  // 🚪 Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    console.log("🚪 Logout erfolgreich. Weiterleitung...");
    router.replace("/auth");
  }

  // 🏅 Añadir puntos + registrar transacción
  async function handleAddPoints(memberId, currentPoints) {
    try {
      const next = (currentPoints ?? 0) + 10;

      // 1️⃣ Actualiza puntos en members
      const { error: updateErr } = await supabase
        .from("members")
        .update({ points: next })
        .eq("id", memberId);

      if (updateErr) {
        console.error("❌ Error al sumar puntos:", updateErr.message);
        return;
      }

      // 2️⃣ Registra la transacción en la tabla transactions
      const { error: txErr } = await supabase.from("transactions").insert([
        {
          member_id: memberId,
          points_delta: 10,
          reason: "manual_add",
          source: "dashboard",
        },
      ]);

      if (txErr) {
        console.error("⚠️ Error al registrar transacción:", txErr.message);
        return;
      }

      // 3️⃣ Refresca la lista
      await fetchMembers();

      console.log("✅ Puntos sumados y transacción registrada correctamente.");
    } catch (err) {
      console.error("💥 Error general:", err);
    }
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
          color: "#072049",
          fontFamily: "Inter, sans-serif",
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
      {/* 🔍 Verificación rápida de Tailwind */}
      <h1 className="text-bitepurple text-3xl font-bold mb-8">
        ✅ Tailwind funktioniert!
      </h1>

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
            BiteBack Mitglieder
          </h1>
          <p style={{ color: "#2a2a2e", marginTop: "0.5rem", fontSize: "1rem" }}>
            Verwalte und analysiere deine Kunden in Echtzeit 🍽️
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
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
            onMouseOver={(e) => (e.target.style.backgroundColor = "#fd6429")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#742cff")}
          >
            + Neues Mitglied
          </button>

          <button
            style={{
              backgroundColor: "#2a2a2e",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontWeight: "600",
              padding: "0.8rem 1.4rem",
              cursor: "pointer",
              fontSize: "0.95rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transition: "0.3s ease",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#fd6429")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#2a2a2e")}
            onClick={handleLogout}
          >
            Abmelden
          </button>
        </div>
      </header>

      {/* Tabelle */}
      <section
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 6px 25px rgba(7,32,73,0.08)",
          padding: "2rem",
        }}
      >
        {members.length === 0 ? (
          <p style={{ textAlign: "center", color: "#2a2a2e" }}>
            Keine Mitglieder gefunden.
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
                <th style={thStyle}>E-Mail</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Telefon</th>
                <th style={thStyle}>Stufe</th>
                <th style={thStyle}>Punkte</th>
                <th style={thStyle}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr
                  key={m.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8f6ff",
                    transition: "0.2s",
                  }}
                >
                  <td style={tdStyle}>{m.email}</td>
                  <td style={tdStyle}>
                    {m.first_name} {m.last_name}
                  </td>
                  <td style={tdStyle}>{m.phone}</td>
                  <td
                    style={{
                      ...tdStyle,
                      color: "#fd6429",
                      fontWeight: "600",
                      textTransform: "capitalize",
                    }}
                  >
                    {m.tier}
                  </td>
                  <td style={tdStyle}>{m.points ?? 0}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleAddPoints(m.id, m.points)}
                      style={{
                        backgroundColor: "#742cff",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.4rem 0.8rem",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "0.2s ease",
                      }}
                      onMouseOver={(e) =>
                        (e.target.style.backgroundColor = "#fd6429")
                      }
                      onMouseOut={(e) =>
                        (e.target.style.backgroundColor = "#742cff")
                      }
                    >
                      +10 Punkte
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: "3rem",
          textAlign: "center",
          color: "#2a2a2e",
          opacity: 0.7,
          fontSize: "0.85rem",
        }}
      >
        © {new Date().getFullYear()} BiteBack — Intelligentes Treueprogramm für
        Restaurants.
      </footer>
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