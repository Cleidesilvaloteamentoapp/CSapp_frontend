'use client';

import { useState } from 'react';
import { useDocuments, useUploadDocument } from '@/hooks/useDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/shared/Loading';
import { ErrorMessage } from '@/components/shared/ErrorBoundary';
import { FileText, Upload, Download, File, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

export default function ClientDocumentsPage() {
  const { data: documents, isLoading, error, refetch } = useDocuments();
  const uploadDocument = useUploadDocument();
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      for (const file of acceptedFiles) {
        await uploadDocument.mutateAsync(file);
      }
      toast.success('Documento(s) enviado(s) com sucesso!');
    } catch (err) {
      toast.error('Erro ao enviar documento');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const getFileIcon = (path: string) => {
    if (path.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <File className="h-8 w-8 text-red-500" />;
  };

  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar documentos" onRetry={refetch} />;
  }

  const allDocuments = [
    ...(documents?.client_documents || []),
    ...(documents?.lot_documents || []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
        <p className="text-muted-foreground">
          Acesse e gerencie seus documentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enviar Documento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-primary font-medium">Solte os arquivos aqui...</p>
            ) : (
              <>
                <p className="font-medium">Arraste arquivos ou clique para selecionar</p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, PNG, JPG (máx. 10MB)
                </p>
              </>
            )}
            {isUploading && (
              <p className="text-sm text-primary mt-2">Enviando...</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meus Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum documento encontrado
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allDocuments.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {getFileIcon(doc.path)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{getFileName(doc.path)}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.type === 'lot' ? 'Documento do Lote' : 'Documento Pessoal'}
                    </p>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
