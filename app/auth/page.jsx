"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuthPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1️⃣ Obtener sesión inicial
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session || null);
      setLoading(false);
    };
    getSession();

    // 2️⃣ Escuchar cambios de autenticación
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Auth event:", event);
        setSession(session);

        if (event === "SIGNED_IN") {
          console.log("✅ Login exitoso → redirigiendo...");
          router.push("/members");
        }

        if (event === "SIGNED_OUT") {
          console.log("🚪 Sesión cerrada → redirigiendo...");
          router.push("/auth");
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [router]);

  // 3️⃣ Redirigir automáticamente si ya está logueado
  useEffect(() => {
    if (session) {
      console.log("➡️ Usuario ya logueado → redirigiendo...");
      router.push("/members");
    }
  }, [session, router]);

  // 4️⃣ Mostrar carga
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fffbf7",
        }}
      >
        <h2 style={{ color: "#072049" }}>Wird geladen...</h2>
      </div>
    );
  }

  // 5️⃣ Render del formulario de login
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fffbf7",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "3rem",
          borderRadius: "20px",
          boxShadow: "0 6px 25px rgba(7,32,73,0.08)",
          width: "400px",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            color: "#072049",
          }}
        >
          BiteBack Login
        </h1>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#742cff",
                  brandAccent: "#fd6429",
                },
              },
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: "E-Mail-Adresse",
                password_label: "Passwort",
                button_label: "Einloggen",
              },
              sign_up: {
                email_label: "E-Mail-Adresse",
                password_label: "Passwort",
                button_label: "Registrieren",
              },
            },
          }}
          providers={[]}
          redirectTo="http://localhost:3000/members"
        />

        <p
          style={{
            textAlign: "center",
            marginTop: "1rem",
            fontSize: "0.9rem",
            color: "#888",
          }}
        >
          🔒 Deine Daten sind bei uns sicher.
        </p>
      </div>
    </main>
  );
}