import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FLEXCUBE — Fund & Transact Teller Journey",
  description: "Interactive Oracle FLEXCUBE teller cash deposit and withdrawal simulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
