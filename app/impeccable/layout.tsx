import { Albert_Sans, Alumni_Sans, JetBrains_Mono } from "next/font/google";

const body = Albert_Sans({
  subsets: ["latin"],
  variable: "--ip-font-body",
  display: "swap",
});

const display = Alumni_Sans({
  subsets: ["latin"],
  variable: "--ip-font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--ip-font-mono",
  display: "swap",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${body.variable} ${display.variable} ${mono.variable}`}>{children}</div>;
}
