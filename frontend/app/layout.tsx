import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GenLegal AI - Understand Contracts. Avoid Risks.",
  description:
    "GenLegal AI uses advanced AI and blockchain technology to analyze contracts, identify obligations, and highlight risks in seconds - verified on-chain with GenLayer consensus.",
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Runs before React hydrates so there's no flash of the wrong
            theme - reads the same localStorage key ThemeProvider uses. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('genlegal_theme')||'dark';var light=m==='light'||(m==='system'&&window.matchMedia('(prefers-color-scheme: light)').matches);if(light)document.documentElement.classList.add('light');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-bg text-white font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
