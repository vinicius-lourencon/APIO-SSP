# SISAPA — Sistema Integrado de Submissão e Avaliação de Projetos Acadêmicos

> Plataforma web desenvolvida para o **IFMS** que digitaliza todo o ciclo de vida de projetos acadêmicos: da criação pelo aluno até a decisão final do professor avaliador, com notificações, histórico auditável e comunicação por e-mail.

---

## O problema que resolve

A submissão de projetos acadêmicos costuma ser feita por e-mail, planilhas ou formulários desconexos: professores perdem projetos na caixa de entrada, alunos não sabem em que etapa estão e não há histórico das decisões.

O SISAPA reúne tudo em um só lugar: o aluno submete, o professor assume e avalia, os dois acompanham o andamento e cada passo fica registrado no histórico do projeto.

---

## Funcionalidades

### Aluno
- Criar projetos em duas etapas (detalhes + informações gerais: objetivos, descrição, impacto, área, palavras-chave, cronograma e recursos)
- Anexar até 2 documentos por envio (PDF, DOC, DOCX — máx. 25 MB)
- Enviar para avaliação e acompanhar status e progresso
- Receber notificações das decisões do avaliador
- Corrigir o projeto quando houver **ajustes solicitados** e reenviá-lo ao mesmo avaliador

### Professor / avaliador
- Ver a fila de projetos submetidos e **assumir** a avaliação
- Baixar os anexos dos projetos que avalia
- Emitir parecer, feedback e decisão: **aprovado**, **reprovado** ou **ajustes solicitados** (justificativa obrigatória nos dois últimos)
- Reavaliar o projeto depois que o aluno reenvia os ajustes
- **Solicitar reunião por e-mail** ao aluno: o e-mail sai com resposta direta para o professor; se houver data sugerida, a reunião entra no cronograma do projeto
- Painel com estatísticas (avaliados, pendentes, aprovados, ajustes)

### Geral
- Cadastro com e-mail institucional: professores `@ifms.edu.br`, alunos `@estudante.ifms.edu.br`
- Central de notificações e histórico completo de cada projeto
- Confirmações de ações em janelas próprias do sistema
- Sessão expirada leva de volta ao login automaticamente
- Interface responsiva

---

## Fluxo de um projeto

```
rascunho ──enviar──▶ submetido ──professor assume──▶ em análise ──avaliação──▶ aprovado (100%)
                                                        ▲                   ├──▶ reprovado
                                                        │                   └──▶ ajustes solicitados
                                                        └──── aluno corrige e reenvia (mesmo avaliador) ◀──┘
```

Cada passo gera uma entrada no histórico do projeto e uma notificação para quem é afetado. A qualquer momento depois de assumir, o avaliador pode solicitar uma reunião por e-mail (limite de 1 solicitação a cada 10 minutos por projeto).

---

## Tecnologias

Aplicação full-stack em TypeScript: SPA React no front, API REST Express no back e tipos compartilhados entre os dois (`shared/api.ts`).

| Camada | Tecnologias |
|---|---|
| Front-end | React 18, Vite 8, React Router 6, Tailwind CSS + shadcn/ui, Sonner (toasts) |
| Back-end | Node.js + Express 5, Zod (validação), Helmet, express-rate-limit, Multer (upload) |
| Banco de dados | SQLite via better-sqlite3 (arquivo `sisapa.db`, migrations versionadas) |
| Autenticação | JWT (8 h) + bcryptjs |
| E-mail | Nodemailer (SMTP — ex.: Gmail com senha de app) |
| Qualidade | Vitest (testes de integração da API), ESLint, TypeScript |

---

## Como executar

### Pré-requisitos
- **Node.js 22.12 ou superior**
- **pnpm 10** (`corepack enable`, ou use `npx pnpm@10.14.0` no lugar de `pnpm`)

### Windows: com dois cliques
Execute **`iniciar-sisapa.bat`**. Ele cria o `.env` (se não existir), instala as dependências na primeira vez, sobe o servidor e abre `http://localhost:8080`. Se o SISAPA já estiver rodando, só abre o navegador.

### Manualmente
```bash
git clone https://github.com/vinicius-lourencon/APIO-SSP.git
cd APIO-SSP

pnpm install              # também compila o módulo nativo do SQLite
cp .env.example .env      # ajuste as variáveis (veja abaixo)
pnpm dev                  # front + API em http://localhost:8080
```

Versão de produção local: `pnpm build` e depois `pnpm start` (porta `PORT`, padrão 3000; exige `JWT_SECRET`).

### Usuários de demonstração
Com o banco vazio, o `pnpm dev` cria usuários e projetos de exemplo (senha **`senha123`**):

| Perfil | E-mail |
|---|---|
| Aluno | `joao.silva@estudante.ifms.edu.br` |
| Aluna | `maria.oliveira@estudante.ifms.edu.br` |
| Professora | `ana.costa@ifms.edu.br` |
| Professor | `carlos.lima@ifms.edu.br` |

Os dados ficam em `sisapa.db` (e `sisapa.db-wal`/`-shm`) e os anexos em `uploads/`, na raiz do projeto, e **persistem** entre execuções. Para recomeçar do zero, apague `sisapa.db*`. Para backup, copie esses arquivos e a pasta `uploads/` com o servidor parado.

---

## Configuração (`.env`)

Copie `.env.example` para `.env`. **Nunca envie o `.env` para o repositório** (ele já está no `.gitignore`).

