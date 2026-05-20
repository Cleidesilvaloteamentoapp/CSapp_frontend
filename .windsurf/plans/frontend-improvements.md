# Plano: Melhorias Frontend e Correções

## 1. Botão Voltar em Todas as Telas (Mobile)
- Adicionar botão `ArrowLeft` no header mobile dos layouts `admin`, `staff` e `portal`
- Usar `router.back()` para navegação
- Posicionar ao lado do `SidebarTrigger` sem sobrepor conteúdo
- Arquivos: `src/components/layout/admin-sidebar.tsx`, `staff-sidebar.tsx`, `portal-sidebar.tsx` ou headers dos layouts

## 2. Cards Clicáveis nos Dashboards
- **Admin**: Cards (Clientes Ativos → `/admin/clients`, Lotes → `/admin/developments`, Boletos Pendentes → `/admin/sicredi`, etc.)
- **Portal**: Cards (Meus Lotes → `/portal/lotes`, Boletos Pendentes → `/portal/boletos`)
- Envolver cards com `Link` ou usar `onClick` + `router.push`
- Arquivos: `src/app/admin/dashboard/page.tsx`, `src/app/portal/dashboard/page.tsx`

## 3. Toggle de Revelar Senha
- Adicionar botão Eye/EyeOff nos campos de senha que ainda não possuem:
  - `src/components/shared/client-portal-access-dialog.tsx` (senha + confirmação)
  - `src/app/admin/clients/client-form-dialog.tsx` (senha ao criar acesso)
- Já implementado em: login, change-password-dialog (não mexer)

## 4. Corrigir Busca de Cliente no Wizard
- **Bug**: `client-selector.tsx` usa cmdk `CommandItem` com `value={client.id}` (UUID). A filtragem interna do cmdk filtra por `value`, não encontra nomes digitados.
- **Fix**: Desabilitar o filtro interno do cmdk (`filter` prop no `Command`) ou setar `value` para o nome do cliente concatenado com ID.
- Arquivo: `src/components/sicredi/client-selector.tsx`

## 5. Desvincular/Alterar Lote no Wizard
- No `step-imovel.tsx`, ao carregar, verificar se o cliente já tem lotes vinculados
- Mostrar seção "Lotes Vinculados" com opção de desvincular (chamar API DELETE) ou prosseguir vinculando novo lote
- Arquivo: `src/app/admin/cadastro/_components/step-imovel.tsx`

## 6. Exibir Total Real de Parcelas
- Na section de boletos (`step-boletos.tsx`), garantir que `totalInstallments` reflita o total real do contrato (ex: 120), não apenas o ciclo (12)
- O `durationMonths` é o ciclo (máx 12), e `totalInstallments` já vem do `clientLot.total_installments`
- Verificar se o valor está chegando corretamente e exibindo no card de confirmação
- Arquivo: `src/app/admin/cadastro/_components/step-boletos.tsx`

---

## Ordem de Execução
1. Busca de cliente (bug crítico)
2. Botão voltar (UX mobile)
3. Revelar senha
4. Dashboard cards clicáveis
5. Lote existente no wizard
6. Total parcelas
