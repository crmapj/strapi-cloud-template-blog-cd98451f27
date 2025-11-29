# RoamLife Strapi CMS - Deployment Guide

This Strapi instance powers the RoamLife blog at `/blog` on the Next.js frontend.

## Content Type Configuration

### Post Content Type

The Post schema has been customized for RoamLife:

**Schema Location:** `src/api/post/content-types/post/schema.json`

**Fields:**
- `title` (string, required)
- `slug` (uid, auto-generated from title)
- `excerpt` (text, max 280 chars) - Brief summary
- `content` (richtext, required) - Full article content
- `coverImage` (single media) - Hero image
- `author` (relation to Author)
- `category` (relation to Category)
- `blocks` (dynamiczone) - Rich content blocks

## Environment Setup

### Required Environment Variables

Create a `.env` file in the Strapi root:

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

### Strapi Cloud Deployment

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Configure Article content type for RoamLife"
   git push origin main
   ```

2. **Deploy to Strapi Cloud:**
   - Log in to [cloud.strapi.io](https://cloud.strapi.io)
   - Connect your Git repository
   - Strapi Cloud will automatically:
     - Set up PostgreSQL database
     - Generate environment variables
     - Deploy your instance

3. **Configure API Permissions:**
   - In Strapi admin, go to Settings → Users & Permissions → Roles → Public
   - Enable these permissions for Post:
     - `find` (list posts)
     - `findOne` (get single post)
   - Save

4. **Create API Token:**
   - Go to Settings → API Tokens
   - Click "Create new API Token"
   - Name: "RoamLife Frontend"
   - Token type: Read-only
   - Token duration: Unlimited
   - Copy the generated token

5. **Configure Frontend:**
   - Add token to Next.js `.env`:
     ```
     STRAPI_API_URL=https://your-instance.strapiapp.com
     STRAPI_API_TOKEN=your-generated-token
     ```

## Seeding Data

### Initial Setup

To populate with sample blog posts:

```bash
npm run strapi import -- -f data/data.json
```

Or use the seed script:

```bash
node scripts/seed.js
```

This will create:
- 5 sample posts with content and images
- 2 authors (David Doe, Sarah Baker)
- 5 categories (news, tech, food, nature, story)

### Adding Content

1. Log in to Strapi admin panel
2. Navigate to Content Manager → Posts
3. Create new post:
   - Title: Auto-generates slug
   - Excerpt: 1-2 sentence summary
   - Content: Main post body (supports markdown/HTML)
   - Cover Image: Upload hero image
   - Select Author and Category
   - Click "Publish"

## API Structure

### Response Format

Posts are returned in Strapi's standard format:

```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "title": "Post Title",
        "slug": "post-title",
        "excerpt": "Short summary",
        "content": "<p>Rich HTML content</p>",
        "publishedAt": "2025-11-29T10:00:00.000Z",
        "coverImage": {
          "data": {
            "id": 1,
            "attributes": {
              "url": "/uploads/image.jpg",
              "alternativeText": "Image description",
              "width": 1200,
              "height": 630
            }
          }
        },
        "author": {
          "data": {
            "id": 1,
            "attributes": {
              "name": "Author Name",
              "title": "Role",
              "avatar": { ... }
            }
          }
        }
      }
    }
  ]
}
```

The Next.js frontend normalizes this to a simpler structure.

## Content Guidelines for RoamLife

### Writing Style
- Keep excerpts under 160 characters for optimal display
- Use markdown for content formatting
- Include a compelling cover image (recommended 1200x630px)
- Tag articles with relevant categories

### SEO Best Practices
- Descriptive titles (50-60 chars)
- Meaningful slugs (auto-generated but editable)
- Excerpt should entice readers
- Use alt text for images

## Maintenance

### Updating Content Types

If you modify the Post schema:

1. Update `src/api/post/content-types/post/schema.json`
2. Update frontend TypeScript types in `lib/strapi.ts`
3. Test locally before deploying
4. Deploy Strapi first, then frontend

### Database Backups

Strapi Cloud handles automatic backups. For manual backups:

```bash
npm run strapi export -- --file backup.tar.gz
```

## Support

- Strapi Docs: https://docs.strapi.io
- RoamLife Frontend: `../roamlife/backend-cms/readme.md`
- API Token Management: Strapi Admin → Settings → API Tokens

