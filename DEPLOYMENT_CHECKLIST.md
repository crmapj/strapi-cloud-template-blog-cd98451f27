# Strapi Cloud Deployment Checklist

## ✅ Pre-Deployment Verification

Run these checks before deploying to Strapi Cloud:

### 1. Verify Content Type Structure

```bash
# Check that only 'post' content type exists (NO 'article')
ls -la src/api/

# Expected output should include:
# - about/
# - author/
# - category/
# - global/
# - post/      ← CORRECT
```

**❌ If you see `article/` directory, DELETE IT:**
```bash
rm -rf src/api/article
```

### 2. Verify Schema Files

```bash
# Check post schema exists
cat src/api/post/content-types/post/schema.json | grep '"singularName": "post"'

# Check author schema references posts (not articles)
cat src/api/author/content-types/author/schema.json | grep "api::post.post"

# Check category schema references posts (not articles)
cat src/api/category/content-types/category/schema.json | grep "api::post.post"
```

### 3. Verify Bootstrap/Seed Files

```bash
# Check bootstrap uses 'posts' (not 'articles')
grep "importPosts" src/bootstrap.js
grep "api::post" src/bootstrap.js

# Check seed script uses 'posts'
grep "importPosts" scripts/seed.js
```

### 4. Verify Data File

```bash
# Check data.json uses 'posts' key
grep '"posts":' data/data.json
```

### 5. Check for Any Article References

```bash
# This should return NO results
grep -r "api::article" src/

# This should return NO results  
grep -r "inversedBy.*articles" src/

# This SHOULD have results (correct references)
grep -r "api::post" src/
grep -r "inversedBy.*posts" src/
```

## 🚀 Deployment Steps

### Step 1: Clean Generated Files

Remove auto-generated type files (they'll be regenerated):

```bash
rm -rf types/generated/
```

### Step 2: Commit Changes

```bash
git add .
git commit -m "Configure post content type for RoamLife blog"
git push origin main
```

### Step 3: Deploy to Strapi Cloud

1. Log in to [cloud.strapi.io](https://cloud.strapi.io)
2. Create new project or select existing
3. Connect your GitHub repository
4. Strapi Cloud will:
   - Detect the Strapi app
   - Install dependencies
   - Build the admin panel
   - Start the server

### Step 4: Configure API Permissions

Once deployed:

1. Access Strapi admin panel
2. Go to **Settings** → **Users & Permissions** → **Roles** → **Public**
3. Enable these permissions for **Post**:
   - ✅ `find` (list all posts)
   - ✅ `findOne` (get single post)
4. Click **Save**

### Step 5: Test API

```bash
# Replace with your Strapi Cloud URL
STRAPI_URL="https://your-project.strapiapp.com"

# Test posts endpoint
curl "$STRAPI_URL/api/posts"

# Should return: {"data":[],"meta":{"pagination":{...}}}
```

### Step 6: Seed Sample Data (Optional)

In Strapi admin:
1. Navigate to **Content Manager** → **Posts**
2. Click **Create new entry**
3. Fill in fields and **Publish**

## 🔍 Troubleshooting

### Error: "inversedBy attribute articles not found"

**Cause:** Old `article` content type still exists

**Fix:**
```bash
# Remove old article directory
rm -rf src/api/article

# Remove generated types
rm -rf types/generated/

# Commit and redeploy
git add .
git commit -m "Remove article content type"
git push
```

### Error: "model not found: api::article.article"

**Cause:** Bootstrap or seed files still reference `article`

**Fix:**
```bash
# Check bootstrap.js
grep -n "article" src/bootstrap.js

# Check seed.js
grep -n "article" scripts/seed.js

# Should only see 'post' references
```

### Deployment Succeeds but Posts Don't Appear

**Cause:** API permissions not configured

**Fix:**
1. Strapi Admin → Settings → Users & Permissions → Roles → Public
2. Enable `find` and `findOne` for **Post**
3. Save

## 📝 Content Type Summary

| Content Type | API Endpoint | Singular | Plural | Database Table |
|--------------|--------------|----------|--------|----------------|
| Post | `/api/posts` | post | posts | posts |
| Author | `/api/authors` | author | authors | authors |
| Category | `/api/categories` | category | categories | categories |
| Global | `/api/globals` | global | globals | globals |
| About | `/api/abouts` | about | abouts | abouts |

## ✨ Expected Results

After successful deployment:

- ✅ Strapi admin accessible
- ✅ Content Manager shows **Posts** (not Articles)
- ✅ API endpoint `/api/posts` returns data
- ✅ No errors in deployment logs
- ✅ Frontend can fetch from `/api/posts`

---

**Last Updated:** 2025-11-29  
**Strapi Version:** 5.x  
**Content Type:** Post (singular) / Posts (plural)

