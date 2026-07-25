import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commerce GPT - AI Assistant for Commerce Education",
  description:
    "A domain-specific AI assistant for commerce education, covering accounting, finance, economics, taxation, and business law.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
