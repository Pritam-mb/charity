import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import NavBar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getStore } from "@/lib/store";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeedFeed - Hyperlocal In-Kind Mutual Aid",
  description: "A community platform for real needs. Pledge in-kind help, confirm through stewards, earn verifiable honor recognition.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, store] = await Promise.all([getCurrentUser(), getStore()]);

  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <div className="reddit-shell">
          <NavBar currentUser={user} users={store.users} />
          <div className="reddit-layout-body">
            <Sidebar cases={store.case_pages} />
            <div className="reddit-page-wrapper">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
