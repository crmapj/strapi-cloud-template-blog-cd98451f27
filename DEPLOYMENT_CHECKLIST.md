# Strapi Cloud Deployment Checklist

## ✅ Pre-Deployment Verification

### 1) Content types are minimal (Post + Author)
```
ls -la src/api/
# Expect only:
# - author/
# - post/
# (no category/global/about/article)
```

### 2) Post schema is correct
```
cat src/api/post/content-types/post/schema.json | grep '"singularName": "post"'
cat src/api/post/content-types/post/schema.json | grep '"component": "shared.seo"'
```
Fields should be: title, slug, excerpt, content, coverImage, author, seo, draft/publish enabled.

### 3) Author schema only references posts
```
cat src/api/author/content-types/author/schema.json | grep "api::post.post"
```

### 4) Seed/bootstrap only use posts + authors
```
grep "post" scripts/seed.js src/bootstrap.js | head
! grep "category" scripts/seed.js src/bootstrap.js
! grep "global" scripts/seed.js src/bootstrap.js
```

### 5) Data file is lean
```
grep '"posts"' data/data.json
! grep '"categories"' data/data.json
! grep '"blocks"' data/data.json
```

### 6) SEO plugin enabled
```
cat config/plugins.js | grep seo
```
- Component files exist: `src/components/shared/seo.json`, `src/components/shared/meta-social.json`.

## 🚀 Deployment Steps

### Step 1: Clean generated artifacts (if any)
```
rm -rf types/generated/
```

### Step 2: Commit changes
```
git add .
git commit -m "Simplify blog model and add SEO"
git push origin main
```

### Step 3: Deploy to Strapi Cloud
1. Login to https://cloud.strapi.io
2. Connect/select the project repository
3. Strapi Cloud installs dependencies (includes `@strapi/plugin-seo`), builds admin, starts server

### Step 4: Configure API Permissions
In Strapi admin:
- Settings → Users & Permissions → Roles → Public
- Enable `find` + `findOne` for **Post** and **Author**
- Save

### Step 5: Create API Token
- Settings → API Tokens → “RoamLife Frontend”
- Type: Read-only, Duration: Unlimited
- Add to Next.js `.env.local`: `STRAPI_API_TOKEN`

### Step 6: Seed sample data (optional)
```
npm run seed:example
```
Creates authors, posts, uploads covers/avatars, sets `publishedAt`, applies public perms.

### Step 7: Test API
```
STRAPI_URL="https://<your-project>.strapiapp.com"
curl "$STRAPI_URL/api/posts"
```
Should return posts with `seo` object when populated.

### Step 8: Frontend alignment
- Ensure Next.js env vars: `STRAPI_API_URL`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_APP_URL`
- Next.js sitemap/robots handled via `app/sitemap.ts` and `app/robots.txt/route.ts`

## 🔍 Troubleshooting
- **Missing SEO fields**: confirm `@strapi/plugin-seo` installed and `seo` attribute present on Post.
- **Old content types visible**: delete any stray directories under `src/api/` (category/global/about/article) and redeploy.
- **Permissions**: 403 from `/api/posts` → re-check Public role (post/author find, findOne).
- **Images missing**: verify files exist under `data/uploads` or re-upload via admin.

## 📝 Content Type Summary
| Content Type | Endpoint | Notes |
|--------------|----------|-------|
| Post | `/api/posts` | title, slug, excerpt, content, coverImage, author, seo |
| Author | `/api/authors` | name, email, avatar |

**Last Updated:** 2025-12-07  
**Strapi Version:** 5.28.x  
**Content Types:** Post / Author only
