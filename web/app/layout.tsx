import type { Metadata } from "next";
import { clashDisplay, montserrat } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stories Pricing Benchmark — Ru'ya 360",
  description: "Pricing positioning analysis prepared for Stories by Ru'ya 360.",
};

// Runs before paint, outside React, so a returning dark-mode visitor never
// sees a flash of the light theme while the ThemeProvider hydrates.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("stories-theme");
    if (stored === "dark") document.documentElement.setAttribute("data-theme", "dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${clashDisplay.variable} ${montserrat.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
