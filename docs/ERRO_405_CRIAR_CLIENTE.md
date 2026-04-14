# Erro 405 ao Criar Cliente (POST /admin/clients)

## 🔍 Diagnóstico do Problema

O erro **405 Method Not Allowed** ao tentar criar um cliente através de POST `/admin/clients` indica que:

1. **Backend está correto** ✅
   - Rota POST definida em `/admin/clients`
   - CORS configurado para aceitar todos os métodos
   - Logs do Railway mostram que a requisição NEM CHEGA ao backend

2. **O problema está no proxy do frontend** ❌
   - URL do erro: `https://csappfrontend-production.up.railway.app/api/proxy/admin/clients`
   - O prefixo `/api/proxy/` indica que passa pelo Next.js API Route Handler
   - Erro 405 retorna ANTES de chegar ao backend

## 🛠️ Correções Aplicadas

### 1. Configuração Explícita de Runtime

Adicionado ao `src/app/api/proxy/[...path]/route.ts`:

```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

**Por quê?**
- Garante que o Next.js use runtime Node.js (não Edge)
- Edge runtime tem limitações e pode não suportar todos os métodos HTTP
- `force-dynamic` desabilita cache estático para API routes

### 2. Logging Detalhado

Adicionado logging extensivo em todos os handlers (GET, POST, PUT, PATCH, DELETE):

```typescript
console.log("[Proxy Route] POST handler chamado");
console.log(`[Proxy] Método: ${method}`);
console.log(`[Proxy] URL final: ${url}`);
console.log(`[Proxy] Body enviado (${body.length} bytes):`, body.substring(0, 200));
```

**Benefícios:**
- Diagnosticar se o handler é chamado
- Verificar se a URL está correta
- Confirmar se o body é enviado
- Identificar onde exatamente falha

### 3. Tratamento de Erros Melhorado

```typescript
catch (error) {
  console.error(`[Proxy] ===== ERRO =====`);
  console.error(`[Proxy] URL tentada: ${url}`);
  console.error(`[Proxy] Mensagem de erro:`, error);
  
  return NextResponse.json({
    detail: "Erro de conexão com o backend",
    debug: { url, method, path, error: error.message }
  }, { status: 502 });
}
```

## ⚙️ Configuração do Railway (CRÍTICO)

### Variável de Ambiente Obrigatória

No painel do Railway (frontend), configure:

```bash
NEXT_PUBLIC_API_URL=https://csappbackend-production.up.railway.app/api/v1
```

**⚠️ IMPORTANTE:**
- Sem essa variável, o proxy tenta usar `http://localhost:8000/api/v1` no Railway
- Isso causa erro de conexão (não 405, mas pode gerar comportamentos inesperados)
- A URL DEVE ser a URL pública do backend no Railway

### Como Configurar no Railway

1. Acesse o projeto frontend no Railway
2. Vá em **Variables** (ou Settings > Environment)
3. Adicione a variável:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://csappbackend-production.up.railway.app/api/v1`
4. **Redeploy** o frontend (necessário para aplicar)

## 🧪 Como Testar

### Teste Local

1. **Verifique se o backend está rodando:**
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

2. **Inicie o frontend:**
   ```bash
   npm run dev
   ```

3. **Teste criar cliente via UI:**
   - Login como super admin
   - Admin > Clientes > Novo Cliente
   - Preencha os dados e clique em "Cadastrar"

4. **Verifique os logs no terminal do frontend:**
   ```
   [Proxy Route] Inicializado com BACKEND_URL: http://localhost:8000/api/v1
   [Proxy Route] POST handler chamado
   [Proxy] ===== INÍCIO REQUEST =====
   [Proxy] Método: POST
   [Proxy] URL final: http://localhost:8000/api/v1/admin/clients/
   [Proxy] Body enviado (XX bytes): {"email":"teste@...
   [Proxy] Response POST admin/clients/: 201 Created
   ```

### Teste em Produção (Railway)

