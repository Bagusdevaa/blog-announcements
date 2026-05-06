# medium-discord-bot

A GitHub Actions workflow that monitors Medium accounts and sends Discord announcements whenever a new article is published. No server required, runs entirely for free.

## How It Works

Every 15 minutes, GitHub Actions fetches the RSS feed of each configured Medium account. If a new article is detected, it sends an embed message to a Discord channel via webhook. State is persisted in a GitHub Gist so already-announced articles are never sent twice.

## Setup

### 1. Discord Webhook

1. Open the Discord channel you want announcements in
2. **Edit Channel → Integrations → Webhooks → New Webhook**
3. Copy the webhook URL

### 2. GitHub Gist (for state storage)

1. Go to [gist.github.com](https://gist.github.com)
2. Create a new secret gist with filename `seen_articles.json` and content `{}`
3. Copy the Gist ID from the URL: `gist.github.com/<username>/<GIST_ID>`

### 3. GitHub Personal Access Token

1. Go to **GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**
2. Generate a new token with the `gist` permission
3. Copy the token immediately — it won't be shown again

### 4. Repository Secrets

In your repo, go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|---|---|
| `DISCORD_WEBHOOK_URL` | Webhook URL from step 1 |
| `GIST_TOKEN` | Token from step 3 |
| `GIST_ID` | Gist ID from step 2 |

### 5. Add Medium Accounts

Edit `accounts.json` to configure which accounts to monitor:

```json
[
  {
    "username": "your_medium_username",
    "displayName": "Your Name",
    "avatarUrl": "https://your-avatar-url.jpg"
  }
]
```

`avatarUrl` is optional — the embed works fine without it.

## Adding More Accounts

Just add a new entry to `accounts.json` and push. No other changes needed.

```json
[
  {
    "username": "bagusdeva",
    "displayName": "Bagus Deva",
    "avatarUrl": "https://miro.medium.com/v2/resize:fill:200:200/0*..."
  },
  {
    "username": "friend_username",
    "displayName": "Friend Name",
    "avatarUrl": ""
  }
]
```

## Running Manually

Go to the **Actions** tab in your repo → **Check Medium Articles** → **Run workflow**.

## Notes

- GitHub Actions cron jobs may be delayed by up to 30 minutes during peak times
- Workflows on inactive repos (no activity for 60 days) may be paused by GitHub — push a small update occasionally to keep it active
- The first run will index all existing articles without announcing them, so you won't get spammed

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)