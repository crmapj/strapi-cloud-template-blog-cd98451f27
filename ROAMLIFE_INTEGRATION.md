# RoamLife Strapi CMS - Minimal Blog

This Strapi instance powers the RoamLife blog at `/blog` on the Next.js frontend. The CMS is intentionally minimal: **Posts + Authors + SEO**, nothing else.

## Content Type Configuration

### Post (collection type)
- `title` (string, required)
- `slug` (uid, from title)
- `excerpt` (text, max 280 chars)
- `content` (richtext, required)
- `coverImage` (single media)
- `author` (relation -> Author)
- `seo` (component `shared.seo` with metaTitle, metaDescription, metaImage, canonicalURL, metaSocial)
- `draftAndPublish`: enabled

### Author (collection type)
- `name` (string)
- `email` (string, optional)
- `avatar` (single media)
- `posts` (oneToMany inverse from Post)

### SEO Component
- `metaTitle` (string, optional)
- `metaDescription` (text, optional)
- `metaImage` (single media)
- `canonicalURL` (string)
- `metaSocial` (repeatable component `shared.meta-social` with socialNetwork/title/description/image)

> Removed types: Category, Global, About, Article, blocks. Keep the CMS lean.

## Environment Setup

Create a `.env` in the Strapi root:
```
# Server
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys-here

# Database (Strapi Cloud handles this)
DATABASE_CLIENT=postgres
DATABASE_URL=provided-by-strapi-cloud

# Admin
ADMIN_JWT_SECRET=your-admin-jwt-secret
API_TOKEN_SALT=your-api-token-salt
JWT_SECRET=your-jwt-secret

# Transfer
TRANSFER_TOKEN_SALT=your-transfer-token-salt
```

Frontend `.env.local` (Next.js):
```
STRAPI_API_URL=https://your-instance.strapiapp.com
STRAPI_API_TOKEN=your-generated-token
NEXT_PUBLIC_APP_URL=https://roamlife.ai
```

## Strapi Cloud Deployment
1. Commit and push changes.
2. Deploy via Strapi Cloud (connect repo). Strapi will install deps, build admin, start server.
3. Configure API permissions: Settings → Users & Permissions → Roles → Public → enable `find` + `findOne` for **post** and **author**.
4. Create API token: Settings → API Tokens → “RoamLife Frontend” (read-only, unlimited) → add to Next.js env.

## Seeding Data
- Seed script: `npm run seed:example`
- Data source: `data/data.json` (authors + posts + optional seo).
- What it does: uploads avatars/covers, creates authors, creates posts with `publishedAt` set, and applies public permissions for post/author.

## API Shape (Strapi v5 flattened)
Example `POST /api/posts` response (simplified):
```json
{
  "data": [
    {
      "id": 1,
      "title": "The internet's own boy",
      "slug": "the-internet-s-own-boy",
      "excerpt": "Field notes...",
      "content": "<p>...</p>",
      "publishedAt": "2025-12-07T10:00:00.000Z",
      "coverImage": {
        "url": "/uploads/the-internet-s-own-boy.jpg",
        "alternativeText": null,
        "width": 1200,
        "height": 630
      },
      "author": {
        "name": "David Doe",
        "email": "daviddoe@strapi.io",
        "avatar": { "url": "/uploads/daviddoe@strapi.io.jpg" }
      },
      "seo": {
        "metaTitle": "The internet's own boy",
        "metaDescription": "Field notes...",
        "canonicalURL": "https://roamlife.ai/blog/the-internet-s-own-boy",
        "metaImage": {
          "url": "/uploads/the-internet-s-own-boy.jpg",
          "alternativeText": null,
          "width": 1200,
          "height": 630
        },
        "metaSocial": []
      }
    }
  ]
}
```
The Next.js frontend normalizes this to simple `Post`/`Author`/`Seo` objects in `roamlife/lib/strapi.ts`.

## SEO + Sitemap/Robots
- Plugin: `@strapi-community/plugin-seo` (v5-compatible via extension) enabled in `config/plugins.js` with component `shared.seo` attached to Post.
- Frontend uses seo fields for metadata (title/description/OG/Twitter). Fallbacks: seo → excerpt → content.
- Sitemaps/robots served by Next.js metadata routes:
  - `app/sitemap.ts` builds from `getPostSlugs()` + base URLs.
  - `app/robots.txt/route.ts` allows crawl and points to `/sitemap.xml`.

## Maintenance
- Schema edits: update `src/api/post/content-types/post/schema.json` or `src/components/shared/*.json`, then align types in `roamlife/lib/strapi.ts`.
- Generated types: none committed; Strapi regenerates.
- Deployment order: deploy Strapi (new schema) first, then Next.js so SEO/meta fields are available.

## Support
- Strapi Docs: https://docs.strapi.io
- API Token Management: Strapi Admin → Settings → API Tokens
- Frontend Strapi client: `roamlife/lib/strapi.ts`
