"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const handleSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        // Si ya tiene sesión, redirige al dashboard
        router.push("/members");
      } else {
        // Si no, lo manda al login
        router.push("/auth");
      }
    };
    handleSession();
  }, [router]);

  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        backgroundColor: "#fffbf7",
        color: "#072049",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", color: "#072049" }}>
        🔄 Bitte warten...
      </h1>
      <p>Du wirst gleich weitergeleitet.</p>
    </main>
  );
}