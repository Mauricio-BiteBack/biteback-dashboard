"use client";
import Link from "next/link";
import { Users, Gift, Scan } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#072049] text-white flex flex-col justify-between py-8">
      <div>
        <h1 className="text-2xl font-extrabold px-6 mb-10">BiteBack</h1>
        <nav className="flex flex-col space-y-3 px-4">
          <Link href="/members" className="flex items-center gap-3 hover:text-[#fd6429]">
            <Users size={18} /> Mitglieder
          </Link>

          <Link href="/transactions" className="flex items-center gap-3 hover:text-[#fd6429]">
            📊 Transaktionen
          </Link>

          <Link href="/rewards" className="flex items-center gap-3 hover:text-[#fd6429]">
            <Gift size={18} /> Belohnungen
          </Link>

          <Link href="/scan" className="flex items-center gap-3 hover:text-[#fd6429]">
            <Scan size={18} /> Scan
          </Link>
        </nav>
      </div>
      <p className="px-6 text-sm text-gray-400">© {new Date().getFullYear()} BiteBack</p>
    </aside>
  );
}