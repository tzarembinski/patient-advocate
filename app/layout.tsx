import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medical Timeline Maker",
  description: "Visualize patient treatment schedules with swim lane timelines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
