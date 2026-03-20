"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

const navSections = [
  {
    title: "WORKSPACE",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/ask", label: "Ask" },
      { href: "/channels", label: "Channels" },
      { href: "/help", label: "Help Center" },
      { href: "/settings", label: "Settings" },
      { href: "/profile", label: "Profile" },
    ],
  },
  {
    title: "BILLING",
    items: [
      { href: "/plans", label: "Plans" },
      { href: "/billing", label: "Billing" },
      { href: "/credits", label: "Credits" },
    ],
  },
  {
    title: "SUPPORT & LEGAL",
    items: [
      { href: "/support", label: "Support" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/refund", label: "Refund" },
      { href: "/data-deletion", label: "Data Deletion" },
    ],
  },
];

export default function AppShell({
  title,
  subtitle,
  rightSlot,
  actions,
  children,
}: {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userCollapsedDesktop, setUserCollapsedDesktop] = useState(false);

  useEffect(() => {
    const syncLayout = () => {
      const mobile = window.innerWidth < 980;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(!userCollapsedDesktop);
      }
    };

    syncLayout();
    window.addEventListener("resize", syncLayout);
    return () => window.removeEventListener("resize", syncLayout);
  }, [userCollapsedDesktop]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const sidebarWidth = useMemo(() => {
    if (isMobile) return 0;
    return sidebarOpen ? 320 : 96;
  }, [isMobile, sidebarOpen]);

  function toggleSidebar() {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
      return;
    }

    setUserCollapsedDesktop((prev) => !prev);
    setSidebarOpen((prev) => !prev);
  }

  function closeSidebarOnMobile() {
    if (isMobile) setSidebarOpen(false);
  }

  const footerYear = new Date().getFullYear();

  return (
    <div style={styles.root}>
      {isMobile && sidebarOpen ? (
        <div style={styles.mobileOverlay} onClick={closeSidebarOnMobile} />
      ) : null}

      <aside
        style={{
          ...styles.sidebar,
          width: isMobile ? 320 : sidebarWidth,
          transform: isMobile
            ? sidebarOpen
              ? "translateX(0)"
              : "translateX(-100%)"
            : "none",
          zIndex: isMobile ? 40 : 20,
        }}
      >
        <button onClick={toggleSidebar} style={styles.collapseBtn} type="button">
          {isMobile ? (sidebarOpen ? "Close Menu" : "Open Menu") : sidebarOpen ? "Collapse" : "Menu"}
        </button>

        <div
          style={{
            ...styles.brand,
            justifyContent: sidebarOpen ? "flex-start" : "center",
          }}
        >
          <div style={styles.logoWrap}>
            <img
              src="/bms-logo.jpg"
              alt="Naija Tax Guide logo"
              style={styles.logoImage}
            />
          </div>

          {sidebarOpen ? (
            <div style={{ minWidth: 0 }}>
              <div style={styles.brandTitle}>Naija Tax Guide</div>
              <div style={styles.brandSub}>BMS Creative Concept</div>
              <div style={styles.brandTagline}>Structured tax guidance workspace</div>
            </div>
          ) : null}
        </div>

        <div style={styles.navScroll}>
          {navSections.map((section) => (
            <div key={section.title} style={styles.sectionBlock}>
              {sidebarOpen ? <div style={styles.sectionTitle}>{section.title}</div> : null}

              <nav style={styles.nav}>
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href + "/"));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        ...styles.link,
                        ...(active ? styles.linkActive : {}),
                        justifyContent: sidebarOpen ? "flex-start" : "center",
                        padding: sidebarOpen ? "13px 18px" : "13px 8px",
                      }}
                      title={item.label}
                    >
                      {sidebarOpen ? item.label : item.label.charAt(0)}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {sidebarOpen ? (
          <div style={styles.sidebarFooter}>
            <div style={styles.footerTitle}>Company Contact</div>
            <div style={styles.footerLine}>BMS Creative Concept</div>
            <div style={styles.footerLine}>+2347034941158</div>
            <div style={styles.footerLinks}>
              <Link href="/contact" style={styles.footerLink}>
                Contact
              </Link>
              <Link href="/support" style={styles.footerLink}>
                Support
              </Link>
              <Link href="/privacy" style={styles.footerLink}>
                Privacy
              </Link>
            </div>
          </div>
        ) : null}
      </aside>

      <main
        style={{
          ...styles.main,
          marginLeft: isMobile ? 0 : sidebarWidth,
        }}
      >
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            {isMobile ? (
              <button onClick={toggleSidebar} style={styles.mobileMenuBtn} type="button">
                Menu
              </button>
            ) : null}

            <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <div style={styles.topbarTitle}>{title || "Naija Tax Guide"}</div>
              {subtitle ? <div style={styles.topbarSubtitle}>{subtitle}</div> : null}
            </div>
          </div>

          <div style={styles.topbarRight}>
            {rightSlot ? <div style={styles.topbarSlotWrap}>{rightSlot}</div> : null}
            {actions ? <div style={styles.topbarSlotWrap}>{actions}</div> : null}
          </div>
        </header>

        <section style={styles.content}>{children}</section>

        <footer style={styles.pageFooter}>
          <div style={styles.pageFooterInner}>
            <div style={styles.pageFooterBrand}>
              <div style={styles.pageFooterTitle}>Naija Tax Guide</div>
              <div style={styles.pageFooterText}>Operated by BMS Creative Concept.</div>
              <div style={styles.pageFooterText}>General contact: +2347034941158</div>
            </div>

            <div style={styles.pageFooterRight}>
              <div style={styles.pageFooterLinks}>
                <Link href="/contact" style={styles.pageFooterLink}>
                  Contact
                </Link>
                <Link href="/support" style={styles.pageFooterLink}>
                  Support
                </Link>
                <Link href="/privacy" style={styles.pageFooterLink}>
                  Privacy
                </Link>
                <Link href="/terms" style={styles.pageFooterLink}>
                  Terms
                </Link>
                <Link href="/refund" style={styles.pageFooterLink}>
                  Refund
                </Link>
                <Link href="/data-deletion" style={styles.pageFooterLink}>
                  Data Deletion
                </Link>
              </div>

              <div style={styles.pageFooterSlogan}>
                From Deep Root, We Soar.
              </div>
            </div>
          </div>

          <div style={styles.pageFooterBottom}>
            © {footerYear} Naija Tax Guide · BMS Creative Concept. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}