| Variável | Para que serve |
|---|---|
| `JWT_SECRET` | Segredo dos tokens de login. Obrigatório no `pnpm start`; no `pnpm dev` há um segredo de desenvolvimento |
| `PORT` | Porta do `pnpm start` (padrão 3000) |
| `CORS_ORIGINS` | Origens extras liberadas (mesma origem e `localhost` já são aceitos) |
| `SEED` | `1` cria os usuários de demonstração também no `pnpm start` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Servidor de e-mail (já vêm prontos para o Gmail: `smtp.gmail.com`, 465, `true`) |
| `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Conta remetente e senha de app |
| `EMAIL_TRANSPORT` | `log` imprime os e-mails no terminal em vez de enviar |
| `EMAIL_REDIRECT_TO` | Durante testes, desvia **todos** os e-mails para este endereço |

### Envio de e-mail com Gmail
1. Use uma conta Gmail (de preferência só para o SISAPA) com **verificação em duas etapas**.
2. Gere uma **senha de app** em https://myaccount.google.com/apppasswords.
3. Preencha `SMTP_USER` (o endereço) e `SMTP_PASS` (a senha de app) no `.env`.

Sem credenciais, o `pnpm dev` apenas imprime o e-mail no terminal e o `pnpm start` responde "envio de e-mail não configurado". Os alunos de demonstração usam e-mails de um domínio real: ao testar, defina `EMAIL_REDIRECT_TO` com o seu endereço.

---

## Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Desenvolvimento com hot-reload (porta 8080) |
| `pnpm build` | Build de produção (client + server) |
| `pnpm start` | Servidor de produção local |
| `pnpm test` | Testes (Vitest): integração da API com banco temporário + serviço de e-mail |
| `pnpm lint` | Análise estática com ESLint |
| `pnpm typecheck` | Verificação de tipos TypeScript |
| `pnpm format.fix` | Formatação com Prettier |

Antes de enviar alterações: `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` precisam passar.

---

## Estrutura do projeto

```
APIO-SSP/
├── client/                    # SPA React
│   ├── components/
│   │   ├── layout/            # Header (navegação e notificações)
│   │   ├── ui/                # Componentes base (shadcn/ui)
│   │   ├── ConfirmDialog.tsx  # Janela de confirmação do sistema
│   │   └── MeetingRequestDialog.tsx
│   ├── contexts/              # AuthContext (sessão do usuário)
│   ├── hooks/
│   ├── lib/api.ts             # Cliente HTTP (todas as chamadas à API)
│   └── pages/                 # Telas (login, área do aluno, área do avaliador, detalhe, notificações, perfil)
├── server/                    # API REST Express (/api)
│   ├── db/database.ts         # Schema, migrations e dados de demonstração
│   ├── middleware/auth.ts     # JWT, perfis e validação (Zod)
│   ├── routes/                # auth, projetos, avaliações, arquivos, notificações, reuniões
│   ├── services/email/        # Envio de e-mail + templates
│   ├── lib/helpers.ts         # Histórico e notificações
│   └── api.spec.ts            # Testes de integração
├── shared/api.ts              # Tipos e regras compartilhadas entre front e back
├── docs/
│   ├── SISAPA-ARQUITETURA.md  # Endpoints, tabelas, regras e fluxos
│   └── AUDITORIA.md           # Auditoria técnica e plano de correção
├── tools/graphify/            # Scripts para regenerar o grafo de conhecimento
├── graphify-out/              # Grafo de conhecimento do código (graph.html, wiki, relatório)
├── iniciar-sisapa.bat         # Atalho de inicialização (Windows)
├── CLAUDE.md / AGENTS.md      # Guias para assistentes de IA que trabalham no código
└── .env.example               # Modelo de configuração
```

Detalhes de cada endpoint, tabela e regra de negócio: **[`docs/SISAPA-ARQUITETURA.md`](docs/SISAPA-ARQUITETURA.md)**.

---

## Segurança

- Senhas com **bcrypt**; sessões com **JWT** de 8 horas
- Cadastro restrito por domínio institucional e por perfil
- Rotas protegidas por autenticação e perfil, validadas no servidor (não só na interface)
- Rate limit: 20 tentativas / 15 min em login e cadastro; 1 solicitação de reunião / 10 min por projeto
- Headers de segurança com **Helmet** (CSP); CORS restrito à mesma origem e ao ambiente local
- Texto gravado como digitado e escapado na exibição (React e templates de e-mail), sem HTML injetado
- Upload validado (tipo, tamanho, dono e status do projeto) antes de gravar no disco; proteção contra path traversal no download
- Configuração sensível só em variáveis de ambiente

---

## Sobre o projeto acadêmico

| | |
|---|---|
| **Instituição** | Instituto Federal de Mato Grosso do Sul — IFMS |
| **Curso** | Tecnologia em Análise e Desenvolvimento de Sistemas (TADS) |
| **Disciplina** | Aplicações Para Internet com Orientação a Objetos (APIO) |
| **Período** | 4º Semestre |

## Desenvolvido por

| Nome | GitHub |
|---|---|
| Nicolas Wolf | [@Flowzinnn](https://github.com/Flowzinnn) |
| Vinicius Antonio Lourençon | [@vinicius-lourencon](https://github.com/vinicius-lourencon) |
| Ryan Lopes Hadas | [@ryanhadas](https://github.com/ryanhadas) |

*Projeto desenvolvido para fins acadêmicos — IFMS, 2025.*
