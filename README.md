# wridachic — Next.js 15

Site e-commerce wridachic, refait en **Next.js 15 + React 19 + TypeScript + Supabase SSR**.

## Démarrage local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Copie `.env.example` en `.env.local` et remplis :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=https://wridachic.com
```

## Déploiement Vercel

1. **Push** sur GitHub (le repo existant fonctionne tel quel).
2. Sur [vercel.com](https://vercel.com), importe le repo. Vercel détecte Next.js automatiquement.
3. Dans **Project Settings → Environment Variables**, ajoute les 3 variables ci-dessus.
4. Deploy. Vercel build et déploie automatiquement à chaque push.

### Configuration Supabase (CRITIQUE pour les emails Auth)

Va sur [Supabase Dashboard](https://supabase.com/dashboard/project/guoapqclmskyoubyivuv) → **Authentication → URL Configuration** :

1. **Site URL** : `https://wridachic.com`
2. **Redirect URLs** (ajouter les deux) :
   - `https://wridachic.com/**`
   - `http://localhost:3000/**` (pour les tests en local)

Sans ça → les liens dans les emails (confirmation signup + reset password) pointent toujours vers localhost.

#### Email templates → OTP code (6 chiffres) au lieu d'un lien

Pour que le code à 6 chiffres arrive à l'inscription, va sur **Authentication → Email Templates → Confirm signup** :

Remplace le contenu par :
```
<h2>Confirme ton compte wridachic</h2>
<p>Voici ton code à 6 chiffres :</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">{{ .Token }}</p>
<p>Saisis-le dans le formulaire pour activer ton compte.</p>
```

Si tu veux garder le lien classique aussi, ajoute : `<a href="{{ .ConfirmationURL }}">Confirmer par lien</a>`.

**Note** : sur le tier gratuit Supabase, il y a une limite de **4 emails/heure** avec le mailer par défaut. Pour la prod, configure SMTP custom (Resend, Postmark, SendGrid) dans Authentication → SMTP Settings.

### Domaine personnalisé (Namecheap)

1. Vercel → Project → Settings → Domains → ajoute `wridachic.com` et `www.wridachic.com`.
2. Vercel donne 2 records DNS (A + CNAME).
3. Sur Namecheap → Domain List → Manage → Advanced DNS, ajoute :
   - **A Record** : Host `@` → Value `76.76.21.21` (l'IP Vercel)
   - **CNAME Record** : Host `www` → Value `cname.vercel-dns.com`
4. Attends la propagation (~30 min – 24h).

## Structure

```
src/
├── app/                  Routes Next.js (App Router)
│   ├── layout.tsx        Layout racine (fonts, providers, metadata)
│   ├── page.tsx          / (accueil)
│   ├── shop/             /shop
│   ├── prayer/           /prayer
│   ├── new/              /new
│   ├── about/            /about
│   ├── lookbook/         /lookbook
│   ├── cart/             /cart
│   ├── checkout/         /checkout
│   ├── account/          /account
│   ├── admin/            /admin
│   ├── product/[slug]/   /product/{slug} — SSG depuis Supabase
│   ├── globals.css
│   ├── sitemap.ts        sitemap.xml généré
│   ├── robots.ts         robots.txt généré
│   └── not-found.tsx     404
├── components/
│   ├── layout/           Nav, Footer, Toast
│   ├── ui/               Logo, Icon, PCard, Marquee, Placeholder, etc.
│   ├── pages/            Composants de page (HomePage, ShopPage, etc.)
│   └── dialogs/          AuthDialog
├── lib/
│   ├── supabase/         Client browser + serveur (SSR)
│   ├── data.ts           Produits fallback + catégories
│   ├── i18n.ts           Traductions FR / AR
│   ├── coupon.ts         Helpers coupons
│   ├── products.ts       Fetch produits côté serveur
│   └── types.ts          Types TS
├── store/
│   └── AppContext.tsx    Context global (cart, wishlist, lang, auth)
public/
├── assets/               Images
└── fonts/                Fonts Thmanyah (woff2)
```

## Optimisations performance

- **App Router + RSC** : pages rendues côté serveur, JavaScript minimal envoyé au client
- **ISR** : pages produits + catalogue revalidées toutes les 5 min depuis Supabase
- **`next/image`** : images converties en AVIF/WebP, lazy-loading, srcset responsive
- **`next/font`** : fonts Google bundlées (Fraunces, Space Grotesk, IBM Plex Arabic, JetBrains Mono) — zero layout shift
- **Fonts Thmanyah** : auto-hébergées dans `/public/fonts/`, `Cache-Control immutable` 1 an
- **Routes réelles** (vs hash routing) : meilleur SEO, deep-linking, partage sur réseaux sociaux
- **Bundle React tree-shaké** : plus de UMD CDN
- **`generateStaticParams`** : tous les slugs produits pré-rendus au build
- **JSON-LD** : Organisation (layout) + Product (chaque page produit)

## Migration

Cette V2 garde 100% de compatibilité avec :
- ✅ La même base Supabase (produits, commandes, coupons, wishlists, profiles, newsletter)
- ✅ Les mêmes RPC : `validate_coupon`, `consume_coupon`, `issue_gift_coupon`, `is_admin`
- ✅ La même Edge Function : `send-newsletter`
- ✅ Le même bucket Storage : `product-images`
- ✅ Les mêmes assets et fonts

## Admin (`/admin`)

Toutes les fonctionnalités V1 sont disponibles :
- 📦 **Commandes** — liste, stats par statut, changement de statut, suppression
- 👗 **Produits** — CRUD complet, upload d'images vers Supabase Storage, ordre, visibilité (active/inactive)
- 🎟️ **Coupons** — CRUD, single-use vs réutilisable, expiration, attribution à un compte
- 📧 **Newsletter** — liste des inscrits, copier-tout, envoi groupé via Resend (Edge Function), liens WhatsApp/email individuels
- 👥 **Utilisateurs** — liste lecture seule avec stats (commandes + total dépensé)

## Anciens fichiers

Les fichiers de la V1 (`app.jsx`, `components2.jsx`, `pages2young.jsx`, `data.js`, `index.html`, `bundle.js`, `build.mjs`, `styles2.css`, `START-SERVER.bat`) peuvent être **supprimés** une fois la V2 confirmée en production. Ils ne sont plus utilisés par Next.js.
