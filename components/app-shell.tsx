"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { apiJson, isApiError } from "@/lib/api";
import { SITE } from "@/lib/site";

type WorkspaceLimitsResponse = {
  ok?: boolean;
  counts?: { active_members_only?: number; owner_included_total?: number };
  entitlements?: {
    ok?: boolean;
    plan?: { name?: string; code?: string; plan_family?: string };
    plan_code?: string | null;
    plan_family?: string | null;
    workspace_limits?: { max_workspace_users?: number; max_linked_web_accounts?: number };
    channel_limits?: { max_total_channels?: number; max_whatsapp_channels?: number; max_telegram_channels?: number };
  };
};

type ChannelActivationResponse = {
  ok?: boolean;
  active_count?: number;
  connected_count?: number;
  max_active_channels?: number;
  selection_required?: boolean;
};

type SidebarStatus = {
  workspaceBadge: string;
  workspaceTone: "default" | "good" | "warn";
  channelsBadge: string;
  channelsTone: "default" | "good" | "warn";
};

const PUBLIC_SHELL_PATHS = new Set(["/about","/contact","/data-deletion","/faq","/privacy","/refund","/review","/safety","/sources","/startup-readiness","/support","/terms"]);
const navSections = [
  { title: "WORKSPACE", items: [
    { href: "/dashboard", label: "Dashboard" }, { href: "/ask", label: "Ask" }, { href: "/quiz", label: "Quiz" },
    { href: "/calculator", label: "Calculator" }, { href: "/file", label: "File Taxes" }, { href: "/deadlines", label: "Deadlines" },
    { href: "/channels", label: "Channels" }, { href: "/workspace", label: "Workspace" }, { href: "/history", label: "History" },
    { href: "/referrals", label: "Referrals" }, { href: "/help", label: "Help Center" },
  ]},
  { title: "ACCOUNT", items: [{ href: "/settings", label: "Settings" }, { href: "/profile", label: "Profile" }] },
  { title: "BILLING", items: [{ href: "/plans", label: "Plans" }, { href: "/billing", label: "Billing" }, { href: "/credits", label: "Credits" }] },
  { title: "SUPPORT & LEGAL", items: [{ href: "/support", label: "Support" }, { href: "/contact", label: "Contact" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }, { href: "/refund", label: "Refund" }, { href: "/data-deletion", label: "Data Deletion" }] },
];

