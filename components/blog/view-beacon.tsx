"use client";

import { useEffect } from "react";

/** Records a view once per browser session per post (fire-and-forget). */
export function ViewBeacon({ postId }: { postId: string }) {
  useEffect(() => {
    const key = `osm:viewed:${postId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/blog/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ postId }),
      keepalive: true,
    }).catch(() => {});
  }, [postId]);
  return null;
}
