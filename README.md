# Sistema Imobiliária - PWA Frontend

Sistema de gestão para corretora de loteamentos desenvolvido com Next.js 14+, TypeScript, e funcionalidades PWA completas.

## 🚀 Tecnologias

- **Next.js 14+** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes UI
- **Zustand** - Gerenciamento de estado
- **TanStack Query** - Cache e fetching de dados
- **React Hook Form + Zod** - Formulários e validação
- **Supabase Auth** - Autenticação
- **Recharts** - Gráficos
- **next-pwa** - Progressive Web App

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (páginas)
│   ├── (admin)/           # Área administrativa
│   ├── (auth)/            # Autenticação
│   ├── (client)/          # Área do cliente
│   └── layout.tsx         # Layout raiz
├── components/            # Componentes React
│   ├── admin/            # Componentes admin
│   ├── client/           # Componentes cliente
│   ├── pwa/              # Componentes PWA
│   ├── shared/           # Componentes compartilhados
│   └── ui/               # Componentes shadcn/ui
├── hooks/                 # Custom hooks
├── lib/                   # Utilitários e configurações
├── store/                 # Stores Zustand
├── styles/               # Estilos globais
└── types/                # Tipos TypeScript
```

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm start
```

## ⚙️ Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

## 📱 Funcionalidades PWA

- **Instalável** - Pode ser instalado como app nativo
- **Offline First** - Funciona sem conexão
- **Cache Inteligente** - Estratégias de cache Workbox
- **Sincronização** - Sincroniza dados quando online
- **Notificações** - Atualizações disponíveis

## 👥 Tipos de Usuário

### Admin
- Dashboard com métricas
- Gestão de clientes
- Gestão de lotes
- Controle financeiro
- Ordens de serviço
- Configurações

### Cliente
- Dashboard pessoal
- Visualização de boletos
- Solicitação de serviços
- Documentos
- Sistema de indicações

## 🔒 Segurança

- RLS (Row Level Security) no Supabase
- Autenticação JWT
- Validação de dados com Zod
- Sanitização de inputs
- HTTPS obrigatório em produção

## 📝 Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run start    # Iniciar produção
npm run lint     # Verificar linting
npm run format   # Formatar código
```

## 🧪 Checklist de Teste

- [ ] Login funciona offline (cache)
- [ ] Dados são salvos localmente
- [ ] Sincronização ao reconectar
- [ ] Install prompt aparece
- [ ] App funciona como instalado
- [ ] Notificação de atualização

## 📄 Licença

Projeto privado - Todos os direitos reservados.
