# Cloud Deployment Guide

This guide explains how to deploy the application to a cloud environment with Supabase.

## Prerequisites

- A Supabase cloud account (https://supabase.com)
- A cloud hosting provider (Vercel, Netlify, AWS, etc.)
- Supabase CLI installed (`npm install -g supabase`)

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Create a new project
3. Note your project URL and API keys (found in Project Settings > API)

## Step 2: Update Environment Variables

1. Update `.env.production` with your Supabase cloud credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-app-url.com
```

## Step 3: Push Local Schema to Cloud

1. Update the `scripts/push-to-cloud.js` file with your Supabase project ID and access token
2. Run the script to push your local schema to the cloud:

```
node scripts/push-to-cloud.js
```

## Step 4: Configure Email in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Email Templates
3. Configure your email templates for:
   - Confirmation
   - Invitation
   - Magic Link
   - Reset Password
4. For production, set up a custom SMTP server in Authentication > Settings > SMTP Settings

## Step 5: Deploy Your Application

1. Build your application with production environment:

```
npm run build
```

2. Deploy to your hosting provider:

For Vercel:
```
vercel --prod
```

For Netlify:
```
netlify deploy --prod
```

For AWS Amplify:
```
amplify publish
```

## Step 6: Test Authentication Flow

1. Navigate to your deployed application
2. Test the sign-in flow with both password and magic link options
3. Verify that emails are being sent correctly
4. Test password reset functionality
5. Test role-based access control

## Troubleshooting

### Magic Links Not Working

1. Check Supabase Authentication logs
2. Verify that your SMTP settings are correct
3. Check that the redirect URL in the magic link matches your deployed application URL

### Authentication Errors

1. Check that your environment variables are set correctly
2. Verify that your Supabase project is active
3. Check browser console for errors
4. Check server logs for errors

### Database Migration Issues

1. Check the Supabase migration logs
2. Verify that your schema matches the expected schema
3. Run migrations manually in the Supabase SQL editor if needed
