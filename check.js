const Parser = require("rss-parser");
const fs = require("fs");

const parser = new Parser();
const accounts = JSON.parse(fs.readFileSync("accounts.json", "utf-8"));

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const GIST_TOKEN = process.env.GIST_TOKEN;
const GIST_ID = process.env.GIST_ID;

// Ambil state dari GitHub Gist
async function getSeenArticles() {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: { Authorization: `token ${GIST_TOKEN}` },
    });
    const data = await res.json();
    const content = data.files["seen_articles.json"]?.content;
    return content ? JSON.parse(content) : {};
}

// Simpan state ke GitHub Gist
async function saveSeenArticles(seen) {
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: "PATCH",
        headers: {
            Authorization: `token ${GIST_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            files: {
                "seen_articles.json": { content: JSON.stringify(seen, null, 2) },
            },
        }),
    });
}

// Kirim ke Discord via Webhook
async function sendToDiscord(account, article) {
    const thumbnailMatch = article["content:encoded"]?.match(
        /<img[^>]+src="([^">]+)"/
    );
    const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null;

    const embed = {
        color: 0x00ab6c,
        author: {
            name: `${account.displayName} menulis artikel baru!`,
            url: `https://medium.com/@${account.username}`,
            ...(account.avatarUrl && { icon_url: account.avatarUrl }),
        },
        title: article.title,
        url: article.link,
        description: (article.contentSnippet?.slice(0, 200) ?? "") + "...",
        timestamp: new Date(article.pubDate).toISOString(),
        footer: { text: "Medium" },
        ...(thumbnail && { image: { url: thumbnail } }),
    };

    await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            content: "@everyone Artikel baru nih! Bantu engage 🥹",
            embeds: [embed] }),
    });
}

async function main() {
    const seen = await getSeenArticles();

    for (const account of accounts) {
        try {
            const feed = await parser.parseURL(
                `https://medium.com/feed/@${account.username}`
            );

            if (!seen[account.username]) {
                // Pertama kali: simpan semua, jangan announce
                seen[account.username] = feed.items.map((i) => i.link);
                console.log(`[Init] @${account.username}: ${feed.items.length} artikel disimpan`);
                continue;
            }

            const newArticles = feed.items.filter(
                (item) => !seen[account.username].includes(item.link)
            );

            for (const article of newArticles) {
                console.log(`[New] @${account.username}: ${article.title}`);
                await sendToDiscord(account, article);
                seen[account.username].push(article.link);
            }
        } catch (err) {
            console.error(`Error @${account.username}:`, err.message);
        }
    }

    await saveSeenArticles(seen);
}

main();