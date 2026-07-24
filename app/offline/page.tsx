import { SITE } from "@/lib/site";

export default function OfflinePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#050816", color: "#ffffff", display: "grid", placeItems: "center", padding: 18 }}>
      <section style={{ maxWidth: 720, border: "1px solid rgba(255,255,255,0.16)", borderRadius: 24, padding: 24, background: "#081127", display: "grid", gap: 14 }}>
        <div style={{ color: "#facc15", fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.8, fontSize: 12 }}>Offline</div>
        <h1 style={{ margin: 0, fontSize: "clamp(30px, 7vw, 48px)", lineHeight: 1.05 }}>{SITE.name} is waiting for connection.</h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.78)", lineHeight: 1.8 }}>
          Your device appears to be offline. Reconnect to the internet, then refresh this page to continue using the tax guidance workspace, billing, calculators, and messaging features.
        </p>
        <a href="/" style={{ color: "#ffffff", fontWeight: 900 }}>Return to homepage</a>
      </section>
    </main>
  );
}
