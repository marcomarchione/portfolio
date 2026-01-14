# Railway Setup - Configurazione Deployment

## Problema 1: Deploy solo dopo GitHub Actions

Railway è configurato per deployare **solo dopo che i test passano** usando la configurazione `checkSuites` nel `railway.toml`.

### Configurazione Dashboard Railway

Per ogni servizio (api, admin, web), configura nelle **Settings**:

1. **Deployments**:
   - ✅ Abilita: "Deploy on GitHub Push"
   - ✅ Abilita: "Check Suites" → Seleziona "Tests"
   - ❌ Disabilita: "Deploy Previews" (opzionale)

2. **Build Settings**:
   - Root Directory: `/`
   - Dockerfile Path:
     - API: `packages/api/Dockerfile`
     - Admin: `packages/admin/Dockerfile`
     - Web: `packages/web/Dockerfile`

3. **Watch Paths**:
   - API: `packages/api/**,packages/shared/**`
   - Admin: `packages/admin/**,packages/shared/**`
   - Web: `packages/web/**,packages/shared/**`

### Come funziona

1. Push su `main` → Triggera GitHub Action "Tests"
2. Se "Tests" passa ✅ → Railway deploya automaticamente
3. Se "Tests" fallisce ❌ → Railway **NON deploya**

### Verifica configurazione

```bash
# Controlla che railway.toml sia committato
git log --oneline railway.toml

# Il file deve contenere:
# [deploy]
# checkSuites = ["Tests"]
```

## Problema 2: Deploy Fallito - Troubleshooting

### Errore: `addgroup: not found`

**Causa**: L'immagine `oven/bun:1.3` ora usa Alpine Linux invece di Debian.

**Fix**: ✅ **GIÀ RISOLTO** nel commit `fix(deploy): update Dockerfile for Alpine Linux`

I Dockerfile ora usano la sintassi Alpine:
```dockerfile
# Prima (Debian/Ubuntu):
RUN addgroup --system --gid 1001 nodejs

# Dopo (Alpine):
RUN addgroup -S -g 1001 nodejs
```

### Errore: `lockfile had changes, but lockfile is frozen`

**Causa**: Il lockfile ha modifiche ma il flag `--frozen-lockfile` impedisce l'install.

**Fix**: ✅ **GIÀ RISOLTO** nel commit `fix(deploy): update Dockerfile for Alpine Linux`

I Dockerfile ora usano:
```dockerfile
# Prima:
RUN bun install --frozen-lockfile

# Dopo:
RUN bun install --no-save
```

### Check Deploy Status

1. **Via Railway Dashboard**:
   - Vai su https://railway.app
   - Seleziona il tuo progetto
   - Controlla "Deployments" per ogni servizio
   - Verifica i log per errori

2. **Via Railway CLI**:
   ```bash
   # Installa CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Link al progetto
   railway link

   # Check logs
   railway logs

   # Check status
   railway status
   ```

3. **Via GitHub**:
   - Vai su Actions → Workflow "Tests"
   - Verifica che sia passato ✅
   - Railway dovrebbe deployare automaticamente dopo

### Forza un nuovo deploy

Se il deploy è bloccato:

```bash
# Opzione 1: Push vuoto per triggerare deploy
git commit --allow-empty -m "chore: trigger Railway deploy"
git push origin main

# Opzione 2: Via Railway CLI
railway up

# Opzione 3: Via Railway Dashboard
# Settings → Deployments → "Trigger Deploy"
```

### Verifica variabili d'ambiente

**API Service** (required):
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<min-32-chars>
ADMIN_PASSWORD_HASH=<bcrypt-hash>
```

**Admin Service** (required):
```
VITE_API_URL=https://api.yourdomain.com
```

**Web Service** (required):
```
PUBLIC_API_URL=https://api.yourdomain.com/api/v1
PUBLIC_BROWSER_API_URL=https://api.yourdomain.com/api/v1
```

### Common Issues

#### 1. Build fallisce con errori TypeScript

**Soluzione**: Verifica che `packages/shared` sia incluso nel watch path.

#### 2. API non si connette al database

**Soluzione**:
1. Verifica che PostgreSQL service sia attivo
2. Controlla che `DATABASE_URL` sia configurata: `${{Postgres.DATABASE_URL}}`
3. Esegui migrations: `railway run bun run db:push` (nella cartella packages/api)

#### 3. Admin/Web non riescono a chiamare l'API

**Soluzione**:
1. Verifica che l'URL dell'API sia corretto (usa il dominio Railway generato o custom)
2. Controlla CORS settings nell'API
3. Verifica che l'API sia deployata e running

#### 4. Nginx non parte (Admin/Web)

**Soluzione**:
1. Controlla che il build sia completato: `ls -la /usr/share/nginx/html`
2. Verifica nginx config: `cat /etc/nginx/conf.d/default.conf`
3. Check logs nginx: `railway logs --filter nginx`

### Monitoring

Railway fornisce:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time logs per ogni servizio
- **Deployments**: History di tutti i deploy
- **Healthchecks**: Automatic con retry

Access via:
- Dashboard: https://railway.app
- CLI: `railway logs --tail`

### Rollback

Se un deploy introduce problemi:

```bash
# Via Dashboard
# Deployments → Select previous deployment → "Redeploy"

# Via CLI
railway rollback
```

## Next Steps

1. ✅ Verifica che i fix dei Dockerfile siano stati committati
2. ✅ Push su main per triggerare nuovo deploy
3. ✅ Controlla GitHub Actions "Tests" passa
4. ✅ Monitora Railway dashboard per deployment status
5. ✅ Verifica che i servizi siano running
6. ✅ Testa l'applicazione sui domini Railway

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Repository issues tab
