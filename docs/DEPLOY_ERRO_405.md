# Deploy - Correção Erro 405 ao Criar Cliente

## 📋 Resumo das Alterações

### Arquivos Modificados

1. **`src/app/api/proxy/[...path]/route.ts`**
   - ✅ Adicionado `export const runtime = "nodejs"`
   - ✅ Adicionado `export const dynamic = "force-dynamic"`
   - ✅ Logging detalhado em todos os handlers (GET, POST, PUT, PATCH, DELETE)
   - ✅ Melhor tratamento de erros com debug info

2. **`src/middleware.ts`**
   - ✅ CSP atualizado para aceitar conexões ao backend em produção
   - ✅ `connect-src` agora inclui o domínio do backend dinamicamente

3. **`scripts/test-backend-post.sh`** (novo)
   - ✅ Script para testar POST direto ao backend
   - ✅ Útil para diagnosticar se o erro está no backend ou proxy

4. **`docs/ERRO_405_CRIAR_CLIENTE.md`** (novo)
   - ✅ Documentação completa do problema
   - ✅ Guia de diagnóstico e solução
   - ✅ Checklist de deploy

## 🚀 Passos para Deploy

### 1. Verificar Alterações Localmente

```bash
# Ver arquivos modificados
git status

# Ver diff das alterações
git diff src/app/api/proxy/[...path]/route.ts
git diff src/middleware.ts
```

### 2. Commit das Alterações

```bash
git add src/app/api/proxy/[...path]/route.ts \
        src/middleware.ts \
        scripts/test-backend-post.sh \
        docs/ERRO_405_CRIAR_CLIENTE.md \
        docs/DEPLOY_ERRO_405.md

git commit -m "fix(proxy): adiciona runtime nodejs e logging detalhado para resolver erro 405

- Configura runtime explicitamente como nodejs (evita edge runtime)
- Adiciona logging detalhado em todos os métodos HTTP
- Melhora tratamento de erros com informações de debug
- Atualiza CSP para aceitar conexões ao backend em produção
- Adiciona script de teste direto ao backend
- Documenta solução completa do erro 405"

git push origin main
```

### 3. Configurar Railway (CRÍTICO)

**⚠️ AÇÃO OBRIGATÓRIA NO PAINEL DO RAILWAY**

#### Frontend (CSapp_frontend):

1. Acesse: https://railway.app/project/[SEU_PROJETO]/service/[FRONTEND]
2. Clique em **Variables** (menu lateral)
3. Adicione ou verifique:
   ```
   NEXT_PUBLIC_API_URL=https://csappbackend-production.up.railway.app/api/v1
   ```
4. Clique em **Add** ou **Save**
5. **Railway fará redeploy automático** 🚀

#### Verificar Variável no Backend (opcional):

Certifique-se que o backend também tem as variáveis corretas (CORS, etc).

### 4. Aguardar Deploy

```
⏳ Aguarde 2-4 minutos para build completo
```

Acompanhe em: Railway Dashboard > Deployments

### 5. Verificar Logs Após Deploy

**No Railway (Frontend):**

Procure por:
```
[Proxy Route] Inicializado com BACKEND_URL: https://csappbackend-production.up.railway.app/api/v1
```

❌ **Se aparecer `localhost`**, a variável de ambiente NÃO foi aplicada!
- Verifique em Variables
- Force redeploy manual se necessário

### 6. Testar em Produção

1. Acesse: `https://csappfrontend-production.up.railway.app`
2. Login como super admin
3. Admin > Clientes > Novo Cliente
4. Preencha dados e clique em "Cadastrar"

**Logs esperados no Railway (Frontend):**

```
[Proxy Route] POST handler chamado
[Proxy] ===== INÍCIO REQUEST =====
[Proxy] Método: POST
[Proxy] URL final: https://csappbackend-production.up.railway.app/api/v1/admin/clients/
[Proxy] Body enviado (XXX bytes): {"email":"teste@...
[Proxy] Executando fetch para: https://...
[Proxy] Response POST admin/clients/: 201 Created
```

