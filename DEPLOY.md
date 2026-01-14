# Deploy su Railway

Guida per il deploy del portfolio su [Railway](https://railway.app).

## Architettura

Il progetto è un monorepo con 4 servizi:

| Servizio | Descrizione | Porta |
|----------|-------------|-------|
| **postgres** | PostgreSQL Database | 5432 |
| **api** | Elysia REST API | 3000 |
| **admin** | React Admin Panel (nginx) | 80 |
| **web** | Astro Public Website (nginx) | 80 |

## Prerequisiti

1. Account Railway
2. Repository GitHub/GitLab connesso
3. (Opzionale) Account Cloudflare per R2 storage

## Setup Railway

### 1. Crea un nuovo progetto

1. Vai su [railway.app](https://railway.app) e accedi
2. Crea un nuovo progetto vuoto

### 2. Aggiungi PostgreSQL

1. **New Service** → **Database** → **PostgreSQL**
2. Railway configurerà automaticamente le variabili d'ambiente
3. Nota la `DATABASE_URL` generata (la userai per l'API)

### 3. Configura il servizio API

1. **New Service** → **GitHub Repo** → Seleziona questo repository
2. Configura le impostazioni:

   | Impostazione | Valore |
   |--------------|--------|
   | Root Directory | `/` |
   | Dockerfile Path | `packages/api/Dockerfile` |
   | Watch Paths | `packages/api/**`, `packages/shared/**` |

3. Aggiungi le **variabili d'ambiente**:

   ```env
   # Collegamento al database PostgreSQL (Railway lo imposta automaticamente se colleghi i servizi)
   DATABASE_URL=${{Postgres.DATABASE_URL}}

   # Obbligatorie
   JWT_SECRET=<stringa-random-minimo-32-caratteri>
   ADMIN_PASSWORD_HASH=<hash-bcrypt-password-admin>

   # Opzionali
   CORS_ORIGINS=https://admin.tuodominio.com,https://tuodominio.com

   # Storage (default: local)
   STORAGE_BACKEND=local

   # Se usi Cloudflare R2
   STORAGE_BACKEND=r2
   R2_ACCOUNT_ID=<account-id>
   R2_ACCESS_KEY_ID=<access-key>
   R2_SECRET_ACCESS_KEY=<secret-key>
   R2_BUCKET_NAME=<bucket-name>
   R2_PUBLIC_URL=https://cdn.tuodominio.com
   ```

4. Aggiungi un **Volume** per uploads (se usi storage locale):
   - Mount Path: `/app/uploads`

5. Configura il **dominio** (es. `api.tuodominio.com`)

### 4. Configura il servizio Admin

1. **New Service** → **GitHub Repo** → Seleziona questo repository
2. Configura le impostazioni:

   | Impostazione | Valore |
   |--------------|--------|
   | Root Directory | `/` |
   | Dockerfile Path | `packages/admin/Dockerfile` |
   | Watch Paths | `packages/admin/**`, `packages/shared/**` |

3. Aggiungi le **variabili di build**:

   ```env
   VITE_API_URL=https://api.tuodominio.com
   ```

4. Configura il **dominio** (es. `admin.tuodominio.com`)

### 5. Configura il servizio Web

1. **New Service** → **GitHub Repo** → Seleziona questo repository
2. Configura le impostazioni:

   | Impostazione | Valore |
   |--------------|--------|
   | Root Directory | `/` |
   | Dockerfile Path | `packages/web/Dockerfile` |
   | Watch Paths | `packages/web/**`, `packages/shared/**` |

3. Aggiungi le **variabili di build**:

   ```env
   PUBLIC_API_URL=https://api.tuodominio.com
   PUBLIC_BROWSER_API_URL=https://api.tuodominio.com
   ```

4. Configura il **dominio** (es. `tuodominio.com`)

## Generare l'hash della password admin

```bash
# Con bun
bun -e "console.log(await Bun.password.hash('la-tua-password'))"

# Con Node.js + bcrypt
node -e "require('bcrypt').hash('la-tua-password', 10).then(console.log)"
```

## Generare JWT_SECRET

```bash
openssl rand -base64 32
```

## Database PostgreSQL

Railway fornisce PostgreSQL come servizio gestito con:
- Backup automatici
- Scalabilità automatica
- Connessione sicura

Per collegare l'API al database PostgreSQL:
1. Vai nelle impostazioni del servizio API
2. Nella sezione "Variables", usa il riferimento: `${{Postgres.DATABASE_URL}}`

### Migrazioni

Dopo il primo deploy, esegui le migrazioni:

```bash
# Dal terminale Railway o localmente con DATABASE_URL
bun run db:push
```

## Variabili d'ambiente riepilogo

### API Service

| Variabile | Obbligatoria | Descrizione |
|-----------|--------------|-------------|
| `DATABASE_URL` | ✅ | URL PostgreSQL (da Railway) |
| `JWT_SECRET` | ✅ | Secret per JWT (min 32 char) |
| `ADMIN_PASSWORD_HASH` | ✅ | Hash bcrypt password admin |
| `CORS_ORIGINS` | ❌ | Origins CORS (comma-separated) |
| `STORAGE_BACKEND` | ❌ | `local` o `r2` (default: local) |
| `R2_ACCOUNT_ID` | Se R2 | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Se R2 | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Se R2 | R2 secret key |
| `R2_BUCKET_NAME` | Se R2 | Nome bucket R2 |
| `R2_PUBLIC_URL` | Se R2 | URL pubblico CDN |

### Admin Service

| Variabile | Obbligatoria | Descrizione |
|-----------|--------------|-------------|
| `VITE_API_URL` | ✅ | URL API per le chiamate |

### Web Service

| Variabile | Obbligatoria | Descrizione |
|-----------|--------------|-------------|
| `PUBLIC_API_URL` | ✅ | URL API per SSR |
| `PUBLIC_BROWSER_API_URL` | ✅ | URL API per client |

## Deploy automatico

Railway è configurato per deployare **solo dopo che i test GitHub Actions passano**.

### Configurazione (già impostata)

Il file `railway.toml` configura:
```toml
[deploy]
checkSuites = ["Tests"]
```

Questo significa che Railway:
- ✅ Deploya solo se il workflow "Tests" passa
- ❌ NON deploya se i test falliscono

### Settings Dashboard Railway

Per ogni servizio, verifica in **Settings → Deployments**:
- ✅ "Deploy on GitHub Push" abilitato
- ✅ "Check Suites" → Seleziona "Tests"

Vedi [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) per dettagli completi.

## Troubleshooting

### L'API non risponde

1. Controlla i log: `railway logs`
2. Verifica che le variabili d'ambiente siano configurate
3. Controlla che il database PostgreSQL sia raggiungibile

### Admin/Web non carica i dati

1. Verifica che `VITE_API_URL` / `PUBLIC_API_URL` siano corretti
2. Controlla CORS_ORIGINS nell'API

### Errori di connessione al database

1. Verifica che il servizio PostgreSQL sia attivo
2. Controlla che `DATABASE_URL` sia configurata correttamente
3. Esegui `bun run db:push` per creare le tabelle

## Costi Railway

- **Starter**: $5/mese include risorse base
- **Pro**: $20/mese per più risorse e team
- PostgreSQL e volumi hanno costi per utilizzo

Consulta [railway.app/pricing](https://railway.app/pricing) per dettagli aggiornati.
