# SISAPA — Sistema Integrado de Submissão e Avaliação de Projetos Acadêmicos

> Plataforma web desenvolvida para o **IFMS** que digitaliza e centraliza todo o ciclo de vida de projetos acadêmicos — da criação pelo aluno até a decisão final do professor avaliador.

---

## O Problema que Resolve

Instituições de ensino frequentemente gerenciam a submissão de projetos acadêmicos por e-mail, planilhas ou formulários desconexos. Isso cria gargalos: professores perdem projetos na caixa de entrada, alunos não sabem em que etapa seu projeto está, e não há histórico auditável das decisões tomadas.

O SISAPA resolve isso oferecendo um ambiente único onde alunos submetem, professores avaliam e ambos acompanham o andamento em tempo real — com notificações automáticas e histórico completo de cada projeto.

---

## Funcionalidades

### Para o Aluno
- Criar projetos com título, descrição, objetivos, impacto esperado, cronograma e recursos
- Anexar documentos de suporte (PDF, DOC, DOCX)
- Acompanhar o status do projeto em tempo real com barra de progresso
- Receber notificações quando o avaliador tomar uma decisão
- Responder a solicitações de ajuste e reenviar o projeto para nova avaliação

### Para o Professor / Avaliador
- Visualizar fila de projetos pendentes e assumir a avaliação
- Emitir parecer com opinião técnica, feedback e decisão fundamentada
- Aprovar, reprovar ou solicitar ajustes com justificativa obrigatória
- Consultar estatísticas dos projetos avaliados

### Geral
- Autenticação separada por perfil (aluno / professor)
- Central de notificações com histórico de atividades
- Página de perfil com dados acadêmicos do usuário
- Interface responsiva para desktop e dispositivos móveis

---

## Fluxo de um Projeto

```
[Aluno cria rascunho]
        ↓
[Aluno preenche detalhes e anexa documentos]
        ↓
[Aluno submete para avaliação]
        ↓
[Professor assume o projeto e inicia análise]
        ↓
        ├── Aprovado ✓
        ├── Reprovado ✗
        └── Ajustes Solicitados → Aluno corrige → Resubmete
```

Cada etapa gera uma entrada no histórico do projeto e uma notificação para o usuário envolvido.

---

## Tecnologias

O projeto é uma aplicação full-stack em TypeScript com frontend SPA e backend REST, compartilhando tipos entre as duas camadas.

### Frontend
| Tecnologia | Papel |
|---|---|
| React 18 + TypeScript | Interface e tipagem estática |
| Vite | Bundler e servidor de desenvolvimento |
| Tailwind CSS + shadcn/ui | Estilização e componentes de UI |
| React Router DOM v6 | Roteamento client-side |
| TanStack React Query | Cache e gerenciamento de estado assíncrono |
| React Hook Form + Zod | Formulários com validação em runtime |
| Sonner | Notificações toast |
| Framer Motion | Animações de interface |

### Backend
| Tecnologia | Papel |
|---|---|
| Node.js + Express 5 | Servidor HTTP e roteamento de API |
| Better-SQLite3 | Banco de dados SQLite embutido (zero configuração) |
| JWT + bcryptjs | Autenticação stateless e hash de senhas |
| Helmet | Headers de segurança HTTP (CSP, HSTS etc.) |
| express-rate-limit | Proteção contra força bruta |
| Multer | Upload e validação de arquivos |
| Zod | Validação e parsing de payloads no servidor |

---

## Pré-requisitos

- **Node.js** >= 18
- **pnpm** >= 10 — recomendado por ser o gerenciador configurado no projeto

---

## Instalação e Execução

```bash
# Clone o repositório
git clone https://github.com/vinicius-lourencon/APIO-SSP.git
cd APIO-SSP

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento (frontend + backend juntos)
pnpm dev
```

A aplicação estará disponível em `http://localhost:8080`.

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Desenvolvimento com hot-reload |
| `pnpm build` | Build de produção (client + server) |
| `pnpm start` | Inicia o servidor em modo produção |
| `pnpm test` | Testes com Vitest |
| `pnpm typecheck` | Verificação de tipos TypeScript |
| `pnpm format.fix` | Formatação com Prettier |

---

## Estrutura do Projeto

```
APIO-SSP/
├── client/                  # SPA React
│   ├── components/
│   │   ├── layout/          # Header com navegação e notificações
│   │   └── ui/              # Componentes base (shadcn/ui)
│   ├── contexts/            # AuthContext (estado global do usuário)
│   ├── lib/                 # Cliente HTTP tipado
│   └── pages/               # Telas da aplicação
│       ├── Login.tsx
│       ├── MyProjects.tsx   # Área do aluno
│       ├── Index.tsx        # Criação/edição de projeto (etapa 1)
│       ├── GeneralInfo.tsx  # Criação/edição de projeto (etapa 2)
│       ├── ProjectDetail.tsx
│       ├── Avaliador.tsx    # Área do professor
│       ├── AvaliacaoForm.tsx
│       ├── NotificacoesPage.tsx
│       └── Profile.tsx
│
├── server/                  # API REST Express
│   ├── db/                  # Schema e inicialização do SQLite
│   ├── lib/                 # Utilitários internos (helpers de history/notif.)
│   ├── middleware/          # Auth JWT, validação Zod, sanitização
│   └── routes/              # Controladores por recurso
│
├── shared/                  # Tipos e constantes usados por client e server
│   └── api.ts               # Project, User, Evaluation, status labels...
│
└── index.html
```

---

## Segurança

- Senhas armazenadas com **bcrypt** (hash + salt automático)
- Tokens **JWT** com expiração de 8 horas
- Rate limiting de 20 requisições / 15 min nas rotas de autenticação
- Headers HTTP de segurança configurados via **Helmet**
- CORS restrito às origens permitidas por ambiente
- Todos os campos de texto sanitizados contra XSS antes de persistir
- Validação de tipo de arquivo e tamanho máximo no upload (25 MB)
- Prevenção de path traversal no download de arquivos

---

## Sobre o Projeto Acadêmico

| | |
|---|---|
| **Instituição** | Instituto Federal de Mato Grosso do Sul — IFMS |
| **Curso** | Tecnologia em Análise e Desenvolvimento de Sistemas (TADS) |
| **Disciplina** | Aplicações Para Internet com Orientação a Objetos (APIO) |
| **Período** | 4º Semestre |

---

## Desenvolvido por

| Nome | GitHub |
|---|---|
| Nicolas Wolf | [@Flowzinnn](https://github.com/Flowzinnn) |
| Vinicius Antonio Lourençon | [@vinicius-lourencon](https://github.com/vinicius-lourencon) |
| Ryan Lopes Hadas | [@ryanhadas](https://github.com/ryanhadas) |

---

*Projeto desenvolvido para fins acadêmicos — IFMS, 2025.*
