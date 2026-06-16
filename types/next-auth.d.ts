import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** True when the signed-in account is in OWNER_EMAILS. */
      isOwner?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isOwner?: boolean;
  }
}
