import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "BiteBack Dashboard",
  description: "Verwalte deine Mitglieder und Punkte in Echtzeit 🍽️",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-[#fffbf7] text-[#072049] font-sans flex">
        <Sidebar />
        <main className="ml-56 w-full min-h-screen p-10 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}