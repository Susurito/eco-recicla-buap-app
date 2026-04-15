# Google OAuth Setup Guide

## Overview

This guide walks you through setting up Google OAuth for the Eco-Recicla BUAP application.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project selector at the top
3. Click "NEW PROJECT"
4. Enter project name: `Eco-Recicla BUAP`
5. Click "CREATE"
6. Wait for project to be created

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it
4. Click "ENABLE"
5. Wait for it to be enabled

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" button
3. Select "OAuth client ID"
4. If prompted to create a consent screen first:
   - Click "CREATE CONSENT SCREEN"
   - Select "External" user type
   - Fill in the form with:
     - App name: `Eco-Recicla BUAP`
     - User support email: Your email
     - Developer contact: Your email
   - Click "SAVE AND CONTINUE"
   - Skip optional scopes
   - Click "SAVE AND CONTINUE"
   - Click "BACK TO DASHBOARD"

## Step 4: Create OAuth Client ID

1. Go back to "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. Select application type: **"Web application"**
4. Name: `Eco-Recicla Web App`
5. Under "Authorized JavaScript origins", click "ADD URI" and add:
   ```
   http://localhost:3000
   ```
6. Under "Authorized redirect URIs", click "ADD URI" and add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Click "CREATE"
8. Copy the **Client ID** and **Client Secret**

## Step 5: Configure Environment Variables

1. Open `.env.local` in your project root
2. Add your credentials:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```
3. Save the file

## Step 6: Test Google OAuth

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/login

3. Click "Iniciar sesión con Google" button

4. Complete the Google authentication flow

5. You should be redirected to the dashboard

6. A Student profile will be automatically created with your Google account

## For Production

When deploying to production:

1. Go back to Google Cloud Console credentials
2. Add your production domain as an authorized origin:
   ```
   https://yourdomain.com
   ```
3. Add your production callback URI:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```
4. Update `.env.local` (or your production environment variables) with the same credentials

## Troubleshooting

### "redirect_uri_mismatch" Error

This means your redirect URI doesn't match what's configured in Google Cloud.

**Solution:**
1. Check that you added exactly:
   - JS origin: `http://localhost:3000`
   - Redirect URI: `http://localhost:3000/api/auth/callback/google`
2. Verify in your code that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correctly set in `.env.local`

### "Invalid Client" Error

This means your client ID or secret is incorrect.

**Solution:**
1. Copy the credentials again from Google Cloud Console
2. Double-check for extra spaces or typos
3. Make sure you're using the correct values for the Web application type

### Button Not Working

If the Google OAuth button doesn't respond when clicked:

1. Check browser console for errors (F12 > Console tab)
2. Verify that `/api/auth/signin` endpoint is accessible
3. Make sure NextAuth is properly configured in `auth.ts`

## See Also

- [NextAuth.js Google Provider](https://authjs.dev/guides/configuring-github)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - For endpoint documentation
