# Dorvell Ferguson Portfolio

Next.js portfolio for Dorvell Ferguson Jr., built around photography, modeling, runway, music, athletics, and social-first motion work.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Deploy

This is a standard Next.js app. Import `kferacho3/dorvell-ferguson` into Vercel or another Next-capable host and use:

- Install command: `npm install`
- Build command: `npm run build`
- Output: Next.js default

## Content And Assets

The deployable portfolio uses optimized images from `public/dorvell/optimized` plus blur metadata from `public/dorvell/blur`.

Raw downloaded originals live in `public/dorvell/originals` locally and are intentionally ignored by git because they are large processing inputs. Regenerate content with:

```bash
npm run build:content
```

The homepage includes a TikTok creator embed for `https://www.tiktok.com/@2kferg` in `SocialMotionSpotlight`.
