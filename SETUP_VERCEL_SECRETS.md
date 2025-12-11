# Setting Up Vercel Secrets for GitHub Actions

If you want GitHub Actions to automatically deploy to Vercel, you need to configure the following secrets in your GitHub repository.

## Required Secrets

1. **VERCEL_TOKEN** - Your Vercel API token
2. **VERCEL_ORG_ID** - Your Vercel organization ID
3. **VERCEL_PROJECT_ID** - Your Vercel project ID

## Steps to Get These Values

### 1. Get Vercel Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "GitHub Actions Deploy")
4. Set expiration (optional)
5. Copy the token value

### 2. Get Vercel Org ID and Project ID

1. Go to your Vercel project settings
2. Go to the "General" tab
3. You'll see:
   - **Organization ID** (under "General Information")
   - **Project ID** (under "Project Information")

Alternatively, you can get these from the Vercel API or CLI.

## Adding Secrets to GitHub

1. Go to your GitHub repository: https://github.com/DsMeier-DesignAndFilmmaking/spontaneity-engine
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `VERCEL_TOKEN`, Value: [your token]
   - Name: `VERCEL_ORG_ID`, Value: [your org ID]
   - Name: `VERCEL_PROJECT_ID`, Value: [your project ID]

## Optional: Environment Variables for Build

The workflow also supports these optional secrets for build-time environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BASE_URL`

Note: These are optional because the build will succeed without them (they're validated at runtime).

## Alternative: Manual Deployment

If you don't want to set up GitHub Actions deployment, you can:
1. Connect your repository directly in Vercel dashboard
2. Vercel will automatically deploy on push to main
3. Configure environment variables in Vercel dashboard

This is often easier and doesn't require GitHub Actions secrets.
