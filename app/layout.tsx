import type { Metadata } from "next";
import "./globals.css";
import Backdrop from "@/components/Backdrop";

export const metadata: Metadata = {
  title: "AI Testing Tool",
  description: "Answer 3 questions out loud and get an AI-scored result.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-200 antialiased selection:bg-indigo-500/30">
        <Backdrop />
        {children}
      </body>
    </html>
  );
}
