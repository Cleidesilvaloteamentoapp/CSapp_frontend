#!/bin/bash

# Script para testar POST direto ao backend
# Uso: ./scripts/test-backend-post.sh <TOKEN>

set -e

if [ -z "$1" ]; then
  echo "❌ Erro: Token não fornecido"
  echo ""
  echo "Uso: ./scripts/test-backend-post.sh <TOKEN>"
  echo ""
  echo "Obtenha o token fazendo login e copiando do localStorage do browser:"
  echo "  1. Abra DevTools (F12)"
  echo "  2. Console > document.cookie"
  echo "  3. Copie o valor do access_token"
  echo ""
  exit 1
fi

TOKEN="$1"
BACKEND_URL="${BACKEND_URL:-https://csappbackend-production.up.railway.app/api/v1}"

echo "🔍 Testando POST para criar cliente..."
echo "📍 Backend URL: $BACKEND_URL"
echo "🔑 Token (primeiros 20 chars): ${TOKEN:0:20}..."
echo ""

# Dados de teste
PAYLOAD=$(cat <<EOF
{
  "email": "teste-$(date +%s)@exemplo.com",
  "full_name": "Cliente Teste Automático",
  "cpf_cnpj": "$(( ( RANDOM % 90000000000 )  + 10000000000 ))",
  "phone": "11999999999",
  "create_access": false
}
EOF
)

echo "📦 Payload:"
echo "$PAYLOAD" | jq .
echo ""

# Fazer requisição
echo "🚀 Enviando requisição POST..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  "$BACKEND_URL/admin/clients/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Separar body e status
BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo ""
echo "📊 Resultado:"
echo "Status HTTP: $STATUS"
echo ""

if [ "$STATUS" -eq 201 ] || [ "$STATUS" -eq 200 ]; then
  echo "✅ SUCESSO! Cliente criado:"
  echo "$BODY" | jq .
  exit 0
elif [ "$STATUS" -eq 401 ]; then
  echo "❌ ERRO 401: Token inválido ou expirado"
  echo "Resposta:"
  echo "$BODY" | jq .
  exit 1
elif [ "$STATUS" -eq 403 ]; then
  echo "❌ ERRO 403: Sem permissão para criar clientes"
  echo "Resposta:"
  echo "$BODY" | jq .
  exit 1
elif [ "$STATUS" -eq 405 ]; then
  echo "❌ ERRO 405: Método não permitido"
  echo "⚠️  ESTE É O ERRO QUE ESTAMOS INVESTIGANDO!"
  echo "Resposta:"
  echo "$BODY" | jq . || echo "$BODY"
  echo ""
  echo "Se este erro ocorre ao chamar DIRETO o backend, então:"
  echo "  1. O problema está no backend (não no proxy)"
  echo "  2. Verifique se a rota POST está registrada no FastAPI"
  echo ""
  exit 1
elif [ "$STATUS" -eq 409 ]; then
  echo "⚠️  CONFLITO: CPF/Email já cadastrado"
  echo "Resposta:"
  echo "$BODY" | jq .
  echo ""
  echo "ℹ️  Isso é esperado se o cliente já existe. Não é um erro!"
  exit 0
elif [ "$STATUS" -eq 422 ]; then
  echo "❌ ERRO 422: Dados inválidos"
  echo "Resposta:"
  echo "$BODY" | jq .
  exit 1
else
  echo "❌ ERRO $STATUS"
  echo "Resposta:"
  echo "$BODY" | jq . || echo "$BODY"
  exit 1
fi
