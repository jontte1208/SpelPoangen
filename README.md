# SpelPoangen

## Production setup (Vercel + Supabase + Discord)

Follow these steps in order to ensure Discord users are persisted in Supabase and your Discord account always gets ADMIN role.

### 1. Add environment variables in Vercel

In Vercel project settings, add these variables for Production (and Preview if needed):

- NEXT_PUBLIC_APP_URL=https://your-domain.com
- NEXTAUTH_URL=https://your-domain.com
- NEXTAUTH_SECRET=your-random-secret
- DATABASE_URL=your-supabase-pooled-url-port-6543
- DIRECT_URL=your-supabase-direct-url-port-5432
- DISCORD_CLIENT_ID=your-discord-client-id
- DISCORD_CLIENT_SECRET=your-discord-client-secret
- DISCORD_BOT_TOKEN=your-discord-bot-token
- DISCORD_GUILD_ID=your-discord-server-id
- DISCORD_VIP_ROLE_ID=discord-role-id-for-vip-premium
- DISCORD_PREMIUM_ROLE_ID=discord-role-id-for-premium-optional-alias
- DISCORD_GOLD_ROLE_ID=discord-role-id-for-gold-optional
- DISCORD_FREE_ROLE_ID=discord-role-id-for-free-optional
- ADMIN_DISCORD_ID=your-discord-user-id

Optional for multiple admins:

- ADMIN_DISCORD_IDS=123456789012345678,987654321098765432

Note:

- Keep DATABASE_URL and DIRECT_URL pointing at the same Supabase project.
- If both ADMIN_DISCORD_ID and ADMIN_DISCORD_IDS are set, both are accepted.
- DISCORD_BOT_TOKEN must be from the same Discord application as DISCORD_CLIENT_ID.
- DISCORD_GUILD_ID is your server ID (example: 1488219784062570579).
- DISCORD_VIP_ROLE_ID (or DISCORD_PREMIUM_ROLE_ID) is used when a user is set to PREMIUM in admin.
- DISCORD_GOLD_ROLE_ID and DISCORD_FREE_ROLE_ID are optional mappings for GOLD/FREE tier sync.
- Use the exact URL formats from Supabase dashboard:
	- DATABASE_URL (pooler): `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
	- DIRECT_URL (direct): `postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres`
- If password includes special characters, URL-encode it before saving in Vercel.

### 2. Configure Discord OAuth redirect URLs

In Discord Developer Portal for your app:

- Add https://your-domain.com/api/auth/callback/discord
- Keep http://localhost:3000/api/auth/callback/discord for local development
- Ensure your OAuth2 flow requests `guilds.join` (already configured in code).

### 2.1 Configure Discord bot permissions for auto-join

- Invite your bot to the target server (DISCORD_GUILD_ID).
- In Developer Portal -> Bot, enable `SERVER MEMBERS INTENT`.
- Make sure the bot role in the server has permission to create/invite members.

### 3. Deploy the new version

- Push your latest code to the branch connected to Vercel.
- Trigger a redeploy (or deploy automatically on push).

### 4. Verify user persistence in Supabase

After deployment, log out and log in with Discord once.

Then run this in Supabase SQL Editor:

```sql
SELECT "id", "email", "discordId", "role", "lastLogin"
FROM "User"
WHERE "discordId" = 'YOUR_DISCORD_ID';
```

Expected result:

- One row exists for your user.
- discordId matches your Discord ID.
- role is ADMIN if ADMIN_DISCORD_ID or ADMIN_DISCORD_IDS includes your ID.

### 5. One-time manual admin fallback (if needed)

If your user already exists and you want immediate admin role before next login:

```sql
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "discordId" = 'YOUR_DISCORD_ID';
```

### 6. Common failure checks

- NEXTAUTH_URL must exactly match your production domain.
- Discord callback URL in portal must exactly match /api/auth/callback/discord.
- Wrong Supabase URL or password in DATABASE_URL prevents writes.
- If you changed env vars, redeploy so Vercel picks up the new values.
