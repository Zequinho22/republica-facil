# República Fácil

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111827)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=ffffff)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=ffffff)](https://vite.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Ready-FFCA28?style=for-the-badge&logo=firebase&logoColor=111827)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel&logoColor=ffffff)](https://vercel.com/)

**Acesse o sistema:** [https://republica-facil-6zjz.vercel.app/](https://republica-facil-6zjz.vercel.app/)

Sistema web para gestão financeira e organizacional de repúblicas estudantis, construído com React, TypeScript e Vite.

## Visão geral

O República Fácil centraliza despesas, pagamentos, tarefas, avisos, eventos sociais e relatórios em uma única interface. O projeto funciona em modo demo quando o Firebase não está configurado e pode ser conectado a Firebase Authentication, Firestore e Storage para uso real.

## Demonstração

O projeto pode ser executado sem Firebase configurado. Nesse cenário, a aplicação carrega dados demonstrativos para validar navegação, dashboard, despesas, tarefas, eventos sociais e relatórios.

Credenciais de acesso no modo demo:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `zecam@republicafacil.com` | `123456` |

## Capturas de tela

As capturas devem ser adicionadas em `docs/screenshots/` após a publicação ou validação visual da interface.

Sugestão de arquivos:

| Tela | Arquivo sugerido |
| --- | --- |
| Dashboard | `docs/screenshots/dashboard.png` |
| Despesas | `docs/screenshots/despesas.png` |
| Relatórios | `docs/screenshots/relatorios.png` |

## Funcionalidades

- Autenticação com perfis de administrador e morador
- Dashboard com indicadores e gráficos financeiros
- Cadastro, edição e exclusão de despesas
- Controle de pagamentos e comprovantes
- Gestão de tarefas e avisos
- Módulo social com divisão de itens por participante
- Exportação de relatórios em PDF e Excel
- Busca global e notificações de prazos
- Upload e armazenamento de comprovantes no Firebase Storage

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- React Router DOM
- React Hook Form
- Firebase
- jsPDF e jspdf-autotable
- Recharts
- XLSX
- Lucide React

## Requisitos

- Node.js 20 ou superior
- npm

## Execução local

1. Clone o repositório.

```bash
git clone <URL_DO_REPOSITORIO>
cd republica-facil
```

2. Instale as dependências.

```bash
npm install
```

3. Configure o Firebase, se for usar o backend real.

Copie o arquivo `.env.example` para `.env.local` e preencha as variáveis do seu projeto Firebase.

Windows:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```bash
cp .env.example .env.local
```

Se essas variáveis não forem definidas, a aplicação inicia em modo demo com dados simulados.

4. Inicie o ambiente de desenvolvimento.

```bash
npm run dev
```

Abra `http://localhost:5173` no navegador.

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento do Vite |
| `npm run build` | Executa a checagem de tipos e gera a build de produção em `dist/` |
| `npm run preview` | Faz a pré-visualização da build localmente |
| `npm run lint` | Executa o Oxlint |

## Configuração do Firebase

- Authentication: login com e-mail e senha
- Firestore: coleções para `users`, `republics`, `expenses`, `payments`, `tasks`, `announcements` e `socialEvents`
- Storage: upload de comprovantes e anexos
- Sem as variáveis de ambiente do Firebase, o sistema permanece utilizável em modo demo

## Deploy no Vercel

1. Importe o repositório para o Vercel.
2. Adicione as mesmas variáveis de ambiente usadas localmente.
3. Use `npm run build` como comando de build.
4. Use `dist` como diretório de saída.
5. A aplicação já utiliza `HashRouter`, o que mantém a navegação compatível com hospedagem estática no Vercel.

## Estrutura do projeto

```text
src/
  components/
  context/
  data/
  firebase/
  lib/
  pages/
  utils/
  App.tsx
  main.tsx
  types.ts
```

## Observações

- O projeto foi pensado para funcionar tanto em modo demo quanto com Firebase real.
- Relatórios financeiros e sociais são gerados diretamente no navegador.
- A build de produção é gerada com Vite e fica pronta para publicação no Vercel.

## Licença

Este projeto foi desenvolvido para fins acadêmicos e pode ser adaptado conforme as necessidades da equipe responsável.
