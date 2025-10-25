# GitLit - GitHub OAuth Setup Guide

## 🚀 Quick Start

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `GitLit` (or your preferred name)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values:

```env
# GitHub OAuth Configuration
GITHUB_ID=your_actual_github_client_id
GITHUB_SECRET=your_actual_github_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here
```

**To generate a NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 3. Run the Development Server

```bash
npm run dev
```

### 4. Test the OAuth Flow

1. Open [http://localhost:3000](http://localhost:3000)
2. You should be redirected to the sign-in page
3. Click "Continue with GitHub"
4. Authorize the application
5. You should be redirected to the dashboard

## 🔧 Project Structure

```
calhacks12.0/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth API routes
│   ├── auth/signin/page.tsx             # Sign-in page
│   ├── dashboard/page.tsx               # Main dashboard
│   ├── layout.tsx                       # Root layout with SessionProvider
│   └── page.tsx                         # Home page (redirects)
├── lib/
│   └── auth.ts                          # NextAuth configuration
├── types/
│   └── next-auth.d.ts                   # TypeScript declarations
└── .env.local                           # Environment variables
```

## 🎯 Features Implemented

- ✅ GitHub OAuth authentication
- ✅ Beautiful sign-in page with loading states
- ✅ Dashboard with mock repository scores
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript support
- ✅ Session management

## 🚀 Next Steps

1. **Connect CodeRabbit API** - Add real code review functionality
2. **Add Postman Integration** - Test APIs automatically
3. **Real Repository Data** - Fetch actual GitHub repositories
4. **Webhook Integration** - Listen for PR events
5. **Score Calculation** - Implement real scoring algorithm

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
- **Authentication**: NextAuth.js with GitHub provider
- **Styling**: Tailwind CSS with custom gradients
- **TypeScript**: Full type safety
- **Deployment**: Ready for Vercel

## 📝 Notes

- The dashboard currently shows mock data
- GitHub OAuth requires HTTPS in production
- Make sure to update the callback URL when deploying
- The app requests `read:user`, `user:email`, and `repo` scopes
