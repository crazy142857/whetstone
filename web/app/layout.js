import Link from "next/link";
import "./globals.css";
import Logo from "@/components/Logo";

export const metadata = {
  title: { default: "Whetstone", template: "%s · Whetstone" },
  description: "Short games that keep a team's skills sharp: reading data and using AI safely.",
  icons: { icon: "/icon.svg" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#12161f" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <Logo />
            <span>Whetstone</span>
          </Link>
          <nav>
            <Link href="/">Games</Link>
            <Link href="/field-guide">Field guide</Link>
            <Link href="/stats">My stats</Link>
          </nav>
        </header>
        <main className="main">{children}</main>
        <footer className="footer">
          Whetstone v{process.env.APP_VERSION}
          {process.env.GIT_SHA && process.env.GIT_SHA !== "unknown" ? ` · ${process.env.GIT_SHA}` : ""}
        </footer>
      </body>
    </html>
  );
}
