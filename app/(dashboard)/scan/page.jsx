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

  const [scanned, setScanned] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [busy, setBusy] = useState(false);

  const [rewards, setRewards] = useState([]);        // 🔥 NEW: Rewards dropdown
  const [selectedReward, setSelectedReward] = useState(null);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // -------------------------------------------------
  // LOAD REWARDS
  // -------------------------------------------------
  async function loadRewards() {
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .eq("active", true)
      .order("cost", { ascending: true });

    if (!error) setRewards(data || []);
  }

  // -------------------------------------------------
  // PROCESAR QR → EMAIL
  // -------------------------------------------------
  async function handleRawText(text) {
    let extracted = text?.trim();

    if (!extracted) {
      alert("Ungültiger QR-Code.");
      return;
    }

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("email", extracted)
      .maybeSingle();

    if (error) {
      console.error(error);
      alert("Fehler beim Laden des Mitglieds.");
      return;
    }

    if (!data) {
      setScanned({ email: extracted, member: null });
      return;
    }

    setScanned({ email: extracted, member: data });
  }

  // -------------------------------------------------
  // CHECK SESSION
  // -------------------------------------------------
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) router.replace("/auth");
      else loadRewards(); // 🔥 Load rewards only when logged in
    })();
  }, [router]);

  // -------------------------------------------------
  // CAMERA
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

        const preview = await codeReader.decodeOnceFromVideoDevice(
          devices[0].deviceId,
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
  // SUMAR PUNTOS
  // -------------------------------------------------
  async function addPoints(delta = 10) {
    if (!scanned?.member?.id) return;
    setBusy(true);

    const member = scanned.member;
    const newPoints = member.points + delta;

    const { error: upErr } = await supabase
      .from("members")
      .update({ points: newPoints })
      .eq("id", member.id);

    await supabase.from("transactions").insert([
      {
        member_id: member.id,
        points_added: delta,
        reason: "scan_add",
        source: "scan",
      },
    ]);

    const { data: refreshed } = await supabase
      .from("members")
      .select("*")
      .eq("id", member.id)
      .maybeSingle();

    setScanned((prev) => ({ ...prev, member: refreshed }));
    setBusy(false);
  }

  // -------------------------------------------------
  // CANJEAR REWARD (desde dropdown)
  // -------------------------------------------------
  async function redeemSelectedReward() {
    if (!selectedReward) return alert("Bitte Reward wählen.");
    if (!scanned?.member?.id) return;

    setBusy(true);

    const reward = selectedReward;
    const member = scanned.member;

    if (member.points < reward.cost) {
      alert("Nicht genug Punkte!");
      setBusy(false);
      return;
    }

    const newPoints = member.points - reward.cost;

    await supabase
      .from("members")
      .update({ points: newPoints })
      .eq("id", member.id);

    await supabase.from("transactions").insert([
      {
        member_id: member.id,
        points_added: -reward.cost,
        reason: "reward_redeem",
        source: "scan",
      },
    ]);

    const { data: refreshed } = await supabase
      .from("members")
      .select("*")
      .eq("id", member.id)
      .maybeSingle();

    setScanned((prev) => ({ ...prev, member: refreshed }));
    setBusy(false);

    alert(`Reward "${reward.name}" eingelöst!`);
  }

  // -------------------------------------------------
  // UI
  // -------------------------------------------------
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#fffbf7",
        padding: "2rem",
        color: "#072049",
      }}
    >
      <h1 style={{ fontSize: "1.7rem", fontWeight: 800, marginBottom: "1rem" }}>
        QR-Scan · Punkte & Einlösen
      </h1>

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
          {/* CAMERA */}
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
            <p style={{ marginTop: "0.5rem" }}>Richte die Kamera auf den QR.</p>
          </div>

          {/* RESULT */}
          <div
            style={{
              background: "white",
              padding: "1.2rem",
              borderRadius: 16,
              boxShadow: "0 6px 25px rgba(7,32,73,0.08)",
            }}
          >
            {!scanned ? (
              <p>Warte auf QR-Code…</p>
            ) : scanned.member ? (
              <>
                <h3>
                  {scanned.member.first_name} {scanned.member.last_name}
                </h3>
                <p>{scanned.member.email}</p>
                <p>
                  Punkte: <b>{scanned.member.points}</b>
                </p>

                {/* +10 POINTS */}
                <button
                  onClick={() => addPoints(10)}
                  disabled={busy}
                  style={{
                    marginTop: "1rem",
                    background: busy ? "#ccc" : "#742cff",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "0.8rem 1.2rem",
                    fontWeight: 600,
                    cursor: busy ? "default" : "pointer",
                    display: "block",
                    width: "100%",
                  }}
                >
                  +10 Punkte
                </button>

                {/* REWARD DROPDOWN */}
                <div style={{ marginTop: "1rem" }}>
                  <select
                    disabled={busy}
                    onChange={(e) =>
                      setSelectedReward(
                        rewards.find((r) => r.id === e.target.value)
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: 8,
                      border: "1px solid #ccc",
                    }}
                  >
                    <option value="">Reward wählen…</option>
                    {rewards.map((rw) => (
                      <option key={rw.id} value={rw.id}>
                        {rw.name} ({rw.cost} Punkte)
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={redeemSelectedReward}
                    disabled={busy}
                    style={{
                      marginTop: "0.8rem",
                      background: busy ? "#ccc" : "#fd6429",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "0.8rem 1.2rem",
                      fontWeight: 600,
                      width: "100%",
                    }}
                  >
                    Reward einlösen
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: "#fd6429" }}>
                Mitglied mit Email <b>{scanned.email}</b> nicht gefunden.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}