# Nalyy Gate - hebergement gratuit

## Ce qui a ete prepare

- Le script `pnpm start` lance le site et le bot ensemble.
- Le script prepare Prisma au demarrage avec `prisma generate` puis `prisma db push`.
- `.env` est ignore par Git pour ne pas envoyer les tokens Discord sur GitHub.

## 1. Envoyer cette version sur GitHub

Dans le dossier du projet:

```bash
git status
git add .
git reset .env
git commit -m "Prepare hosted Nalyy Gate deployment"
git push origin main
```

Ne fais jamais `force push`.

## 2. Lovable

Le repo actuel est deja:

```text
https://github.com/ilanjue201293-stack/nalyy-gate-v2
```

Si ce repo est celui connecte a Lovable, un simple `git push origin main` suffit pour que Lovable recupere les changements.

Si Lovable n'est plus connecte a ce repo: Lovable ne permet pas d'importer directement un repo GitHub existant dans un ancien projet. Le plus simple est de garder GitHub comme source principale, puis deployer depuis GitHub.

## 3. Heberger gratuitement

Option simple: Render + Neon.

Pourquoi:

- Render peut lancer un service Node gratuit.
- Neon donne une base PostgreSQL gratuite sans limite de temps.
- Le site et le bot tournent ensemble avec `pnpm start`.

Limite importante:

- Render Free peut dormir apres 15 minutes sans trafic entrant.
- Quand Render dort, le bot Discord se deconnecte.
- Pour limiter ca, tu peux ajouter un monitor gratuit qui ping ton URL Render toutes les 10 minutes.
- Ce n'est pas du vrai 24/7 garanti. Pour du vrai bot 24/7 garanti, il faut normalement payer un petit serveur ou utiliser une VM gratuite plus compliquee.

## 4. Variables a mettre sur Render

Dans Render, ajoute ces variables d'environnement:

```env
DATABASE_URL=postgresql://...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_BOT_TOKEN=...
DISCORD_REDIRECT_URI=https://TON-SITE.onrender.com/api/auth/discord/callback
SESSION_SECRET=une_phrase_longue_aleatoire
APP_URL=https://TON-SITE.onrender.com
```

Ne mets jamais `localhost` en production.

## 5. Reglages Render

Type:

```text
Web Service
```

Build command:

```bash
pnpm install --frozen-lockfile && pnpm deploy:build
```

Run command:

```bash
pnpm start
```

Port:

```text
Render utilise automatiquement la variable PORT.
```

## 6. Discord Developer Portal

Dans OAuth2 > Redirects, ajoute:

```text
https://TON-SITE.onrender.com/api/auth/discord/callback
```

Garde aussi en local si tu testes encore sur ton PC:

```text
http://localhost:5173/api/auth/discord/callback
```
