"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient"; // usa tu cliente actual (el que ya funcionaba)
import Sidebar from "../components/Sidebar"; // ajusta si tu path es distinto

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      if (!ignore && !data?.session) router.replace("/auth");
      if (!ignore) setLoading(false);
    };

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) router.replace("/auth");
    });

    return () => {
      ignore = true;
      sub?.subscription?.unsubscribe();
    };
  }, [router, pathname]);

  if (loading) return <div style={{ padding: 40 }}>Wird geladen…</div>;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}