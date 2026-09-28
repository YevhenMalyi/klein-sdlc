# Data loading and rendering

This app is server-rendered and hydrated on the client.

## Rules

1. **Independent fetches in a loader run in one `Promise.all`.** A loader that awaits one
   call and then awaits another that does not consume the first's result is a waterfall.
2. **No wall-clock reads in a render body.** `new Date()`, `Date.now()` and locale
   formatting of either produce different text on the server and the client, and a text
   mismatch during hydration discards the server markup. Resolve the instant in the loader.
3. **A list filter's predicate must be able to be false.** A predicate that is true for
   every value the field can hold, by the field's own schema, is a no-op and the comment
   above it is a lie.

## Review checklist

- Two or more `await`s in a loader where the later does not consume the earlier's result.
- `new Date(` or `Date.now(` in a `.tsx` file that is not a loader.
- A `.filter(` whose comparison the field's declared range makes always true or always false.
