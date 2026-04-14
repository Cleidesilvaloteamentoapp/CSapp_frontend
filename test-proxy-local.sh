#!/bin/bash

echo "🧪 Testando Proxy Localmente..."
echo ""

# Verificar se servidor está rodando
echo "1️⃣ Verificando se Next.js está rodando..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend rodando em http://localhost:3000"
else
    echo "❌ Frontend NÃO está rodando!"
    echo "   Execute: npm run dev"
    exit 1
fi

echo ""
echo "2️⃣ Testando handlers do proxy..."

# Teste GET
echo -n "   GET:    "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/proxy/admin/clients)
echo "$STATUS (esperado: 200, 401 ou 502)"

# Teste POST
echo -n "   POST:   "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/proxy/admin/clients)
if [ "$STATUS" = "405" ]; then
    echo "❌ 405 - POST NÃO FUNCIONA!"
else
    echo "$STATUS (OK se não for 405)"
fi

# Teste PUT
echo -n "   PUT:    "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT http://localhost:3000/api/proxy/admin/clients/test)
if [ "$STATUS" = "405" ]; then
    echo "❌ 405 - PUT NÃO FUNCIONA!"
else
    echo "$STATUS (OK se não for 405)"
fi

# Teste DELETE
echo -n "   DELETE: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:3000/api/proxy/admin/clients/test)
if [ "$STATUS" = "405" ]; then
    echo "❌ 405 - DELETE NÃO FUNCIONA!"
else
    echo "$STATUS (OK se não for 405)"
fi

echo ""
echo "✅ Se nenhum método retornou 405, o proxy está funcionando!"
echo "🚀 Pode fazer deploy para produção"
