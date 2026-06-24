# Deploy para Testes — NutriRPG

## Arquitectura recomendada

| Componente | Serviço | Plano gratuito |
|---|---|---|
| **PostgreSQL** | [Neon](https://neon.tech) | 0.5 GB, serverless |
| **Backend Node.js** | [Railway](https://railway.app) | $5 crédito/mês |
| **Web (React)** | [Vercel](https://vercel.com) | Ilimitado para projectos estáticos |
| **Mobile (Expo)** | Expo Go + EAS Build | 30 builds/mês |

---

## Passo a passo

### 1. Base de dados — Neon

1. Cria conta em [neon.tech](https://neon.tech)
2. Cria um projecto → copia a **connection string** (formato `postgresql://user:pass@host/db?sslmode=require`)
3. Aplica o schema na base de dados remota — configura `backend/.env` com as credenciais do Neon e executa:

```bash
cd backend
npm run setup
```

---

### 2. Backend — Railway

1. Instala o CLI:

```bash
npm install -g @railway/cli
```

2. Na pasta `backend/`:

```bash
railway login
railway init        # cria projecto
railway up          # deploy
```

3. No dashboard do Railway → **Variables**, adiciona:

```
DATABASE_URL=<connection string do Neon>
JWT_SECRET=<o teu secret>
NODE_ENV=production
PORT=3000
```

4. Copia o URL público gerado (ex: `https://nutrirpg-backend.up.railway.app`)

---

### 3. Web — Vercel

1. Instala o CLI:

```bash
npm install -g vercel
```

2. Define a variável de ambiente antes do deploy. Cria `frontend-web/.env.production`:

```
REACT_APP_API_URL=https://nutrirpg-backend.up.railway.app
```

Ou define directamente no dashboard do Vercel → **Settings → Environment Variables**.

3. Na pasta `frontend-web/`:

```bash
vercel
```

---

### 4. Mobile — duas opções

#### Opção A — Expo Go (rápido, só para testar)

```bash
npx expo start --tunnel
```

Partilha o QR code. Quem tiver a app [Expo Go](https://expo.dev/go) instalada pode abrir directamente.

#### Opção B — APK Android (para distribuir)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Gera um `.apk` para instalar directamente em qualquer dispositivo Android.

Antes do build, actualiza o URL da API em `frontend-mobile/app.json`:

```json
"extra": {
  "apiUrl": "https://nutrirpg-backend.up.railway.app"
}
```

---

## Ordem de execução

```
1. Cria DB no Neon        → copia connection string
2. Deploy backend Railway → define variáveis de ambiente → copia URL público
3. Deploy web no Vercel   → define REACT_APP_API_URL
4. Actualiza app.json     → expo start --tunnel  (ou eas build para APK)
```

---

## Custo estimado

**€0/mês** para testes, dentro dos limites dos free tiers de todos os serviços.
