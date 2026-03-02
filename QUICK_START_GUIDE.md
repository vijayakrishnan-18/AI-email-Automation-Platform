# AI Email OS - Quick Start Guide

A comprehensive step-by-step guide to set up and run AI Email OS locally.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone & Install](#clone--install)
3. [Environment Variables Setup](#environment-variables-setup)
   - [Supabase Setup](#1-supabase-setup)
   - [Google Cloud Setup](#2-google-cloud-setup-gmail-api)
   - [OpenAI Setup](#3-openai-setup)
   - [Generate Encryption Key](#4-generate-encryption-key)
4. [Database Setup](#database-setup)
5. [Run the Application](#run-the-application)
6. [First Time Usage](#first-time-usage)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, make sure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** or **pnpm** package manager
- **Git** - [Download here](https://git-scm.com/)
- **A Gmail account** for testing

---

# Install dependencies

npm install

````

---

## Environment Variables Setup

Create a `.env.local` file in the root directory:

```bash
touch .env.local
````

Copy this template and fill in the values following the steps below:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth & Gmail API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback

# Google Pub/Sub (optional - for real-time push notifications)
GOOGLE_PUBSUB_TOPIC=projects/your-project/topics/gmail-notifications
GOOGLE_PUBSUB_SUBSCRIPTION=projects/your-project/subscriptions/gmail-notifications-sub

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Auto-sync interval in minutes (default: 5)
NEXT_PUBLIC_AUTO_SYNC_INTERVAL=5

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your_32_byte_encryption_key
```

---

### 1. Supabase Setup

Supabase provides the database and authentication for AI Email OS.

#### Step 1: Create a Supabase Account & Project

1. Go to **[https://supabase.com](https://supabase.com)**
2. Click **"Start your project"** and sign up
3. Click **"New Project"**
4. Fill in:
   - **Organization**: Select or create one
   - **Project name**: `ai-email-os` (or your preferred name)
   - **Database password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
5. Click **"Create new project"** and wait for setup (~2 minutes)

#### Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** (gear icon) → **API**
2. Copy these values to your `.env.local`:

| Supabase Field                      | Environment Variable            |
| ----------------------------------- | ------------------------------- |
| Project URL                         | `NEXT_PUBLIC_SUPABASE_URL`      |
| `anon` `public` key                 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key (click "Reveal") | `SUPABASE_SERVICE_ROLE_KEY`     |

> ⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` publicly** - it bypasses Row Level Security

#### Step 3: Enable pgvector Extension

1. Go to **Database** → **Extensions**
2. Search for `vector`
3. Enable the **pgvector** extension

**Direct Link**: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/database/extensions`

---

### 2. Google Cloud Setup (Gmail API)

The Gmail API allows AI Email OS to read and send emails.

#### Step 1: Create a Google Cloud Project

1. Go to **[https://console.cloud.google.com](https://console.cloud.google.com)**
2. Sign in with your Google account
3. Click the project dropdown (top-left) → **"New Project"**
4. Enter:
   - **Project name**: `AI Email OS`
   - **Organization**: Leave as default
5. Click **"Create"**
6. Wait for the project to be created, then select it

#### Step 2: Enable Gmail API

1. Go to **[APIs & Services → Library](https://console.cloud.google.com/apis/library)**
2. Search for **"Gmail API"**
3. Click on **Gmail API** → **"Enable"**

**Direct Link**: [Enable Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com)

#### Step 3: Configure OAuth Consent Screen

1. Go to **[APIs & Services → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)**
2. Select **"External"** → Click **"Create"**
3. Fill in the form:
   - **App name**: `AI Email OS`
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **"Save and Continue"**
5. On **Scopes** page, click **"Add or Remove Scopes"**
6. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.compose`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
7. Click **"Save and Continue"**
8. On **Test users** page, click **"Add Users"**
9. Add your Gmail address(es) for testing
10. Click **"Save and Continue"**

#### Step 4: Create OAuth 2.0 Credentials

1. Go to **[APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Select:
   - **Application type**: `Web application`
   - **Name**: `AI Email OS Web Client`
4. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3001/api/auth/gmail/callback
   ```
   (For production, also add your production URL)
5. Click **"Create"**
6. Copy the values to your `.env.local`:

| Google Field  | Environment Variable   |
| ------------- | ---------------------- |
| Client ID     | `GOOGLE_CLIENT_ID`     |
| Client Secret | `GOOGLE_CLIENT_SECRET` |

**Direct Link**: [Create Credentials](https://console.cloud.google.com/apis/credentials/oauthclient)

---

### 3. OpenAI Setup

OpenAI powers the AI classification and email generation.

#### Step 1: Create an OpenAI Account

1. Go to **[https://platform.openai.com](https://platform.openai.com)**
2. Sign up or log in

#### Step 2: Get Your API Key

1. Go to **[API Keys](https://platform.openai.com/api-keys)**
2. Click **"+ Create new secret key"**
3. Give it a name: `AI Email OS`
4. Copy the key immediately (you won't see it again!)
5. Add to your `.env.local`:
   ```
   OPENAI_API_KEY=sk-proj-...your-key...
   ```

**Direct Link**: [OpenAI API Keys](https://platform.openai.com/api-keys)

#### Step 3: Add Credits (if needed)

1. Go to **[Billing](https://platform.openai.com/account/billing/overview)**
2. Add a payment method
3. Add credits ($5-10 is enough for testing)

> 💡 **Tip**: The app uses `gpt-4o-mini` for classification (cheap) and `gpt-4o` for reply generation. Expect ~$0.01-0.05 per email processed.

---

### 4. Generate Encryption Key

The encryption key is used to securely store Gmail OAuth tokens.

#### Option 1: Using OpenSSL (Mac/Linux)

```bash
openssl rand -base64 32
```

#### Option 2: Using Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Option 3: Online Generator

Use [https://generate.plus/en/base64](https://generate.plus/en/base64) and generate a 32-byte random string.

Copy the output to your `.env.local`:

```
ENCRYPTION_KEY=your_generated_key_here
```

---

## Database Setup

Run the database migrations to create all required tables.

#### Option 1: Using Supabase SQL Editor

1. Go to your Supabase project → **SQL Editor**
2. Open the file `supabase/migrations/001_initial_schema.sql` from this project
3. Copy and paste the entire SQL content
4. Click **"Run"**

#### Option 2: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

---

## Run the Application

```bash
# Start the development server
npm run dev
```

The app will be available at: **[http://localhost:3001](http://localhost:3001)**

> 📝 **Note**: The app runs on port 3001 by default. If you need to change it, update `package.json` and `GOOGLE_REDIRECT_URI`.

---

## First Time Usage

### 1. Access the Landing Page

Visit [http://localhost:3001](http://localhost:3001) to see the landing page.

### 2. Create an Account

1. Click **"Get Started Free"** or **"Sign In"**
2. Enter your email and password
3. Click **"Create Account"**
4. Check your email for a confirmation link (Supabase sends this)
5. Click the link to verify your account

### 3. Connect Your Gmail

1. After logging in, you'll be redirected to connect your email
2. Click **"Connect Gmail"**
3. Select your Google account
4. Review and allow the requested permissions
5. You'll be redirected back to the app

### 4. Sync Your Emails

1. Go to **Inbox** in the sidebar
2. Click the **"Sync"** button in the header
3. Wait for emails to be fetched and classified by AI
4. The AI will automatically categorize emails by type and urgency

### 5. Configure AI Rules (Optional)

1. Go to **AI Rules** in the sidebar
2. Create rules to customize AI behavior:
   - Auto-reply to certain senders
   - Require approval for specific categories
   - Escalate urgent emails

### 6. Enable AI Kill Switch (Safety)

The AI Kill Switch in the sidebar lets you instantly disable all auto-sending. It's **enabled by default** (AI can auto-send). Toggle it OFF if you want to review every AI action.

---

## Troubleshooting

### "Invalid OAuth client" error

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Ensure the redirect URI in Google Cloud matches exactly:
  ```
  http://localhost:3001/api/auth/gmail/callback
  ```

### "OpenAI API error"

- Check your API key is valid at [platform.openai.com](https://platform.openai.com)
- Ensure you have credits/billing set up
- Verify the key starts with `sk-`

### "Supabase connection error"

- Verify all three Supabase variables are set
- Check if your project is active (not paused)
- Ensure the URL starts with `https://`

### "Encryption error"

- Generate a new encryption key (32 bytes, base64 encoded)
- Make sure there are no extra spaces or quotes

### "Gmail sync not working"

- Ensure Gmail API is enabled in Google Cloud
- Verify all Gmail scopes were added to OAuth consent screen
- Check that your email is added as a test user

### Port 3001 already in use

```bash
# Find and kill the process
lsof -i :3001
kill -9 <PID>

# Or use a different port
PORT=3002 npm run dev
```

---

## Quick Links Reference

| Service                  | Link                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Supabase Dashboard       | [supabase.com/dashboard](https://supabase.com/dashboard)                                    |
| Google Cloud Console     | [console.cloud.google.com](https://console.cloud.google.com)                                |
| Gmail API Enable         | [Enable Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com)      |
| Google OAuth Credentials | [Create Credentials](https://console.cloud.google.com/apis/credentials)                     |
| OpenAI API Keys          | [platform.openai.com/api-keys](https://platform.openai.com/api-keys)                        |
| OpenAI Billing           | [platform.openai.com/account/billing](https://platform.openai.com/account/billing/overview) |

---

## Environment Variables Summary

| Variable                         | Required | Description                | Where to Get               |
| -------------------------------- | -------- | -------------------------- | -------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Yes      | Supabase project URL       | Supabase → Settings → API  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Yes      | Supabase anon/public key   | Supabase → Settings → API  |
| `SUPABASE_SERVICE_ROLE_KEY`      | Yes      | Supabase service role key  | Supabase → Settings → API  |
| `GOOGLE_CLIENT_ID`               | Yes      | Google OAuth client ID     | Google Cloud → Credentials |
| `GOOGLE_CLIENT_SECRET`           | Yes      | Google OAuth client secret | Google Cloud → Credentials |
| `GOOGLE_REDIRECT_URI`            | Yes      | OAuth callback URL         | Set manually               |
| `OPENAI_API_KEY`                 | Yes      | OpenAI API key             | OpenAI → API Keys          |
| `NEXT_PUBLIC_APP_URL`            | Yes      | App base URL               | Set manually               |
| `ENCRYPTION_KEY`                 | Yes      | Token encryption key       | Generate with openssl      |
| `NEXT_PUBLIC_AUTO_SYNC_INTERVAL` | No       | Sync interval (minutes)    | Default: 5                 |
| `GOOGLE_PUBSUB_TOPIC`            | No       | Pub/Sub topic for push     | Google Cloud → Pub/Sub     |
| `GOOGLE_PUBSUB_SUBSCRIPTION`     | No       | Pub/Sub subscription       | Google Cloud → Pub/Sub     |

---
