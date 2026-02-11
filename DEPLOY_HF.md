# Quick Setup Guide

## 🚀 Auto-Deploy to Hugging Face Space

Your repo is now configured to auto-deploy to HF Spaces!

### Step 1: Add GitHub Secret

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `HF_TOKEN`
4. Value: `<your-hugging-face-token>` (get from https://huggingface.co/settings/tokens)

### Step 2: Create HF Space

1. Visit https://huggingface.co/spaces
2. Click **Create new Space**
3. Name: `SkillBridge`
4. SDK: **Docker**
5. Click **Create Space**

### Step 3: Configure HF Environment

In your Space settings, add these variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from .env.local>
CLERK_SECRET_KEY=<from .env.local>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
MONGODB_URI=<your MongoDB URI>
NEXT_PUBLIC_VAPI_WEB_TOKEN=<from .env.local>
NEXT_PUBLIC_VAPI_WORKFLOW_ID=<from .env.local>
```

### Step 4: Push to GitHub

```bash
git add .
git commit -m "Add HF deployment with auto-sync"
git push origin main
```

✨ **That's it!** Every push to `main` will auto-deploy to HF Space!

### Step 5: Update Clerk

After deployment, add `https://ram22002-SkillBridge.hf.space` to Clerk authorized domains.

---

## 📋 What Was Created

- ✅ `Dockerfile` - Docker configuration
- ✅ `.dockerignore` - Build optimization
- ✅ `.github/workflows/sync-to-hf.yml` - Auto-deploy workflow
- ✅ `next.config.ts` - Standalone output mode
- ✅ `README_HF.md` - HF Space description