export function shellButtonPrimary(): React.CSSProperties {
  return {
    padding: "10px 16px",
    borderRadius: 14,
    border: "1px solid rgba(99,102,241,0.45)",
    background: "linear-gradient(180deg, rgba(99,102,241,0.96), rgba(79,70,229,0.92))",
    color: "white",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    boxShadow: "0 10px 25px rgba(79,70,229,0.18)",
  };
}

export function shellButtonSecondary(): React.CSSProperties {
  return {
    padding: "10px 16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
    color: "white",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
  };
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(67,97,238,0.16), transparent 22%), #050816",
    color: "white",
    position: "relative",
  },

  mobileOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.48)",
    zIndex: 30,
  },

  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    background: "#040a1d",
    overflow: "hidden",
    transition: "transform 0.25s ease, width 0.25s ease",
  },

  collapseBtn: {
    width: "100%",
    minHeight: 52,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
    color: "white",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
  },

  brand: {
    display: "flex",
    gap: 14,
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  logoWrap: {
    flexShrink: 0,
  },

  logoImage: {
    width: 58,
    height: 58,
    borderRadius: 18,
    objectFit: "cover",
    border: "1px solid rgba(234,179,8,0.32)",
    background: "rgba(255,255,255,0.06)",
  },

  brandTitle: {
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.15,
    color: "white",
  },

  brandSub: {
    fontSize: 14,
    opacity: 0.95,
    marginTop: 4,
    color: "#facc15",
    fontWeight: 800,
  },

  brandTagline: {
    fontSize: 12,
    opacity: 0.72,
    marginTop: 6,
    lineHeight: 1.4,
  },

  navScroll: {
    overflowY: "auto",
    paddingRight: 4,
    display: "grid",
    gap: 20,
    minHeight: 0,
  },

  sectionBlock: {
    display: "grid",
    gap: 12,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.7,
    letterSpacing: 0.5,
    paddingLeft: 2,
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  link: {
    minHeight: 52,
    borderRadius: 18,
    textDecoration: "none",
    color: "rgba(255,255,255,0.9)",
    border: "1px solid transparent",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    fontSize: 16,
    fontWeight: 800,
    transition: "all 0.2s ease",
  },

  linkActive: {
    background: "rgba(67,97,238,0.14)",
    border: "1px solid rgba(67,97,238,0.30)",
    color: "white",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
  },

  sidebarFooter: {
    marginTop: "auto",
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "grid",
    gap: 8,
  },

  footerTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: "white",
  },

  footerLine: {
    fontSize: 13,
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.5,
  },

  footerLinks: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 2,
    marginBottom: 2,
  },

  footerLink: {
    fontSize: 12,
    color: "#c7d2fe",
    textDecoration: "none",
    fontWeight: 700,
  },

  main: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    transition: "margin-left 0.25s ease",
  },

  topbar: {
    minHeight: 82,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(6, 13, 35, 0.84)",
    position: "sticky",
    top: 0,
    zIndex: 15,
    backdropFilter: "blur(10px)",
    gap: 16,
    flexWrap: "wrap",
  },

  topbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minWidth: 0,
    flex: "1 1 320px",
  },

  mobileMenuBtn: {
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },

  topbarTitle: {
    fontSize: 18,
    fontWeight: 900,
    opacity: 0.98,
    lineHeight: 1.1,
  },

  topbarSubtitle: {
    fontSize: 14,
    opacity: 0.72,
    lineHeight: 1.45,
    maxWidth: 760,
  },

  topbarRight: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    marginLeft: "auto",
    flex: "0 1 auto",
  },

  topbarSlotWrap: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  content: {
    padding: 20,
    flex: "1 1 auto",
  },

  pageFooter: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(7, 14, 34, 0.82)",
    padding: "20px 20px 16px",
    marginTop: "auto",
  },

  pageFooterInner: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
  },

  pageFooterBrand: {
    display: "grid",
    gap: 6,
  },

  pageFooterRight: {
    display: "grid",
    gap: 10,
    justifyItems: "end",
    alignContent: "start",
  },

  pageFooterTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "white",
  },

  pageFooterText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.74)",
    lineHeight: 1.5,
  },

  pageFooterSlogan: {
    fontSize: 13,
    color: "#facc15",
    fontWeight: 800,
    lineHeight: 1.5,
    textAlign: "right",
  },

  pageFooterLinks: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },

  pageFooterLink: {
    fontSize: 13,
    color: "#c7d2fe",
    textDecoration: "none",
    fontWeight: 700,
  },

  pageFooterBottom: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    fontSize: 12,
    color: "rgba(255,255,255,0.58)",
    lineHeight: 1.5,
  },
};