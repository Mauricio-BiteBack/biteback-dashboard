"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

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

  // ✅ Primero: define handleRawText arriba (para evitar el error)
  async function handleRawText(text) {
    let externalId = null;
    if (text?.startsWith("BB:")) {
      externalId = text.split("BB:")[1]?.trim();
    } else {
      externalId = text?.trim();
    }

    if (!externalId) {
      alert("Ungültiger QR-Code.");
      return;
    }

    // 🔍 Buscar miembro
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
      alert(`Kein Mitglied mit external_id: ${externalId} gefunden.`);
      setScanned({ external_id: externalId, member: null });
      return;
    }

    setScanned({ external_id: externalId, member: data });
  }

  // 🔒 Verifica sesión
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) router.replace("/auth");
    })();
  }, [router]);

  // 🎥 Inicializa la cámara + lector
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
        handleRawText(preview.getText()); // ✅ ya definida arriba
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

  // ➕ Sumar puntos
  async function addPoints(delta = 10) {
    if (!scanned?.member?.id) return;
    setBusy(true);

    const memberId = scanned.member.id;
    const current = scanned.member.points ?? 0;

    const { error: upErr } = await supabase
      .from("members")
      .update({ points: current + delta })
      .eq("id", memberId);

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

    const { data: refreshed } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();

    setScanned((prev) => ({ ...prev, member: refreshed }));
    setBusy(false);
  }

  // 🎁 Canjear reward
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

    const { error: upErr } = await supabase
      .from("members")
      .update({ points: current - rewardCost })
      .eq("id", memberId);

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

    const { data: refreshed } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();

    setScanned((prev) => ({ ...prev, member: refreshed }));
    setBusy(false);
  }

  // 🖼️ Render UI
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#fffbf7",
        fontFamily: "Inter, sans-serif",
        color: "#072049",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>
        QR-Scan · Punkte & Einlösen
      </h1>

      {cameraError ? (
        <div style={{ color: "#fd6429" }}>Kamerafehler: {cameraError}</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* Cámara */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 6px 25px rgba(7,32,73,0.08)",
              padding: "1rem",
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: "100%",
                borderRadius: 12,
                background: "#000",
              }}
              muted
              playsInline
            />
            <p style={{ marginTop: "0.5rem", color: "#2a2a2e" }}>
              Richte die Kamera auf den Kunden-QR.
            </p>
          </div>

          {/* Resultado del escaneo */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 6px 25px rgba(7,32,73,0.08)",
              padding: "1.2rem",
              minHeight: 240,
            }}
          >
            {!scanned ? (
              <p style={{ color: "#2a2a2e" }}>
                Noch nichts gescannt. Sobald ein QR erkannt wird, erscheint hier
                das Mitglied.
              </p>
            ) : scanned.member ? (
              <>
                <h3 style={{ marginTop: 0 }}>
                  {scanned.member.first_name} {scanned.member.last_name}
                </h3>
                <p style={{ margin: "4px 0" }}>{scanned.member.email}</p>
                <p style={{ margin: "4px 0" }}>
                  Punkte: <b>{scanned.member.points ?? 0}</b>
                </p>

                <div
                  style={{ display: "flex", gap: "0.8rem", marginTop: "1rem" }}
                >
                  <button
                    disabled={busy}
                    onClick={() => addPoints(10)}
                    style={{
                      backgroundColor: busy ? "#ccc" : "#742cff",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "0.8rem 1.2rem",
                      cursor: busy ? "default" : "pointer",
                      fontWeight: 600,
                    }}
                  >
                    +10 Punkte
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => redeemReward(50)}
                    style={{
                      backgroundColor: busy ? "#ccc" : "#fd6429",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "0.8rem 1.2rem",
                      cursor: busy ? "default" : "pointer",
                      fontWeight: 600,
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