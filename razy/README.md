This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Backend configuration

The project is configured to use Supabase project `lsecnputuuvfljgqjaur`. Copy `.env.example` to `.env.local` and set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The publishable key is intended for public use and is not a service-role key; protect database data with Supabase Row Level Security policies.

The Supabase client is available from `src/lib/supabase.ts`. Prisma-backed authentication and other existing database routes are not connected by this client yet: add the project's Postgres connection string as `DATABASE_URL` and configure the Prisma schema before relying on database features. Do not put database passwords or service-role keys in client-side variables or commit them.

`ADMIN_EMAIL` identifies the intended admin account for later setup. It does not create an account or grant an admin role. No admin panel is being added as part of this backend setup.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Android debug APK

The Capacitor Android app uses the deployed RAZY website as its WebView origin; it does not use a Next.js static export. The website continues to handle Supabase authentication, admin authorization, uploads, and database operations through the existing secured backend. Do not put backend secrets in the Android app.

The Android project is in `android/`, with app name `RAZY` and application ID `com.razy.app`. To generate or sync it locally, use `npm run android:add` once (only if the `android/` directory does not exist) and `npm run android:sync` thereafter. These scripts invoke the Capacitor CLI through Node directly, which avoids the Android/ARM64 shell-shim permission error from `node_modules/.bin/cap` without changing permissions.

To build a debug APK on GitHub Actions:

1. In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables** and add the repository variable `RAZY_SERVER_URL` with the deployed website's full HTTPS origin, for example `https://your-deployed-domain.example` (no credentials or path required).
2. Push the project to the `main` branch, or open **Actions → Android debug APK → Run workflow**.
3. Open the successful **Android debug APK** workflow run and download the `razy-android-debug-apk` artifact from its Artifacts section. Extract the downloaded ZIP to get `app-debug.apk`.

The artifact is produced only after the Linux workflow successfully syncs the configured URL and builds with Gradle. It is a debug APK, not a Play Store release build.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
