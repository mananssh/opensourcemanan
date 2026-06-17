import type { Metadata } from "next";
import { auth, signIn, signOut } from "@/lib/auth";
import { SubmitButton } from "@/components/blog/submit-button";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Owner access for OSM.",
};

export default async function SignInPage() {
  // Degrade gracefully before auth env is configured (e.g. AUTH_SECRET not yet
  // set on the deployment) so this public route never 500s.
  if (!process.env.AUTH_SECRET) {
    return (
      <main className="container-editorial pt-24 sm:pt-32">
        <p className="label-caps text-faint">Access</p>
        <h1 className="mt-5 font-display text-5xl font-light tracking-tight text-ink">
          Not configured yet<span className="text-accent">.</span>
        </h1>
        <p className="mt-10 max-w-md font-body text-lg leading-relaxed text-muted">
          Sign-in isn&rsquo;t set up in this environment. Add the auth
          environment variables (see <code className="font-mono">.env.example</code>)
          to enable it.
        </p>
      </main>
    );
  }

  const session = await auth();
  const user = session?.user;

  return (
    <main className="container-editorial pt-24 sm:pt-32">
      <p className="label-caps text-faint">Access</p>
      <h1 className="mt-5 font-display text-5xl font-light tracking-tight text-ink">
        {user ? "You're in" : "Sign in"}
        <span className="text-accent">.</span>
      </h1>

      {user ? (
        <div className="mt-10 max-w-md">
          <dl className="border-t border-rule">
            <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
              <dt className="label-caps text-faint">Account</dt>
              <dd className="font-body text-ink">{user.email}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
              <dt className="label-caps text-faint">Owner</dt>
              <dd className="font-mono text-sm text-ink">
                {user.isOwner ? "yes" : "no"}
              </dd>
            </div>
          </dl>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <SubmitButton
              className="mt-8 inline-flex items-center rounded-full border border-rule px-5 py-2 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent"
              pendingLabel="Signing out…"
            >
              Sign out
            </SubmitButton>
          </form>
        </div>
      ) : (
        <div className="mt-10 max-w-md">
          <p className="font-body text-lg leading-relaxed text-muted">
            OSM is open to read. Signing in is for the owner — authoring and
            anything behind the wall.
          </p>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/sign-in" });
            }}
          >
            <SubmitButton
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3 font-mono text-sm tracking-wide text-paper transition-opacity hover:opacity-90"
              pendingLabel="Redirecting…"
            >
              <span aria-hidden className="text-accent">
                ◆
              </span>
              Continue with Google
            </SubmitButton>
          </form>
        </div>
      )}
    </main>
  );
}
