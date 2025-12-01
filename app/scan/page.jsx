"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import NavBar from "../components/NavBar"; // ✅ RUTA CORRECTA DESDE /app/scan

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ScanPage() {
  const router = useRouter();

  const [scanned, setScanned] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [busy, setBusy] = useState(false);

  const [rewards, setRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);

  const videoRef = useRef(null);

  // --------------------------------------------------------------------
  // LOAD REWARDS
  // --------------------------------------------------------------------
  async function loadRewards() {
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .eq("active", true)
      .order("cost", { ascending: true });

    if (!error) setRewards(data || []);
  }

  // --------------------------------------------------------------------
  // PROCESS QR → EMAIL
  // --------------------------------------------------------------------
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

  // --------------------------------------------------------------------
  // CHECK SESSION + LOAD REWARDS
  // --------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) router.replace("/auth");
      else loadRewards();
    })();
  }, [router]);

  // --------------------------------------------------------------------
  // CAMERA
  // --------------------------------------------------------------------
  useEffect(() => {
    const reader = new BrowserMultiFormatReader();

    async function start() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();

        if (!devices.length) {
          setCameraError("Keine Kamera gefunden.");
          return;
        }

        const videoDeviceId = devices[0].deviceId;

        const result = await reader.decodeOnceFromVideoDevice(
          videoDeviceId,
          videoRef.current
        );

        handleRawText(result.getText());
      } catch (e) {
        setCameraError(String(e?.message ?? e));
      }
    }

    start();

    return () => {
      try {
        reader.reset();
      } catch {}
    };
  }, []);

  // --------------------------------------------------------------------
  // ADD POINTS
  // --------------------------------------------------------------------
  async function addPoints(delta = 10) {
    if (!scanned?.member?.id) return;
    setBusy(true);

    const member = scanned.member;
    const updatedPoints = (member.points ?? 0) + delta;

    await supabase
      .from("members")
      .update({ points: updatedPoints })
      .eq("id", member.id);

    await supabase.from("transactions").insert([
      {
        member_id: member.id,
        points_added: delta,
        reason: "scan_add",
        source: "scan",
        amount: 0, // requerido por tu tabla
      },
    });

    const { data: refreshed } = await supabase
      .from("members")
      .select("*")
      .eq("id", member.id)
      .maybeSingle();

    setScanned({ ...scanned, member: refreshed });
    setBusy(false);
  }

  // --------------------------------------------------------------------
  // REDEEM SELECTED REWARD
  // --------------------------------------------------------------------
  async function redeemSelectedReward() {
    if (!selectedReward) return alert("Bitte Reward wählen.");
    if (!scanned?.member?.id) return;

    setBusy(true);

    const reward = selectedReward;
    const member = scanned.member;

    if ((member.points ?? 0) < reward.cost) {
      alert("Nicht genug Punkte!");
      setBusy(false);
      return;
    }

    const updated = member.points - reward.cost;

    await supabase
      .from("members")
      .update({ points: updated })
      .eq("id", member.id);

    await supabase.from("transactions").insert([
      {
        member_id: member.id,
        points_added: -reward.cost,
        reason: "reward_redeem",
        source: "scan",
        amount: 0,
      },
    });

    const { data: refreshed } = await supabase
      .from("members")
      .select("*")
      .eq("id", member.id)
      .maybeSingle();

    setScanned({ ...scanned, member: refreshed });
    setBusy(false);
    alert(`Reward "${reward.name}" eingelöst!`);
  }

  // --------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-[#fffbf7] font-[Inter] text-[#072049]">
      <NavBar />

      <div className="max-w-6xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-extrabold mb-6">
          QR-Scan · Punkte & Einlösen
        </h1>

        {cameraError ? (
          <div className="text-red-500 font-bold">{cameraError}</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* CAMERA */}
            <div className="bg-white p-4 rounded-xl shadow-md">
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full rounded-lg bg-black"
              />
              <p className="mt-2">Richte die Kamera auf den QR.</p>
            </div>

            {/* RESULT */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              {!scanned ? (
                <p>Warte auf QR-Code…</p>
              ) : scanned.member ? (
                <>
                  <h3 className="font-bold text-lg">
                    {scanned.member.first_name} {scanned.member.last_name}
                  </h3>
                  <p>{scanned.member.email}</p>
                  <p className="mt-2">
                    Punkte: <b>{scanned.member.points}</b>
                  </p>

                  {/* +10 BUTTON */}
                  <button
                    onClick={() => addPoints(10)}
                    disabled={busy}
                    className={`w-full mt-4 py-3 rounded-lg font-bold text-white ${
                      busy ? "bg-gray-400" : "bg-[#742cff] hover:bg-[#fd6429]"
                    }`}
                  >
                    +10 Punkte
                  </button>

                  {/* REWARD DROPDOWN */}
                  <div className="mt-4">
                    <select
                      disabled={busy}
                      className="w-full p-3 rounded-lg border"
                      onChange={(e) =>
                        setSelectedReward(
                          rewards.find((r) => r.id === e.target.value)
                        )
                      }
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
                      className={`w-full mt-3 py-3 rounded-lg font-bold text-white ${
                        busy
                          ? "bg-gray-400"
                          : "bg-[#fd6429] hover:bg-red-500"
                      }`}
                    >
                      Reward einlösen
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-red-500">
                  Mitglied mit Email <b>{scanned.email}</b> nicht gefunden.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}