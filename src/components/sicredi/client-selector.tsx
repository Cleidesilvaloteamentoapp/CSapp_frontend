"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, ChevronsUpDown, Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import type { ClientResponse, PaginatedResponse } from "@/types";

interface ClientSelectorProps {
  value: string | null;
  onChange: (clientId: string, clientData: ClientResponse) => void;
  onCreateNew: () => void;
}

export function ClientSelector({ value, onChange, onCreateNew }: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadClients = useCallback(async (searchTerm: string = "") => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ page: "1", per_page: "50" });
      if (searchTerm) params.set("search", searchTerm);

      const data = await api.get<PaginatedResponse<ClientResponse>>(
        `/admin/clients?${params}`
      );
      setClients(data.items || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setClients([]);
      if (error instanceof ApiError) {
        setLoadError(
          typeof error.detail === "string" ? error.detail : "Erro ao buscar clientes"
        );
      } else {
        setLoadError("Erro de conexão");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadClients("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (value && clients.length > 0) {
      const client = clients.find((c) => c.id === value);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [value, clients]);

  // Debounce search so we don't hit the API on every keystroke.
  const handleSearch = useCallback((searchValue: string) => {
    setSearch(searchValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadClients(searchValue);
    }, 300);
  }, [loadClients]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSelect = (client: ClientResponse) => {
    setSelectedClient(client);
    onChange(client.id, client);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedClient ? (
              <span className="truncate">
                {selectedClient.full_name} - {selectedClient.cpf_cnpj}
              </span>
            ) : (
              "Selecione um cliente..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar cliente por nome, CPF/CNPJ..."
              value={search}
              onValueChange={handleSearch}
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                </div>
              ) : loadError ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive text-center px-4">{loadError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadClients(search)}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">Nenhum cliente encontrado</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setOpen(false);
                          onCreateNew();
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Cadastrar Novo Cliente
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.id}
                        onSelect={() => handleSelect(client)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === client.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{client.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.cpf_cnpj} • {client.email}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        onClick={onCreateNew}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Cadastrar Novo Cliente
      </Button>
    </div>
  );
}