function isPublicShellPath(pathname: string | null) { return !!pathname && (PUBLIC_SHELL_PATHS.has(pathname) || pathname.startsWith("/review/")); }
function safeNumber(value: unknown, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function toneStyle(tone: "default" | "good" | "warn"): React.CSSProperties {
  if (tone === "good") return { background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.24)", color:"#065f46" };
  if (tone === "warn") return { background:"rgba(245,158,11,0.14)", border:"1px solid rgba(245,158,11,0.26)", color:"#92400e" };
  return { background:"rgba(255,255,255,0.72)", border:"1px solid rgba(148,163,184,0.26)", color:"var(--text-muted)" };
}

export default function AppShell({ title, subtitle, rightSlot, actions, children }: { title?: string; subtitle?: string; rightSlot?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname(); const isPublicShell = isPublicShellPath(pathname);
  const [isMobile,setIsMobile]=useState(false); const [sidebarOpen,setSidebarOpen]=useState(true); const [userCollapsedDesktop,setUserCollapsedDesktop]=useState(false);
  const [sidebarStatus,setSidebarStatus]=useState<SidebarStatus>({workspaceBadge:"...",workspaceTone:"default",channelsBadge:"...",channelsTone:"default"});

  useEffect(()=>{ const sync=()=>{const mobile=window.innerWidth<980;setIsMobile(mobile);if(isPublicShell){setSidebarOpen(false);return;}setSidebarOpen(mobile?false:!userCollapsedDesktop);};sync();window.addEventListener("resize",sync);return()=>window.removeEventListener("resize",sync);},[isPublicShell,userCollapsedDesktop]);
  useEffect(()=>{if(!isPublicShell&&isMobile)setSidebarOpen(false);},[pathname,isMobile,isPublicShell]);
  useEffect(()=>{
    if(isPublicShell){setSidebarStatus({workspaceBadge:"...",workspaceTone:"default",channelsBadge:"...",channelsTone:"default"});return;}
    let cancelled=false;
    async function load(){try{
      const [workspaceRes,activationRes]=await Promise.all([
        apiJson<WorkspaceLimitsResponse>("/workspace/limits",{method:"GET",timeoutMs:20000,useAuthToken:false}),
        apiJson<ChannelActivationResponse>("/channels/activation",{method:"GET",timeoutMs:20000,useAuthToken:false}),
      ]);
      if(cancelled)return;
      const workspaceLimits=workspaceRes?.entitlements?.workspace_limits||{}; const counts=workspaceRes?.counts||{};
      const maxWorkspaceUsers=safeNumber(workspaceLimits.max_workspace_users,1); const usedWorkspace=safeNumber(counts.owner_included_total,1);
      const workspaceRemaining=maxWorkspaceUsers>0?Math.max(maxWorkspaceUsers-usedWorkspace,0):0;
      const workspaceBadge=workspaceRemaining<=0?"Full":`${workspaceRemaining} left`; const workspaceTone=workspaceRemaining<=0?"warn":"good" as const;
      const maxActive=safeNumber(activationRes?.max_active_channels,0); const active=safeNumber(activationRes?.active_count,0); const selection=Boolean(activationRes?.selection_required);
      let channelsBadge="Locked"; let channelsTone:SidebarStatus["channelsTone"]="warn";
      if(selection){channelsBadge="Choose";channelsTone="warn";} else if(maxActive>0){channelsBadge=`${active}/${maxActive} active`;channelsTone=active>0?"good":"default";}
      setSidebarStatus({workspaceBadge,workspaceTone,channelsBadge,channelsTone});
    }catch(error){if(cancelled)return;const expected=isApiError(error);setSidebarStatus({workspaceBadge:expected?"Check":"-",workspaceTone:"default",channelsBadge:expected?"Check":"-",channelsTone:"default"});}}
    void load();return()=>{cancelled=true;};
  },[pathname,isPublicShell]);

  const sidebarWidth=useMemo(()=>isPublicShell||isMobile?0:sidebarOpen?320:96,[isPublicShell,isMobile,sidebarOpen]);
  function toggleSidebar(){if(isPublicShell)return;if(isMobile){setSidebarOpen(p=>!p);return;}setUserCollapsedDesktop(p=>!p);setSidebarOpen(p=>!p);}
  function closeSidebarOnMobile(){if(isMobile)setSidebarOpen(false);}
  function badge(href:string){if(href==="/workspace")return{label:sidebarStatus.workspaceBadge,tone:sidebarStatus.workspaceTone};if(href==="/channels")return{label:sidebarStatus.channelsBadge,tone:sidebarStatus.channelsTone};return null;}
  const footerYear=new Date().getFullYear(); const mobileSidebarWidth="min(86vw, 320px)";
  const publicTopbarActions=<div style={styles.publicNav}><Link href="/" style={shellButtonSecondary()}>Home</Link><Link href="/pricing" style={shellButtonSecondary()}>Pricing</Link><Link href="/login" style={shellButtonPrimary()}>Login</Link></div>;
  return <div style={styles.root}>
    {!isPublicShell&&isMobile&&sidebarOpen?<div style={styles.mobileOverlay} onClick={closeSidebarOnMobile}/>:null}
    {!isPublicShell?<aside style={{...styles.sidebar,width:isMobile?mobileSidebarWidth:sidebarWidth,padding:isMobile?14:18,transform:isMobile?(sidebarOpen?"translateX(0)":"translateX(-100%)"):"none",zIndex:isMobile?40:20,boxShadow:isMobile?"0 18px 50px rgba(0,0,0,0.28)":"none"}}>
      <button onClick={toggleSidebar} style={styles.collapseBtn} type="button">{isMobile?(sidebarOpen?"Close Menu":"Open Menu"):(sidebarOpen?"Collapse":"Menu")}</button>
      <div style={{...styles.brand,justifyContent:sidebarOpen?"flex-start":"center"}}><div style={styles.logoWrap}><img src="/bms-logo.jpg" alt={`${SITE.companyName} logo`} style={styles.logoImage}/></div>{sidebarOpen?<div style={{minWidth:0}}><div style={styles.brandTitle}>{SITE.name}</div><div style={styles.brandSub}>{SITE.companyName}</div><div style={styles.brandTagline}>{SITE.slogan}</div></div>:null}</div>
      <div style={styles.navScroll}>{navSections.map(section=><div key={section.title} style={styles.sectionBlock}>{sidebarOpen?<div style={styles.sectionTitle}>{section.title}</div>:null}<nav style={styles.nav}>{section.items.map(item=>{const active=pathname===item.href||(item.href!=="/"&&pathname?.startsWith(item.href+"/"));const b=badge(item.href);return <Link key={item.href} href={item.href} style={{...styles.link,...(active?styles.linkActive:{}),justifyContent:sidebarOpen?"space-between":"center",padding:sidebarOpen?"13px 16px":"13px 8px"}} title={item.label}>{sidebarOpen?<><span>{item.label}</span>{b?<span style={{...styles.statusBadge,...toneStyle(b.tone)}}>{b.label}</span>:null}</>:<span>{item.label.slice(0,1)}</span>}</Link>;})}</nav></div>)}</div>
      {sidebarOpen?<div style={styles.companyCard}><div style={styles.companyTitle}>Company Contact</div><div style={styles.companyText}>{SITE.companyName}</div><div style={styles.companyText}>{SITE.supportEmail}</div><div style={styles.companyLinks}><Link href="/contact">Contact</Link><Link href="/support">Support</Link><Link href="/privacy">Privacy</Link></div></div>:null}
    </aside>:null}
    <div style={{...styles.main,marginLeft:isPublicShell||isMobile?0:sidebarWidth}}>
      <header style={{...styles.topbar,minHeight:isMobile?0:76,padding:isMobile?"14px 16px":"18px 24px",alignItems:isMobile?"stretch":"center"}}><div style={{...styles.topbarLeft,alignItems:isMobile?"flex-start":"center",width:isMobile?"100%":"auto"}}>{!isPublicShell&&isMobile?<button onClick={toggleSidebar} style={styles.mobileMenuBtn}>Menu</button>:null}<div>{title?<h1 style={styles.title}>{title}</h1>:null}{subtitle?<div style={styles.subtitle}>{subtitle}</div>:null}</div></div><div style={{...styles.topbarRight,width:isMobile?"100%":"auto",justifyContent:isMobile?"flex-start":"flex-end"}}>{isPublicShell?publicTopbarActions:actions||rightSlot}</div></header>
      <main style={{...styles.content,padding:isMobile?16:24}}>{children}</main>
      <footer style={{...styles.pageFooter,padding:isMobile?"18px 16px 16px":"22px 24px 18px"}}><div style={{...styles.pageFooterInner,flexDirection:isMobile?"column":"row"}}><div><strong>{SITE.companyName}</strong><div>{SITE.slogan}</div><div>© {footerYear} {SITE.companyName}</div></div><div style={{...styles.pageFooterRight,justifyItems:isMobile?"start":"end"}}><div>{SITE.supportEmail}</div><div style={{...styles.pageFooterLinks,justifyContent:isMobile?"flex-start":"flex-end"}}><Link href="/contact">Contact</Link><Link href="/support">Support</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div></div></footer>
    </div>
  </div>;
}

export function shellButtonPrimary():React.CSSProperties{return{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"10px 16px",borderRadius:12,border:"1px solid transparent",background:"var(--primary, #4f46e5)",color:"white",fontWeight:800,textDecoration:"none",cursor:"pointer"};}
export function shellButtonSecondary():React.CSSProperties{return{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"10px 16px",borderRadius:12,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",fontWeight:800,textDecoration:"none",cursor:"pointer"};}
const styles:Record<string,React.CSSProperties>={root:{minHeight:"100vh",background:"var(--bg)",color:"var(--text)"},sidebar:{position:"fixed",inset:"0 auto 0 0",background:"#0f172a",color:"white",overflow:"hidden",transition:"width .2s ease, transform .2s ease",display:"flex",flexDirection:"column",gap:14},collapseBtn:{padding:"12px",borderRadius:14,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.04)",color:"white",fontWeight:800,cursor:"pointer"},brand:{display:"flex",gap:12,alignItems:"center",padding:"14px",border:"1px solid rgba(255,255,255,.1)",borderRadius:18},logoWrap:{width:52,height:52,borderRadius:14,overflow:"hidden",flex:"0 0 auto"},logoImage:{width:"100%",height:"100%",objectFit:"cover"},brandTitle:{fontWeight:900,fontSize:17},brandSub:{fontWeight:800,color:"#facc15",fontSize:13,marginTop:3},brandTagline:{fontSize:12,color:"#cbd5e1",marginTop:5,lineHeight:1.4},navScroll:{overflowY:"auto",display:"grid",gap:18,padding:"4px 0",flex:1},sectionBlock:{display:"grid",gap:8},sectionTitle:{fontSize:11,fontWeight:900,color:"#94a3b8",letterSpacing:.8},nav:{display:"grid",gap:6},link:{display:"flex",alignItems:"center",gap:8,borderRadius:14,color:"#e2e8f0",fontWeight:800,textDecoration:"none",minHeight:44},linkActive:{background:"rgba(99,102,241,.22)",color:"white",border:"1px solid rgba(129,140,248,.35)"},statusBadge:{fontSize:11,fontWeight:900,padding:"4px 8px",borderRadius:999,whiteSpace:"nowrap"},companyCard:{border:"1px solid rgba(255,255,255,.1)",borderRadius:18,padding:14,display:"grid",gap:8},companyTitle:{fontWeight:900},companyText:{fontSize:12,color:"#cbd5e1",overflowWrap:"anywhere"},companyLinks:{display:"flex",gap:10,flexWrap:"wrap",fontSize:12,fontWeight:800},main:{minHeight:"100vh",transition:"margin-left .2s ease",display:"flex",flexDirection:"column"},topbar:{display:"flex",justifyContent:"space-between",gap:16,borderBottom:"1px solid var(--border)",background:"var(--surface)",flexWrap:"wrap"},topbarLeft:{display:"flex",gap:12},topbarRight:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"},mobileMenuBtn:{padding:"9px 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--surface)",fontWeight:800},title:{margin:0,fontSize:22},subtitle:{marginTop:4,color:"var(--text-muted)",fontSize:13},content:{width:"100%",maxWidth:1500,margin:"0 auto",flex:1},mobileOverlay:{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",zIndex:35},publicNav:{display:"flex",gap:8,flexWrap:"wrap"},pageFooter:{borderTop:"1px solid var(--border)",background:"var(--surface)"},pageFooterInner:{maxWidth:1500,margin:"0 auto",display:"flex",justifyContent:"space-between",gap:16,color:"var(--text-muted)",fontSize:12,lineHeight:1.7},pageFooterRight:{display:"grid",gap:4},pageFooterLinks:{display:"flex",gap:10,flexWrap:"wrap"}};