"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();

  async function handleLogout() {
    const { createClient } = await import("@supabase/supabase-js");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    await supabase.auth.signOut();
    router.replace("/auth");
  }

  const linkStyle =
    "px-4 py-2 text-sm font-semibold text-bitepurple hover:text-orange-500 transition";

  return (
    <nav className="w-full flex items-center justify-between bg-white shadow-sm px-6 py-4 mb-8">
      <div className="flex gap-6">
        <Link href="/members" className={linkStyle}>
          Mitglieder
        </Link>
        <Link href="/transactions" className={linkStyle}>
          Transaktionen
        </Link>
        <Link href="/rewards" className={linkStyle}>
          Belohnungen
        </Link>
        <Link href="/scan" className={linkStyle}>
          Scan
        </Link>
      </div>

      <button
        className="px-4 py-2 bg-zinc-900 text-white rounded-md font-semibold hover:bg-orange-500 transition"
        onClick={handleLogout}
      >
        Abmelden
      </button>
    </nav>
  );
}