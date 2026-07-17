# Adding a new brand

Brands are static files. To add `acme`:

1. Create `apps/web/public/brands/acme/` with:
   - `brand.json` following the format of `mimarca/brand.json`.
   - `logo.png` (transparent, height ≥ 400 px).
   - `fonts/{regular,bold,medium,light,italic}.ttf`.
2. Add the slug `"acme"` to `apps/web/public/brands/index.json`.
3. Commit + push. Redeploy (or rebuild the static site) to publish it.

The web app picks up the new brand in the dropdown automatically on reload.
