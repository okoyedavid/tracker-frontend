import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";
import { DirectionProvider } from "@/components/foundations/direction/direction";
import { Providers } from "@/components/application/providers";
import { Navbar } from "@/components/application/navbar";
import { cx } from "@/utils/cx";

const poppins = localFont({
  variable: "--font-poppins",
  display: "swap",
  src: [
    { path: "../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Receipt Tracker",
  description: "Less paperwork. More clarity. Scan and review your receipts in one place.",
  icons: { icon: "/logo.svg", apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={cx(poppins.variable, "h-full font-sans antialiased")}
    >
      <body className="min-h-full flex flex-col">
        <DirectionProvider locale="en-US"><Providers><Navbar />{children}</Providers></DirectionProvider>
      </body>
    </html>
  );
}
