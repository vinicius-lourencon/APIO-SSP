# SISAPA — Sistema Integrado de Submissão e Avaliação de Projetos Acadêmicos

> Plataforma web para gerenciamento do ciclo de vida de projetos acadêmicos no IFMS, cobrindo desde a submissão pelo aluno até a avaliação pelo professor.

---

## Sobre o Projeto

O **SISAPA** é uma aplicação full-stack desenvolvida para o **Instituto Federal de Mato Grosso do Sul (IFMS)** que centraliza o processo de submissão, acompanhamento e avaliação de projetos acadêmicos (extensão, pesquisa, TCCs, eventos etc.).

O sistema oferece dois perfis de acesso:

| Perfil | Capacidades |
|---|---|
| **Aluno** | Criar projetos, anexar documentos, acompanhar status, receber notificações e responder a solicitações de ajuste |
| **Professor / Avaliador** | Visualizar projetos submetidos, emitir pareceres, aprovar, reprovar ou solicitar ajustes |

### Fluxo de Status dos Projetos

```
Rascunho → Submetido → Em Análise → Aprovado
                                  ↘ Ajustes Solicitados → Submetido (novamente)
                                  ↘ Reprovado
```

---

## Tecnologias

### Frontend
- **React 18** + **TypeScript**
- **Vite** — bundler e servidor de desenvolvimento
- **Tailwind CSS** + **shadcn/ui** — componentes e estilização
- **React Router DOM v6** — roteamento
- **TanStack React Query** — gerenciamento de estado assíncrono
- **React Hook Form** + **Zod** — formulários com validação

### Backend
- **Node.js** + **Express 5**
- **Better-SQLite3** — banco de dados SQLite embutido
- **JWT** + **bcryptjs** — autenticação e hash de senhas
- **Helmet** — headers de segurança HTTP
- **express-rate-limit** — proteção contra brute-force
- **Multer** — upload de arquivos (PDF, DOC, DOCX — máx. 25 MB)

---

## Pré-requisitos

- **Node.js** >= 18
- **pnpm** >= 10 (recomendado) ou npm/yarn

---

## Instalação e Execução

```bash
# 1. Clone o repositório
git clone https://github.com/vinicius-lourencon/APIO-SSP.git
cd APIO-SSP

# 2. Instale as dependências
pnpm install

# 3. Inicie o servidor de desenvolvimento (frontend + backend juntos)
pnpm dev
```

A aplicação estará disponível em `http://localhost:8080`.

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento com hot-reload |
| `pnpm build` | Build de produção (client + server) |
| `pnpm start` | Inicia o servidor Node em modo produção |
| `pnpm test` | Executa a suíte de testes com Vitest |
| `pnpm typecheck` | Verifica tipagem TypeScript |
| `pnpm format.fix` | Formata o código com Prettier |

---

## Estrutura do Projeto

```
APIO-SSP/
├── client/                  # Código React (SPA)
│   ├── components/          # Componentes reutilizáveis (UI, layout)
│   ├── contexts/            # Contextos React (AuthContext)
│   ├── lib/                 # Cliente HTTP e utilitários
│   └── pages/               # Páginas da aplicação
│
├── server/                  # API Express
│   ├── db/                  # Inicialização e migrações do SQLite
│   ├── middleware/          # Middlewares (autenticação JWT)
│   └── routes/              # Rotas REST
│       ├── auth.ts          # /api/auth
│       ├── projects.ts      # /api/projetos
│       ├── evaluations.ts   # /api/avaliacoes
│       ├── files.ts         # /api/files
│       └── notifications.ts # /api/notificacoes
│
├── shared/                  # Tipos e constantes compartilhados
│   └── api.ts
│
└── index.html
```

---

## Rotas da API

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastro de usuário |
| `POST` | `/api/auth/login` | Autenticação |
| `GET` | `/api/projetos` | Listar projetos do usuário |
| `POST` | `/api/projetos` | Criar projeto |
| `PUT` | `/api/projetos/:id` | Atualizar projeto |
| `POST` | `/api/avaliacoes` | Registrar avaliação |
| `POST` | `/api/files/:id/upload` | Upload de documentos |
| `GET` | `/api/notificacoes` | Listar notificações |
| `GET` | `/api/health` | Health check |

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
JWT_SECRET=sua_chave_secreta_aqui
NODE_ENV=development
# Em produção, defina também:
FRONTEND_URL=https://seu-dominio.com
```

---

## Tipos de Projeto Suportados

- Congresso científico
- Projeto de extensão
- Pesquisa
- Curso
- Evento
- TCC

---

## Segurança

- Senhas armazenadas com **bcrypt** (hash + salt)
- Tokens **JWT** com expiração
- **Rate limiting** nas rotas de autenticação (20 req / 15 min)
- Headers de segurança via **Helmet** (CSP, HSTS etc.)
- CORS restrito às origens permitidas

---

## Desenvolvido por

| Nome | GitHub |
|---|---|
| Nicolas Wolf | [@nicolaswolf](https://github.com/nicolaswolf) |
| Vinicius Antonio Lourençon | [@vinicius-lourencon](https://github.com/vinicius-lourencon) |
| Ryan Lopes Hadas | [@ryanhadas](https://github.com/ryanhadas) |

---

**IFMS — Instituto Federal de Mato Grosso do Sul**  
Curso: Tecnologia em Análise e Desenvolvimento de Sistemas (TADS)  
Disciplina: Aplicações Para Internet com Orientação a Objetos (APIO)
