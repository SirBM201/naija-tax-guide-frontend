"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { apiJson, isApiError } from "@/lib/api";
import { SITE } from "@/lib/site";

type WorkspaceLimitsResponse = {
  ok?: boolean;
  counts?: {
    active_members_only?: number;
    owner_included_total?: number;
  };
  entitlements?: {
    ok?: boolean;
    plan?: {
      name?: string;
      code?: string;
      plan_family?: string;
    };
    plan_code?: string | null;
    plan_family?: string | null;
    workspace_limits?: {
      max_workspace_users?: number;
      max_linked_web_accounts?: number;
    };
    channel_limits?: {
      max_total_channels?: number;
      max_whatsapp_channels?: number;
      max_telegram_channels?: number;
    };
  };
};

type LinkStatusResponse = {
  ok?: boolean;
  telegram?: {
    linked?: boolean;
    is_verified?: boolean | null;
  } | null;
  whatsapp?: {
    linked?: boolean;
    is_verified?: boolean | null;
  } | null;
};

type SidebarStatus = {
  workspaceBadge: string;
  workspaceTone: "default" | "good" | "warn";
  channelsBadge: string;
  channelsTone: "default" | "good" | "warn";
};

const navSections = [
  {
    title: "WORKSPACE",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/ask", label: "Ask" },
      { href: "/channels", label: "Channels" },
      { href: "/workspace", label: "Workspace" },
      { href: "/history", label: "History" },
      { href: "/referrals", label: "Referrals" },
      { href: "/help", label: "Help Center" },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
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

function safeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function truthyValue(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function toneStyle(tone: "default" | "good" | "warn"): React.CSSProperties {
  if (tone === "good") {
    return {
      background: "rgba(16,185,129,0.12)",
      border: "1px solid rgba(16,185,129,0.24)",
      color: "#065f46",
    };
  }

  if (tone === "warn") {
    return {
      background: "rgba(245,158,11,0.14)",
      border: "1px solid rgba(245,158,11,0.26)",
      color: "#92400e",
    };
  }

  return {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(148,163,184,0.26)",
    color: "var(--text-muted)",
  };
}

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
  const [sidebarStatus, setSidebarStatus] = useState<SidebarStatus>({
    workspaceBadge: "…",
    workspaceTone: "default",
    channelsBadge: "…",
    channelsTone: "default",
  });

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

  useEffect(() => {
    let cancelled = false;

    async function loadSidebarStatus() {
      try {
        const [workspaceRes, linkRes] = await Promise.all([
          apiJson<WorkspaceLimitsResponse>("/workspace/limits", {
            method: "GET",
            timeoutMs: 20000,
            useAuthToken: false,
          }),
          apiJson<LinkStatusResponse>("/link/status", {
            method: "GET",
            timeoutMs: 20000,
            useAuthToken: false,
          }),
        ]);

        if (cancelled) return;

        const workspaceLimits = workspaceRes?.entitlements?.workspace_limits || {};
        const channelLimits = workspaceRes?.entitlements?.channel_limits || {};
        const counts = workspaceRes?.counts || {};

        const maxWorkspaceUsers = safeNumber(workspaceLimits.max_workspace_users, 1);
        const usedWorkspace = safeNumber(counts.owner_included_total, 1);
        const workspaceRemaining =
          maxWorkspaceUsers > 0 ? Math.max(maxWorkspaceUsers - usedWorkspace, 0) : 0;

        const workspaceBadge =
          workspaceRemaining <= 0 ? "Full" : `${workspaceRemaining} left`;
        const workspaceTone: SidebarStatus["workspaceTone"] =
          workspaceRemaining <= 0 ? "warn" : "good";

        const maxTotalChannels = safeNumber(channelLimits.max_total_channels, 0);
        const whatsappLinked = truthyValue(linkRes?.whatsapp?.linked);
        const telegramLinked = truthyValue(linkRes?.telegram?.linked);
        const usedChannels = (whatsappLinked ? 1 : 0) + (telegramLinked ? 1 : 0);
        const channelRemaining =
          maxTotalChannels > 0 ? Math.max(maxTotalChannels - usedChannels, 0) : 0;

        let channelsBadge = "Locked";
        let channelsTone: SidebarStatus["channelsTone"] = "default";

        if (maxTotalChannels <= 0) {
          channelsBadge = "Locked";
          channelsTone = "warn";
        } else if (channelRemaining <= 0) {
          channelsBadge = "Full";
          channelsTone = "warn";
        } else if (usedChannels > 0) {
          channelsBadge = `${channelRemaining} left`;
          channelsTone = "good";
        } else {
          channelsBadge = `${maxTotalChannels} open`;
          channelsTone = "default";
        }

        setSidebarStatus({
          workspaceBadge,
          workspaceTone,
          channelsBadge,
          channelsTone,
        });
      } catch (error) {
        if (cancelled) return;

        const isExpected = isApiError(error);
        setSidebarStatus({
          workspaceBadge: isExpected ? "Check" : "—",
          workspaceTone: "default",
          channelsBadge: isExpected ? "Check" : "—",
          channelsTone: "default",
        });
      }
    }

    void loadSidebarStatus();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

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

  function getBadgeForHref(href: string) {
    if (href === "/workspace") {
      return {
        label: sidebarStatus.workspaceBadge,
        tone: sidebarStatus.workspaceTone,
      };
    }

    if (href === "/channels") {
      return {
        label: sidebarStatus.channelsBadge,
        tone: sidebarStatus.channelsTone,
      };
    }

    return null;
  }

  const footerYear = new Date().getFullYear();
  const mobileSidebarWidth = "min(86vw, 320px)";
  const topbarStyle: React.CSSProperties = {
    ...styles.topbar,
    minHeight: isMobile ? 0 : 76,
    padding: isMobile ? "14px 16px" : "18px 24px",
    alignItems: isMobile ? "stretch" : "center",
  };
  const topbarLeftStyle: React.CSSProperties = {
    ...styles.topbarLeft,
    alignItems: isMobile ? "flex-start" : "center",
    width: isMobile ? "100%" : "auto",
  };
  const topbarRightStyle: React.CSSProperties = {
    ...styles.topbarRight,
    width: isMobile ? "100%" : "auto",
    justifyContent: isMobile ? "flex-start" : "flex-end",
  };
  const contentStyle: React.CSSProperties = {
    ...styles.content,
    padding: isMobile ? 16 : 24,
  };
  const pageFooterStyle: React.CSSProperties = {
    ...styles.pageFooter,
    padding: isMobile ? "18px 16px 16px" : "22px 24px 18px",
  };
  const pageFooterInnerStyle: React.CSSProperties = {
    ...styles.pageFooterInner,
    flexDirection: isMobile ? "column" : "row",
  };
  const pageFooterRightStyle: React.CSSProperties = {
    ...styles.pageFooterRight,
    justifyItems: isMobile ? "start" : "end",
  };
  const pageFooterLinksStyle: React.CSSProperties = {
    ...styles.pageFooterLinks,
    justifyContent: isMobile ? "flex-start" : "flex-end",
  };

  return (
    <div style={styles.root}>
      {isMobile && sidebarOpen ? (
        <div style={styles.mobileOverlay} onClick={closeSidebarOnMobile} />
      ) : null}

      <aside
        style={{
          ...styles.sidebar,
          width: isMobile ? mobileSidebarWidth : sidebarWidth,
          padding: isMobile ? 14 : 18,
          transform: isMobile
            ? sidebarOpen
              ? "translateX(0)"
              : "translateX(-100%)"
            : "none",
          zIndex: isMobile ? 40 : 20,
          boxShadow: isMobile ? "0 18px 50px rgba(0,0,0,0.28)" : "none",
        }}
      >
        <button onClick={toggleSidebar} style={styles.collapseBtn} type="button">
          {isMobile
            ? sidebarOpen
              ? "Close Menu"
              : "Open Menu"
            : sidebarOpen
            ? "Collapse"
            : "Menu"}
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
              alt={`${SITE.companyName} logo`}
              style={styles.logoImage}
            />
          </div>

          {sidebarOpen ? (
            <div style={{ minWidth: 0 }}>
              <div style={styles.brandTitle}>{SITE.name}</div>
              <div style={styles.brandSub}>{SITE.companyName}</div>
              <div style={styles.brandTagline}>{SITE.slogan}</div>
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

                  const badge = getBadgeForHref(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        ...styles.link,
                        ...(active ? styles.linkActive : {}),
                        justifyContent: sidebarOpen ? "space-between" : "center",
                        padding: sidebarOpen ? "13px 16px" : "13px 8px",
                      }}
                      title={item.label}
                    >
                      {sidebarOpen ? (
                        <>
                          <span>{item.label}</span>
                          {badge ? (
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...toneStyle(badge.tone),
                              }}
                            >
                              {badge.label}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        item.label.charAt(0)
                      )}
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
            <div style={styles.footerLine}>{SITE.companyName}</div>
            <div style={styles.footerLine}>{SITE.supportEmail}</div>
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
        <header style={topbarStyle}>
          <div style={topbarLeftStyle}>
            {isMobile ? (
              <button onClick={toggleSidebar} style={styles.mobileMenuBtn} type="button">
                Menu
              </button>
            ) : null}

            <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <div style={{ ...styles.topbarTitle, fontSize: isMobile ? 18 : 22 }}>
                {title || SITE.name}
              </div>
              {subtitle ? (
                <div style={{ ...styles.topbarSubtitle, fontSize: isMobile ? 12 : 13 }}>
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>

          <div style={topbarRightStyle}>
            {rightSlot ? <div style={styles.topbarSlotWrap}>{rightSlot}</div> : null}
            {actions ? <div style={styles.topbarSlotWrap}>{actions}</div> : null}
          </div>
        </header>

        <section style={contentStyle}>{children}</section>

        <footer style={pageFooterStyle}>
          <div style={pageFooterInnerStyle}>
            <div style={styles.pageFooterBrand}>
              <div style={styles.pageFooterTitle}>{SITE.name}</div>
              <div style={styles.pageFooterText}>Operated by {SITE.companyName}.</div>
              <div style={styles.pageFooterText}>General contact: {SITE.supportEmail}</div>
            </div>

            <div style={pageFooterRightStyle}>
              <div style={pageFooterLinksStyle}>
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

              <div style={styles.pageFooterSlogan}>{SITE.slogan}</div>
            </div>
          </div>

          <div style={styles.pageFooterBottom}>
            © {footerYear} {SITE.name} · {SITE.companyName}. All rights reserved.
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
    border: "1px solid var(--accent-border)",
    background: "linear-gradient(180deg, rgba(99,102,241,0.96), rgba(79,70,229,0.92))",
    color: "#ffffff",
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
    border: "1px solid var(--border)",
    background: "var(--surface-soft)",
    color: "var(--text)",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
  };
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "var(--app-bg)",
    color: "var(--text)",
    position: "relative",
    maxWidth: "100%",
    overflowX: "clip",
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
    height: "100dvh",
    borderRight: "1px solid var(--border)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    background: "var(--panel-bg)",
    overflow: "hidden",
    transition: "transform 0.25s ease, width 0.25s ease",
  },

  collapseBtn: {
    width: "100%",
    minHeight: 48,
    borderRadius: 18,
    border: "1px solid var(--border)",
    background: "var(--surface-soft)",
    color: "var(--text)",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
  },

  brand: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    background: "var(--surface-soft)",
    border: "1px solid var(--border)",
  },

  logoWrap: {
    flexShrink: 0,
  },

  logoImage: {
    width: 54,
    height: 54,
    borderRadius: 18,
    objectFit: "cover",
    border: "1px solid rgba(234,179,8,0.32)",
    background: "var(--surface)",
  },

  brandTitle: {
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.15,
    color: "var(--text)",
  },

  brandSub: {
    fontSize: 14,
    marginTop: 4,
    color: "var(--gold)",
    fontWeight: 800,
  },

  brandTagline: {
    fontSize: 12,
    color: "var(--text-muted)",
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
    color: "var(--text-faint)",
    letterSpacing: 0.5,
    paddingLeft: 2,
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  link: {
    minHeight: 48,
    borderRadius: 18,
    textDecoration: "none",
    color: "var(--text-soft)",
    border: "1px solid transparent",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 16,
    fontWeight: 800,
    transition: "all 0.2s ease",
  },

  linkActive: {
    background: "var(--accent-soft)",
    border: "1px solid var(--accent-border)",
    color: "var(--text)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
  },

  statusBadge: {
    minWidth: 58,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.2,
    textAlign: "center",
    flexShrink: 0,
  },

  sidebarFooter: {
    marginTop: "auto",
    padding: 14,
    borderRadius: 18,
    background: "var(--surface-soft)",
    border: "1px solid var(--border)",
    display: "grid",
    gap: 8,
  },

  footerTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "var(--text)",
  },

  footerLine: {
    fontSize: 13,
    color: "var(--text-muted)",
    lineHeight: 1.45,
  },

  footerLinks: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 4,
  },

  footerLink: {
    color: "var(--text)",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 13,
  },

  main: {
    minHeight: "100vh",
    transition: "margin-left 0.25s ease",
    display: "flex",
    flexDirection: "column",
  },

  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    minHeight: 76,
    padding: "18px 24px",
    borderBottom: "1px solid var(--border)",
    background: "transparent",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },

  topbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minWidth: 0,
  },

  mobileMenuBtn: {
    minHeight: 44,
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "var(--surface-soft)",
    color: "var(--text)",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },

  topbarTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: "var(--text)",
    lineHeight: 1.15,
  },

  topbarSubtitle: {
    fontSize: 13,
    color: "var(--text-muted)",
    lineHeight: 1.5,
  },

  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  topbarSlotWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    maxWidth: "100%",
  },

  content: {
    flex: 1,
    padding: 24,
  },

  pageFooter: {
    marginTop: "auto",
    borderTop: "1px solid var(--border)",
    background: "var(--panel-bg)",
    padding: "22px 24px 18px",
  },

  pageFooterInner: {
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    flexWrap: "wrap",
  },

  pageFooterBrand: {
    display: "grid",
    gap: 6,
  },

  pageFooterTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "var(--text)",
  },

  pageFooterText: {
    fontSize: 13,
    color: "var(--text-muted)",
    lineHeight: 1.5,
  },

  pageFooterRight: {
    display: "grid",
    gap: 10,
    justifyItems: "end",
  },

  pageFooterLinks: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  pageFooterLink: {
    color: "var(--text)",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 13,
  },

  pageFooterSlogan: {
    fontSize: 12,
    color: "var(--text-faint)",
    fontWeight: 700,
  },

  pageFooterBottom: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid var(--border)",
    fontSize: 12,
    color: "var(--text-faint)",
    lineHeight: 1.6,
  },
};