1. **Após deploy, acesse os logs do frontend no Railway**

2. **Procure por:**
   ```
   [Proxy Route] Inicializado com BACKEND_URL: https://csappbackend-production.up.railway.app/api/v1
   ```
   
   ❌ Se aparecer `http://localhost:8000/api/v1`, a variável de ambiente NÃO está configurada!

3. **Ao tentar criar cliente, deve aparecer:**
   ```
   [Proxy Route] POST handler chamado
   [Proxy] ===== INÍCIO REQUEST =====
   [Proxy] Método: POST
   [Proxy] URL final: https://csappbackend-production.up.railway.app/api/v1/admin/clients/
   [Proxy] Body enviado...
   [Proxy] Response POST admin/clients/: 201
   ```

## 🚨 Possíveis Causas do Erro 405

### Causa 1: Handler POST Não Registrado no Build
**Sintoma:** Logs não mostram `[Proxy Route] POST handler chamado`

**Solução:**
- Limpar cache do Next.js: `rm -rf .next`
- Rebuild: `npm run build`
- No Railway, force redeploy completo

### Causa 2: Variável de Ambiente Incorreta
**Sintoma:** URL no log mostra `localhost` em produção

**Solução:**
- Configurar `NEXT_PUBLIC_API_URL` no Railway
- Redeploy obrigatório após adicionar variável

### Causa 3: Trailing Slash Inconsistente
**Sintoma:** Backend retorna 307 Redirect ou 405

**Solução:**
- Verificar que `api.ts` adiciona trailing slash (linha 42-48) ✅ Já implementado
- Backend deve aceitar rotas com `/` (FastAPI padrão) ✅ Já correto

### Causa 4: CORS ou Proxy Reverso no Railway
**Sintoma:** Erro 405 mesmo com handlers corretos

**Solução:**
- Verificar se há proxy reverso (nginx, Caddy) na frente do Next.js
- Verificar configurações de CORS no Railway
- Testar chamada direta ao backend (bypass do proxy):

```typescript
// Teste temporário - chamar backend direto
const BACKEND_URL = 'https://csappbackend-production.up.railway.app/api/v1';
const response = await fetch(`${BACKEND_URL}/admin/clients/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

Se funcionar, confirma que o problema está no proxy do Next.js.

## 📋 Checklist de Deploy

Antes de fazer deploy para corrigir o erro 405:

- [ ] Código atualizado com logging e runtime configurado
- [ ] Variável `NEXT_PUBLIC_API_URL` configurada no Railway
- [ ] Cache limpo localmente (`rm -rf .next`)
- [ ] Teste local funcionando (POST retorna 201)
- [ ] Commit e push para o repositório
- [ ] Aguardar build completo no Railway (2-3 minutos)
- [ ] Verificar logs no Railway mostrando URL correta
- [ ] Teste em produção criando um cliente

## 🔄 Próximos Passos

1. **Fazer commit das alterações:**
   ```bash
   git add src/app/api/proxy/[...path]/route.ts docs/ERRO_405_CRIAR_CLIENTE.md
   git commit -m "fix: adiciona runtime nodejs e logging detalhado no proxy para resolver erro 405"
   git push
   ```

2. **Aguardar deploy no Railway**
   - Frontend: ~2-3 minutos
   - Verificar logs durante build

3. **Testar em produção:**
   - Login como super admin
   - Tentar criar cliente
   - Verificar logs no Railway

4. **Se ainda der erro 405:**
   - Copiar logs completos do Railway
   - Verificar se `POST handler chamado` aparece
   - Verificar URL final no log
   - Verificar resposta do backend

## 📞 Suporte

Se o erro persistir após seguir este guia:

1. Capture os logs completos do Railway (frontend)
2. Capture os logs do backend
3. Teste chamada direta ao backend (curl ou Postman)
4. Verifique se há middleware ou configuração customizada no Railway

## 🔗 Referências

- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Next.js Runtime: https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes
- Railway Docs: https://docs.railway.app/
