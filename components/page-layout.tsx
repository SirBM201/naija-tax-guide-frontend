"use client";

import React from "react";

function responsiveTrack(min: number) {
  const safeMin = Math.max(160, Math.floor(min));
  return `repeat(auto-fit, minmax(min(100%, ${safeMin}px), 1fr))`;
}

export function SectionStack({
  children,
  gap = 20,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap,
        width: "100%",
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

export function MetricsGrid({
  children,
  min = 220,
  gap = 16,
}: {
  children: React.ReactNode;
  min?: number;
  gap?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: responsiveTrack(min),
        gap,
        width: "100%",
        minWidth: 0,
        alignItems: "start",
      }}
    >
      {children}
    </div>
  );
}

export function CardsGrid({
  children,
  min = 300,
  gap = 20,
}: {
  children: React.ReactNode;
  min?: number;
  gap?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: responsiveTrack(min),
        gap,
        width: "100%",
        minWidth: 0,
        alignItems: "start",
      }}
    >
      {children}
    </div>
  );
}

export function TwoColumnSection({
  children,
  leftRatio = 1,
  rightRatio = 1,
  gap = 20,
  collapseAt = 980,
}: {
  children: React.ReactNode;
  leftRatio?: number;
  rightRatio?: number;
  gap?: number;
  collapseAt?: number;
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const apply = () => {
      setIsCollapsed(window.innerWidth < collapseAt);
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [collapseAt]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isCollapsed
          ? "minmax(0,1fr)"
          : `minmax(0, ${leftRatio}fr) minmax(0, ${rightRatio}fr)`,
        gap: isCollapsed ? Math.min(gap, 16) : gap,
        width: "100%",
        minWidth: 0,
        alignItems: "start",
      }}
    >
      {children}
    </div>
  );
}

export function ResponsiveColumns({
  children,
  min = 320,
  gap = 18,
}: {
  children: React.ReactNode;
  min?: number;
  gap?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: responsiveTrack(min),
        gap,
        width: "100%",
        minWidth: 0,
        alignItems: "start",
      }}
    >
      {children}
    </div>
  );
}
