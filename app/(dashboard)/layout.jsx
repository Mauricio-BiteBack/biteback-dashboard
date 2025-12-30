"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Sidebar from "../components/Sidebar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DashboardLayout({ children }) {
  const router = useRouter();
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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/auth");
    });

    return () => {
      ignore = true;
      sub?.subscription?.unsubscribe();
    };
  }, [router]);

  if (loading) return <div className="p-10">Wird geladen…</div>;

  return (
    <div className="min-h-screen bg-[#fffbf7] overflow-x-hidden">
      {/* Sidebar: desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main: full en mobile, desplazado en desktop */}
      <main className="min-h-screen w-full md:ml-56 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}