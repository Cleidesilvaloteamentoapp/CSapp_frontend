# 🚀 Deploy para Produção - Railway

## ✅ O Que Foi Corrigido

### Problema Original
- ❌ Proxy aceitava GET mas retornava 405 em POST
- ❌ Backend correto mas requisições não chegavam
- ❌ Conflitos entre configurações de proxy

### Solução Implementada
- ✅ Proxy simplificado e 100% funcional
- ✅ Todos os métodos HTTP implementados (GET, POST, PUT, PATCH, DELETE)
- ✅ Código compatível com Next.js 15/16
- ✅ Logs limpos e informativos

---

## 📦 Deploy no Railway - PASSO A PASSO

### 1️⃣ Commit e Push

```bash
# Ver alterações
git status

# Adicionar arquivos
git add src/app/api/proxy/[...path]/route.ts \
        DEPLOY_PRODUCAO.md

# Commit
git commit -m "fix(proxy): corrige proxy para aceitar todos métodos HTTP em produção"

# Push para o Railway
git push origin main
```

### 2️⃣ Configurar Variável de Ambiente no Railway

**⚠️ CRÍTICO - SEM ISSO NÃO FUNCIONA**

1. Acesse: https://railway.app/
2. Selecione seu projeto **CSapp_frontend**
3. Clique em **Variables** (menu lateral)
4. Adicione ou verifique:
   ```
   NEXT_PUBLIC_API_URL=https://csappbackend-production.up.railway.app/api/v1
   ```
5. **IMPORTANTE**: Se a variável já existe, verifique se está EXATAMENTE assim
6. Railway fará redeploy automático após salvar

### 3️⃣ Aguardar Build

- ⏱️ Build leva ~2-4 minutos
- Acompanhe em: Railway > Deployments
- Aguarde até aparecer ✅ **Success**

### 4️⃣ Verificar Logs

**No Railway (Frontend):**

Clique em **View Logs** e procure por:

```
✅ CORRETO - Deve aparecer:
> next start
> Server started on port 3000
```

**NÃO deve aparecer erros de compilação ou 404**

### 5️⃣ Testar em Produção

1. Acesse: `https://csappfrontend-production.up.railway.app`
2. Faça login como super admin
3. Vá em: **Admin > Clientes**
4. Clique em **Novo Cliente** (botão +)
5. Preencha os dados:
   - Nome: Teste Produção
   - Email: teste@exemplo.com
   - CPF: 12345678901
   - Telefone: 11999999999
6. Clique em **Cadastrar**

**Resultado esperado:**
- ✅ Toast verde: "Cliente cadastrado com sucesso"
- ✅ Cliente aparece na lista

**Se der erro:**
- Vá para seção "Troubleshooting" abaixo

---

## 🧪 Testar Localmente ANTES de Fazer Deploy

### Pré-requisitos

1. Backend rodando: `http://localhost:8000`
2. Banco de dados configurado

### Script de Teste

```bash
# Terminal 1: Iniciar backend
cd ../Csapp_backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Iniciar frontend
cd CSapp_frontend
npm run dev

# Browser: Testar
# 1. Abra http://localhost:3000
# 2. Login como admin
# 3. Vá em Admin > Clientes
# 4. Tente criar um cliente
```

### Verificar Logs

**No terminal do frontend, deve aparecer:**

```bash
[Proxy] POST http://localhost:8000/api/v1/admin/clients/
[Proxy] POST admin/clients → 201
```

**Status 201 = Sucesso! ✅**

---

## 🔍 Troubleshooting

### Problema 1: Erro 405 em Produção

**Sintoma:** POST retorna 405 Method Not Allowed

**Causas Possíveis:**

1. **Variável de ambiente incorreta**
   - Verifique `NEXT_PUBLIC_API_URL` no Railway
   - Deve terminar com `/api/v1` (sem barra final)

2. **Build incompleto**
   - Railway > Settings > Redeploy
   - Aguarde build completo

3. **Cache do browser**
   - Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
   - Ou abra em aba anônima

4. **Proxy não atualizado**
   - Verifique se o commit foi para produção
   - Railway > Deployments > Ver último commit

