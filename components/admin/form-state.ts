/** Result of a form action — `{ error }` is surfaced inline via useActionState.
 *  Shared across every vertical's admin actions so AdminForm doesn't couple to
 *  any one vertical's action module. */
export type FormState = { error?: string };
