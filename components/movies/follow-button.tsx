"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { follow, unfollow } from "@/app/movies/actions";

/**
 * Follow/unfollow toggle on a public profile. Optimistic; reconciles with the
 * server result and refreshes so counts update. Hidden for signed-out viewers
 * and on your own profile (the parent decides whether to render it).
 */
export function FollowButton({
  handle,
  initialFollowing,
}: {
  handle: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();
  const [hover, setHover] = useState(false);
  const router = useRouter();

  function toggle() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const res = next ? await follow(handle) : await unfollow(handle);
      if (!res.ok) setFollowing(!next);
      else setFollowing(res.following);
      router.refresh();
    });
  }

  const label = following ? (hover ? "Unfollow" : "Following") : "Follow";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={following}
      className={`inline-flex h-9 items-center px-5 font-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors disabled:opacity-60 ${
        following
          ? "border border-rule text-muted hover:border-accent hover:text-accent"
          : "border border-accent bg-accent text-accent-ink hover:bg-transparent hover:text-accent"
      }`}
    >
      {label}
    </button>
  );
}
