# JCode — Plataforma de Criação, Análise e Aprovação de Provas

Monorepo com frontend (Vite + React), backend (Express + OpenAPI) e pacotes compartilhados (types, UI, config).

## Estrutura

- `frontend` — SPA em React (Vite), modo dark/light, AppShell, páginas Professor/Coordenação/Admin
- `backend` — API Express com rotas stubs e documentação OpenAPI em `/api/docs`
- `packages/types` — Tipos TS compartilhados (models e DTOs)
- `packages/ui` — Tokens de tema e componentes básicos compartilhados
- `packages/config` — Presets de ESLint/Prettier/TSConfig

## Rodando localmente

Pré-requisitos: Node 18+.

1. Instale dependências (na raiz):
   - npm: `npm install` (instala tudo via workspaces)
2. Gere `.env` locais automaticamente:
   - `npm run setup:env`
   - Edite `backend/.env` e `frontend/.env` (e variantes) conforme necessário
3. Backend:
   - Configure env: copie `backend/.env.example` para `backend/.env` e ajuste variáveis
   - Dev: `npm run dev -w backend`
   - API: `http://localhost:4000/api` e docs em `http://localhost:4000/api/docs`
4. Frontend:
   - Dev: `npm run dev -w frontend`
   - App: `http://localhost:5173`

## Deploy sugerido

- Frontend: Vercel
- Backend: Render
- DB: NeonDB (Postgres)
- Storage: Cloudflare R2

 Veja `backend/openapi/openapi.yaml` e comentários nos arquivos para mapear as próximas implementações (auth, RBAC, multi-tenant, IA, PDF, R2, etc.).

## Ambientes

- Backend carrega env em camadas: `.env` → `.env.{NODE_ENV}` → `.env.local` → `.env.{NODE_ENV}.local` (último prevalece).
- Frontend (Vite) carrega automaticamente `.env*` com prefixo `VITE_` por ambiente.
- Exemplos:
  - Backend: `.env.example`, `.env.development.example`, `.env.production.example`
  - Frontend: `.env.example`, `.env.development.example`, `.env.production.example`

## Cloudflare R2 (uploads)

- Variáveis (em `backend/.env`):
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`
- Endpoint S3: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
- Rota: `POST /api/uploads/imagem` (multipart)
  - Campos: `file` (binário), `alt_text` (obrigatório), `legenda`, `prefer_glossary`, `prova_id`
  - Resposta: registro criado em `ImagemUpload` com `storage_url` e `ref_code` (IMAGEM N)
