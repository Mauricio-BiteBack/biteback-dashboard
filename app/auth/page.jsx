"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1️⃣ Comprobar si ya hay sesión al cargar
  useEffect(() => {
    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth getSession error:", error);
      }

      if (data?.session) {
        // Ya está logueado → directo a /members
        router.replace("/members");
      } else {
        setLoading(false);
      }
    }

    checkSession();
  }, [router]);

  // 2️⃣ Enviar formulario de login
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // 🔥 evita que se recargue la página
    setErrorMsg("");
    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("Login error:", error);
      setErrorMsg(error.message || "Login fehlgeschlagen.");
      setSubmitting(false);
      return;
    }

    // ✅ Login OK
    setSubmitting(false);
    router.replace("/members");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fffbf7] font-[Inter] text-[#072049]">
        <h2 className="text-xl">Wird geladen...</h2>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fffbf7] font-[Inter] text-[#072049]">
      <div className="bg-white shadow-xl rounded-3xl px-10 py-12 w-full max-w-md">
        <h1 className="text-center text-2xl font-extrabold mb-8">
          BiteBack Login
        </h1>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm mb-1">E-Mail-Adresse</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full border rounded-lg px-3 py-2 bg-[#fffbe8] focus:outline-none focus:ring-2 focus:ring-[#742cff]"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Passwort</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full border rounded-lg px-3 py-2 bg-[#fffbe8] focus:outline-none focus:ring-2 focus:ring-[#742cff]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 rounded-lg font-bold text-white mt-2 ${
              submitting ? "bg-gray-400" : "bg-[#742cff] hover:bg-[#fd6429]"
            }`}
          >
            {submitting ? "Einloggen..." : "Einloggen"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600 space-y-1">
          <p>Forgot your password?</p>
          <p>Don&apos;t have an account? Sign up</p>
        </div>

        {errorMsg && (
          <div className="mt-4 bg-red-100 text-red-700 text-sm px-3 py-2 rounded-lg text-center">
            {errorMsg}
          </div>
        )}

        <p className="mt-5 text-xs text-center text-gray-500">
          🔒 Deine Daten sind bei uns sicher.
        </p>
      </div>
    </main>
  );
}