**Se funcionar:**
✅ Cliente criado com sucesso!
✅ Toast verde: "Cliente cadastrado com sucesso"

**Se der erro 405:**
❌ Capture logs completos e veja seção "Diagnóstico Avançado"

## 🧪 Teste Direto no Backend (Opcional)

Para confirmar que o backend está funcionando:

```bash
# Obtenha o token de acesso
# 1. Login no frontend
# 2. Abra DevTools (F12) > Console
# 3. Execute: document.cookie
# 4. Copie o valor do access_token

# Execute o script
./scripts/test-backend-post.sh "SEU_TOKEN_AQUI"
```

**Resultado esperado:**
```
✅ SUCESSO! Cliente criado:
{
  "id": "...",
  "email": "teste-...",
  ...
}
```

**Se der erro 405 aqui:**
- O problema está NO BACKEND, não no proxy
- Verifique rotas no backend
- Verifique se backend foi deployado corretamente

## 🔍 Diagnóstico Avançado

### Problema: Variável de Ambiente Não Aplicada

**Sintoma:**
```
[Proxy Route] Inicializado com BACKEND_URL: http://localhost:8000/api/v1
```

**Solução:**
1. Railway > Variables > Verificar `NEXT_PUBLIC_API_URL`
2. Se a variável está correta mas não aplicou:
   - Railway > Settings > **Redeploy** (botão direito ...)
   - Ou faça um commit vazio: `git commit --allow-empty -m "trigger redeploy"`

### Problema: Handler POST Não Chamado

**Sintoma:**
- Erro 405
- Logs NÃO mostram `[Proxy Route] POST handler chamado`

**Solução:**
1. Limpar cache do Next.js no Railway:
   - Railway > Settings > Add Build Command:
     ```
     rm -rf .next && npm run build
     ```
2. Redeploy completo

### Problema: CSP Bloqueando Conexões

**Sintoma:**
- Console do browser: `Blocked by Content Security Policy`
- Network tab: requisição cancelada

**Solução:**
- Verificar CSP no middleware.ts (já corrigido)
- Verificar se `NEXT_PUBLIC_API_URL` está correta
- Hard reload no browser: Ctrl+Shift+R (ou Cmd+Shift+R no Mac)

### Problema: CORS no Backend

**Sintoma:**
- Console: `CORS policy blocked`
- Request para `/api/proxy/...` funciona
- Request direto ao backend falha

**Solução:**
- Verificar `allow_origins` no backend
- Deve incluir: `https://csappfrontend-production.up.railway.app`

## 📞 Se Nada Funcionar

### Checklist Final

- [ ] Variável `NEXT_PUBLIC_API_URL` configurada no Railway?
- [ ] Deploy completo (build finalizado)?
- [ ] Logs mostram URL correta (não localhost)?
- [ ] Teste direto ao backend funciona?
- [ ] Middleware não está bloqueando `/api/*`?
- [ ] Browser cache limpo (hard reload)?

### Teste de Bypass Temporário

Modifique `src/lib/api.ts` temporariamente:

```typescript
// APENAS PARA TESTE - NÃO COMMITAR!
const API_URL = "https://csappbackend-production.up.railway.app/api/v1";
```

Se funcionar com isso:
- ✅ Confirma que o backend está OK
- ❌ Problema está na configuração do proxy/variáveis de ambiente

## 🎯 Próximos Passos Após Resolver

1. **Remover logs excessivos** (opcional):
   - Manter apenas logs de erro
   - Remover `console.log` de debug

2. **Monitorar performance**:
   - Verificar latência das requisições
   - Considerar cache se necessário

3. **Adicionar testes automatizados**:
   - Teste E2E para criação de cliente
   - CI/CD para validar antes do deploy

## 📚 Referências

- Documentação completa: `docs/ERRO_405_CRIAR_CLIENTE.md`
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Railway Docs: https://docs.railway.app/