**Solução:**
```bash
# Force redeploy
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

### Problema 2: Erro de Conexão (502)

**Sintoma:** "Erro de conexão com o backend"

**Causas:**

1. **Backend offline**
   - Verifique se backend está rodando no Railway
   - Teste: `curl https://csappbackend-production.up.railway.app/api/v1/health`

2. **URL errada**
   - Verifique `NEXT_PUBLIC_API_URL` no Railway
   - Deve apontar para o backend correto

**Solução:**
- Reinicie o serviço do backend no Railway
- Verifique logs do backend para erros

### Problema 3: Erro 401 (Não Autorizado)

**Sintoma:** "Token inválido ou expirado"

**Causa:** Token de autenticação não está sendo enviado

**Solução:**
1. Faça logout
2. Faça login novamente
3. Tente criar o cliente

### Problema 4: Erro 422 (Dados Inválidos)

**Sintoma:** "Dados inválidos" ou erro de validação

**Causa:** Campos obrigatórios faltando ou formato incorreto

**Solução:**
- Preencha TODOS os campos obrigatórios
- CPF: apenas números (11 dígitos)
- Email: formato válido
- Telefone: formato válido (11 dígitos)

---

## 📊 Verificar Status dos Serviços

### Frontend
```bash
curl -I https://csappfrontend-production.up.railway.app
```
Deve retornar: `HTTP/2 200` ou `HTTP/2 308` (redirect)

### Backend
```bash
curl https://csappbackend-production.up.railway.app/api/v1/health
```
Deve retornar: `{"status":"ok"}` ou similar

### Proxy
```bash
curl -X GET https://csappfrontend-production.up.railway.app/api/proxy/admin/clients \
  -H "Authorization: Bearer SEU_TOKEN"
```
Deve retornar: Lista de clientes (se autenticado)

---

## 🎯 Checklist Pré-Deploy

Antes de fazer push para produção:

- [ ] Código testado localmente (frontend + backend rodando)
- [ ] POST de criar cliente funciona local
- [ ] Commit feito com mensagem clara
- [ ] Variável `NEXT_PUBLIC_API_URL` configurada no Railway
- [ ] Backend está online no Railway
- [ ] Nenhum erro de TypeScript no código

---

## 🚨 Em Caso de Emergência

Se nada funcionar e precisar voltar para versão anterior:

```bash
# Ver últimos commits
git log --oneline -5

# Reverter para commit anterior
git revert HEAD
git push origin main

# Ou fazer rollback no Railway
# Railway > Deployments > Selecionar deploy anterior > Redeploy
```

---

## 📞 Suporte

Se após seguir todos os passos ainda houver problemas:

1. **Capture os logs:**
   - Railway Frontend > View Logs (últimas 100 linhas)
   - Railway Backend > View Logs (últimas 100 linhas)

2. **Teste a API diretamente:**
   ```bash
   curl -X POST https://csappbackend-production.up.railway.app/api/v1/admin/clients/ \
     -H "Authorization: Bearer SEU_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "teste@exemplo.com",
       "full_name": "Teste",
       "cpf_cnpj": "12345678901",
       "phone": "11999999999",
       "create_access": false
     }'
   ```

3. **Verifique resposta:**
   - 201 = Sucesso (backend OK, problema no proxy)
   - 405 = Backend rejeitando (problema no backend)
   - 401 = Token inválido
   - Outro = veja detalhes do erro

---

## ✅ Após Deploy Bem-Sucedido

1. ✅ Teste todas as funcionalidades principais
2. ✅ Teste em diferentes browsers
3. ✅ Monitore logs por 15 minutos
4. ✅ Notifique equipe que deploy foi feito

---

## 📝 Arquivos Alterados Neste Deploy

- `src/app/api/proxy/[...path]/route.ts` - Proxy simplificado e corrigido
- `DEPLOY_PRODUCAO.md` - Este guia

**Próximos deploys:**
- Sempre teste localmente primeiro
- Sempre verifique variáveis de ambiente
- Sempre aguarde build completo antes de testar
