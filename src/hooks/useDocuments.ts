import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { toast } from 'sonner';

interface DocumentItem {
  path: string;
  url: string;
  type: 'client' | 'lot';
  lot_id?: string;
}

interface DocumentsResponse {
  client_documents: DocumentItem[];
  lot_documents: DocumentItem[];
}

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data } = await clientApi.documents.list();
      return data as DocumentsResponse;
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const { data } = await clientApi.documents.upload(file);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Erro ao enviar documento');
    },
  });
}
