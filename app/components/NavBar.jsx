"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const links = [
    { href: "/members", label: "Mitglieder" },
    { href: "/transactions", label: "Transaktionen" },
    { href: "/rewards", label: "Belohnungen" },
    { href: "/scan", label: "Scan" },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.2rem 2rem",
        backgroundColor: "white",
        borderBottom: "1px solid #eee",
        marginBottom: "2rem",
      }}
    >
      <div style={{ display: "flex", gap: "1.5rem" }}>
        {links.map((l) => (
          <button
            key={l.href}
            onClick={() => router.push(l.href)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: 8,
              backgroundColor: pathname === l.href ? "#742cff" : "transparent",
              color: pathname === l.href ? "white" : "#742cff",
              fontWeight: 600,
              border: "1px solid #742cff",
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleLogout}
        style={{
          backgroundColor: "black",
          color: "white",
          padding: "0.6rem 1rem",
          borderRadius: 8,
          fontWeight: 600,
        }}
      >
        Abmelden
      </button>
    </nav>
  );
}