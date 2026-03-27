"use client";

import { useEffect } from "react";
import { bootstrapGuestEntry } from "@/lib/entry-bootstrap";

export default function EntryBootstrapProvider() {
  useEffect(() => {
    bootstrapGuestEntry().catch(() => {
      // silent on purpose; bootstrap should never block page rendering
    });
  }, []);

  return null;
}