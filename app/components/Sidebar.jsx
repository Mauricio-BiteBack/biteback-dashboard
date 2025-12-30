"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, Gift, Scan } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#072049] text-white flex flex-col justify-between">
      <div>
        {/* Logo */}
        <div className="px-6 pt-8 pb-6">
          <Image
            src="/logo-biteback-website.png"
            alt="BiteBack"
            width={160}
            height={80}
            className="h-auto w-36"
            priority
          />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-3 px-4">
          <Link
            href="/members"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10 hover:text-[#fd6429] transition"
          >
            <Users size={18} /> Mitglieder
          </Link>

          <Link
            href="/transactions"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10 hover:text-[#fd6429] transition"
          >
            📊 Transaktionen
          </Link>

          <Link
            href="/rewards"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10 hover:text-[#fd6429] transition"
          >
            <Gift size={18} /> Belohnungen
          </Link>

          <Link
            href="/scan"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10 hover:text-[#fd6429] transition"
          >
            <Scan size={18} /> Scan
          </Link>
        </nav>
      </div>

      <p className="px-6 pb-6 text-xs text-white/50">
        © {new Date().getFullYear()} BiteBack
      </p>
    </aside>
  );
}