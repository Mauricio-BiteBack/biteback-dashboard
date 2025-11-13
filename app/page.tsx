"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession();

      // Si no hay sesión → a login
      if (!data.session) {
        router.replace("/auth");
        return;
      }

      // Si hay sesión → directamente a /members
      router.replace("/members");
    }

    check();
  }, [router]);

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