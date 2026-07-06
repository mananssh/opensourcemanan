---
type: refactor
summary: Dedupe admin form boilerplate and decouple the shared form-state type
---

The delete-confirmation form and a `dateVal` date formatter were copy-pasted
across all four portfolio admin forms; both now live once in
`components/portfolio/admin/fields.tsx` as `DeleteButton` and `dateVal`.
`AdminForm`'s shared `{error}` state type also imported from the blog
vertical's action module even though the portfolio vertical defined an
identical type of its own — both now source it from a new
`components/admin/form-state.ts`, so the shared form shell isn't coupled to
any one vertical.
