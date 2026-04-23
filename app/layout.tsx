import type { Metadata } from "next";
import "./globals.css";
import NavTabs from "./components/NavTabs";

export const metadata: Metadata = {
  title: "Pokemon Pulse",
  description: "Daily signal from the Pokemon cards and TCG community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-neutral-950 text-neutral-100 flex flex-col">
        <div className="max-w-2xl mx-auto px-4 w-full pt-10">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">Pokemon Pulse</h1>
            <p className="text-neutral-400 mt-1 text-sm">
              Daily signal from the Pokemon cards and TCG community
            </p>
            <NavTabs />
          </header>
        </div>
        <div className="max-w-2xl mx-auto px-4 w-full flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
