# Athlete Dashboard - Deployment Guide

This guide provides instructions for deploying the Athlete Dashboard application to Vercel.

## Prerequisites

Before deploying, ensure you have:

1. A [Vercel](https://vercel.com) account
2. A [Supabase](https://supabase.com) project set up with the database schema implemented
3. An [OpenAI API](https://openai.com/api/) key for the AI Coach functionality

## Environment Variables

You'll need to configure the following environment variables in your Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## Deployment Steps

1. **Install Vercel CLI** (optional for command line deployment)
   ```
   npm install -g vercel
   ```

2. **Login to Vercel** (if using CLI)
   ```
   vercel login
   ```

3. **Deploy from the Dashboard UI**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository or upload your project files
   - Configure the project settings:
     - Framework Preset: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next`
     - Install Command: `npm install`
   - Add the environment variables listed above
   - Click "Deploy"

4. **Deploy from CLI** (alternative method)
   ```
   cd athlete-dashboard
   vercel
   ```

5. **Configure Domain** (optional)
   - In the Vercel dashboard, go to your project settings
   - Under "Domains", add your custom domain if you have one

## Post-Deployment Verification

After deployment, verify that:

1. The application loads correctly
2. User authentication works
3. FIT file uploads are processed correctly
4. Training metrics are calculated and displayed
5. The AI Coach provides appropriate recommendations

## Troubleshooting

If you encounter issues:

1. Check the Vercel deployment logs
2. Verify environment variables are correctly set
3. Ensure Supabase permissions and RLS policies are properly configured
4. Check browser console for client-side errors

## Continuous Deployment

Vercel automatically sets up continuous deployment from your connected Git repository. Any push to the main branch will trigger a new deployment.

For production deployments, consider:
- Setting up preview deployments for pull requests
- Configuring environment variables for different deployment environments (development, staging, production)
- Setting up monitoring and alerts
