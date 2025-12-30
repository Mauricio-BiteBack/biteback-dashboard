"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Sidebar from "../components/Sidebar"; // ✅ PATH CORRECTO

/* Cliente Supabase INLINE (sin lib, sin archivos raros) */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const boot = async () => {
      const { data } = await supabase.auth.getSession();

      if (!ignore && !data?.session) {
        router.replace("/auth");
        return;
      }

      if (!ignore) setLoading(false);
    };

    boot();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.replace("/auth");
      }
    );

    return () => {
      ignore = true;
      listener?.subscription?.unsubscribe();
    };
  }, [router, pathname]);

  if (loading) {
    return <div style={{ padding: 40 }}>Wird geladen…</div>;
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}