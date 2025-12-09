# Google Search Console - Quick Checklist

## ✅ Current Status:
- [x] Domain added to Google Search Console
- [x] Sitemap submitted (https://boldandbrew.com/sitemap.xml)

---

## 📋 What to Do Next (Priority Order):

### Priority 1: Verify Everything is Working ⚡
- [ ] Go to Google Search Console
- [ ] Click on your property: **boldandbrew.com**
- [ ] Go to **"Sitemaps"** in left menu
- [ ] Verify sitemap shows:
  - Status: **Success** ✅
  - URLs submitted: Shows a number (like "6 submitted")
  - Last read: Today's date

### Priority 2: Speed Up Indexing 🚀
- [ ] Click **"Inspect URL"** button at the top
- [ ] Enter: `https://boldandbrew.com`
- [ ] Click **"Test live URL"**
- [ ] Click **"Request indexing"** button
- [ ] Wait for confirmation

### Priority 3: Monitor Indexation Status 📊
- [ ] Go to **"Coverage"** in left menu (under "Pages")
- [ ] Check sections:
  - **Valid** - Should increase as pages get indexed
  - **Excluded** - pages you don't want indexed
  - **Error** - Problems to fix

### Priority 4: Check Rich Results 💎
- [ ] Go to **"Enhancements"** in left menu
- [ ] Check if you see:
  - **Rich results** (your product/organization schemas)
  - **Products** (coffee products with prices/ratings)
- [ ] If none showing, verify JSON-LD in source code

### Priority 5: Monitor Performance 📈
- [ ] Go to **"Performance"** tab
- [ ] Watch for:
  - Impressions (increases over days)
  - Clicks (more = better)
  - Average position (lower = better ranking)

---

## 🔍 Links You'll Need:

1. **Google Search Console:**
   - https://search.google.com/search-console

2. **Check if site is indexed:**
   - Google search: `site:boldandbrew.com`
   - Should show your pages

3. **Test page speed:**
   - https://pagespeed.web.dev/

4. **Test structured data:**
   - https://schema.org/validator/
   - Copy your homepage HTML and paste to test

5. **Bing Webmaster Tools (optional):**
   - https://www.bing.com/webmaster

---

## ⏰ Expected Timeline:

| Time | Expected Action |
|------|-----------------|
| **Today** | Submit sitemap & request indexing |
| **1-3 days** | Google crawls your site |
| **3-7 days** | Pages appear in search results |
| **2 weeks** | Keywords start ranking |
| **1 month** | Organic traffic increases |

---

## 🎯 Signs of Success:

✅ **Sitemap shows "Success"**
✅ **Pages appear in Coverage → Valid**
✅ **Impressions increase in Performance tab**
✅ **Rich results appear in Enhancements**
✅ **Search results appear for your keywords**

---

## ⚠️ If Something Goes Wrong:

**Problem:** Sitemap shows error
- Solution: Check public/sitemap.xml file is valid

**Problem:** Pages not getting indexed
- Solution: Click "Request indexing" for each page

**Problem:** No rich results showing
- Solution: Verify JSON-LD in index.html is valid

**Problem:** Low page speed score
- Solution: Use PageSpeed Insights for recommendations

---

## 📱 Quick Commands:

### Check if domain is indexed:
```
In Google search bar, type: site:boldandbrew.com
```

### Check sitemap:
```
Direct URL: https://boldandbrew.com/sitemap.xml
Should show XML format
```

### Check robots.txt:
```
Direct URL: https://boldandbrew.com/robots.txt
Should allow crawling
```

---

**Start with Priority 1 → Check Sitemaps section in Google Search Console!** 🚀
