---
type: fix
summary: interpret the blog editor's publish date in IST, not the server's UTC
---

The editor's "Publish date" is a timezone-naive `<input type="datetime-local">`.
Both the save path (`new Date(input)`) and the display path (`getHours()` etc.)
read that wall-clock string in the *runtime's* zone — UTC on Vercel — so a time
the author picked was silently shifted by the UTC offset, publishing posts 5.5h
later than intended (and hiding them as "scheduled" until then).

Anchor the wall clock to IST (Asia/Kolkata, a fixed UTC+5:30, no DST) via a new
`lib/blog/schedule.ts` (`istInputToDate` / `dateToIstInput`), used by both
`savePost` and the post form. The label now reads "Publish date · IST" so the
zone is explicit. A picked time now means exactly what it says regardless of
where the code runs.
