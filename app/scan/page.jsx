"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// 🔧 FIX: quitar los "!" (solo se pueden usar en TS, no en JSX)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ScanPage() {
  const router = useRouter();

  const [scanned, setScanned] = useState(null); // { external_id, member }
  const [cameraError, setCameraError] = useState("");
  const [busy, setBusy] = useState(false);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // -------------------------------------------------
  // 1) PROCESAR TEXTO DEL QR
  // -------------------------------------------------
  async function handleRawText(text) {
    let externalId = null;

    // Formato:  "BB:XXXXX"
    if (text?.startsWith("BB:")) {
      externalId = text.split("BB:")[1]?.trim();
    } else {
      externalId = text?.trim();
    }

    if (!externalId) {
      alert("Ungültiger QR-Code.");
      return;
    }

    // Buscar miembro
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("external_id", externalId)
      .maybeSingle();

    if (error) {
      console.error(error);
      alert("Fehler beim Laden des Mitglieds.");
      return;
    }

    if (!data) {
      setScanned({ external_id: externalId, member: null });
      return;
    }

    setScanned({ external_id: externalId, member: data });
  }

  // -------------------------------------------------
  // 2) VERIFICAR SESIÓN
  // -------------------------------------------------
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) router.replace("/auth");
    })();
  }, [router]);

  // -------------------------------------------------
  // 3) INICIALIZAR CÁMARA Y ESCÁNER
  // -------------------------------------------------
  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    async function start() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();

        if (!devices.length) {
          setCameraError("Keine Kamera gefunden.");
          return;
        }

        const deviceId = devices[0].deviceId;

        const preview = await codeReader.decodeOnceFromVideoDevice(
          deviceId,
          videoRef.current
        );

        handleRawText(preview.getText());
      } catch (e) {
        setCameraError(String(e?.message ?? e));
      }
    }

    start();

    return () => {
      try {
        codeReader.reset();
      } catch {}
    };
  }, []);

  // -------------------------------------------------
  // 4) SUMAR PUNTOS
  // -------------------------------------------------
  async function addPoints(delta = 10) {
    if (!scanned?.member?.id) return;

    setBusy(true);

    const memberId = scanned.member.id;
    const current = scanned.member.points ?? 0;

    // Update points
    const { error: upErr } = await supabase
      .from("members")
      .update({ points: current + delta })
      .eq("id", memberId);

    // Insert transaction
    const { error: txErr } = await supabase.from("transactions").insert([
      {
        member_id: memberId,
        points_delta: delta,
        reason: "scan_add",
        source: "scan",
      },
    ]);

    if (upErr || txErr) {
      console.error(upErr || txErr);
      alert("Fehler beim Aktualisieren.");
      setBusy(false);
      return;
    }

    // Refresh member
    const { data: refreshed } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();

    setScanned((prev) => ({ ...prev, member: refreshed }));
    setBusy(false);
  }

  // -------------------------------------------------
  // 5) CANJEAR PREMIO
  // -------------------------------------------------
  async function redeemReward(rewardCost = 50) {
    if (!scanned?.member?.id) return;

    setBusy(true);

    const memberId = scanned.member.id;
    const current = scanned.member.points ?? 0;

    if (current < rewardCost) {
      alert("Nicht genug Punkte.");
      setBusy(false);
      return;
    }

    // Update points
    const { error: upErr } = await supabase
      .from("members")
      .update({ points: current - rewardCost })
      .eq("id", memberId);

    // Insert transaction
    const { error: txErr } = await supabase.from("transactions").insert([
      {
        member_id: memberId,
        points_delta: -rewardCost,
        reason: "reward_redeem",
        source: "scan",
      },
    ]);

    if (upErr || txErr) {
      console.error(upErr || txErr);
      alert("Fehler beim Einlösen.");
      setBusy(false);
      return;
    }

    // Refresh member
    const { data: refreshed } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();

    setScanned((prev) => ({ ...prev, member: refreshed }));
    setBusy(false);
  }

  // -------------------------------------------------
  // 6) UI
  // -------------------------------------------------
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#fffbf7",
        padding: "2rem",
        color: "#072049",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.7rem", fontWeight: 800, marginBottom: "1rem" }}>
        QR-Scan · Punkte & Einlösen
      </h1>

      {/* ERROR CAMARA */}
      {cameraError ? (
        <div style={{ color: "#fd6429", fontWeight: 600 }}>
          Kamerafehler: {cameraError}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
          }}
        >
          {/* VIDEO */}
          <div
            style={{
              background: "white",
              padding: "1rem",
              borderRadius: 16,
              boxShadow: "0 6px 25px rgba(7,32,73,0.08)",
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                borderRadius: 12,
                background: "black",
              }}
            />
            <p style={{ marginTop: "0.5rem", color: "#2a2a2e" }}>
              Richte die Kamera auf den Kunden-QR.
            </p>
          </div>

          {/* RESULTADO */}
          <div
            style={{
              background: "white",
              padding: "1.2rem",
              borderRadius: 16,
              boxShadow: "0 6px 25px rgba(7,32,73,0.08)",
              minHeight: 240,
            }}
          >
            {!scanned ? (
              <p style={{ color: "#2a2a2e" }}>
                Noch nichts gescannt. Warte auf einen QR-Code…
              </p>
            ) : scanned.member ? (
              <>
                <h3 style={{ marginTop: 0, marginBottom: 4 }}>
                  {scanned.member.first_name} {scanned.member.last_name}
                </h3>
                <p style={{ margin: 0 }}>{scanned.member.email}</p>
                <p style={{ margin: "4px 0" }}>
                  Punkte: <b>{scanned.member.points ?? 0}</b>
                </p>

                <div style={{ display: "flex", gap: "0.8rem", marginTop: 16 }}>
                  <button
                    disabled={busy}
                    onClick={() => addPoints(10)}
                    style={{
                      background: busy ? "#ccc" : "#742cff",
                      color: "white",
                      borderRadius: 10,
                      padding: "0.8rem 1.2rem",
                      border: "none",
                      fontWeight: 600,
                      cursor: busy ? "default" : "pointer",
                    }}
                  >
                    +10 Punkte
                  </button>

                  <button
                    disabled={busy}
                    onClick={() => redeemReward(50)}
                    style={{
                      background: busy ? "#ccc" : "#fd6429",
                      color: "white",
                      borderRadius: 10,
                      padding: "0.8rem 1.2rem",
                      border: "none",
                      fontWeight: 600,
                      cursor: busy ? "default" : "pointer",
                    }}
                  >
                    50 einlösen
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: "#fd6429" }}>
                Mitglied mit external_id <b>{scanned.external_id}</b> nicht
                gefunden.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}