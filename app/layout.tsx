import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import NavBar from "@/components/navbar";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeedReel — help nearby, no money involved",
  description: "A hyperlocal reel feed of real needs. Pledge in-kind help, confirm through stewards, earn verifiable recognition.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <div className="app-shell">
          <NavBar />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}