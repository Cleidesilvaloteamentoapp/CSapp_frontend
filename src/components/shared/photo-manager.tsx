"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Star, Trash2, Eye, EyeOff, Upload, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import type { Photo } from "@/types";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

interface PhotoManagerProps {
  /** Backend base path of the owning entity, e.g. "/admin/developments/<id>" or "/admin/lots/<id>". */
  basePath: string;
  photos: Photo[];
  onChange?: (photos: Photo[]) => void;
}

/**
 * Gallery editor for a development/lot: upload photos, choose the primary one,
 * and toggle which photos are exposed to the client portal.
 */
export function PhotoManager({ basePath, photos: initialPhotos, onChange }: PhotoManagerProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos ?? []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newVisible, setNewVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function update(next: Photo[]) {
    setPhotos(next);
    onChange?.(next);
  }

  function handleFileSelect(file: File | null) {
    if (file && file.size > MAX_PHOTO_BYTES) {
      toast.error(`Imagem muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 10MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Selecione uma imagem");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("is_primary", String(photos.length === 0));
      formData.append("visible_to_client", String(newVisible));
      const res = await api.post<{ photos: Photo[] }>(`${basePath}/photos`, formData);
      update(res.photos);
      toast.success("Foto adicionada");
      setSelectedFile(null);
      setNewVisible(false);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      toast.error(error instanceof ApiError && typeof error.detail === "string" ? error.detail : "Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  }

  async function setPrimary(photo: Photo) {
    if (photo.is_primary) return;
    setBusyId(photo.id);
    try {
      const res = await api.patch<{ photos: Photo[] }>(`${basePath}/photos/${photo.id}`, { is_primary: true });
      update(res.photos);
    } catch {
      toast.error("Erro ao definir foto principal");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleVisible(photo: Photo) {
    setBusyId(photo.id);
    try {
      const res = await api.patch<{ photos: Photo[] }>(`${basePath}/photos/${photo.id}`, {
        visible_to_client: !photo.visible_to_client,
      });
      update(res.photos);
    } catch {
      toast.error("Erro ao atualizar visibilidade");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(photo: Photo) {
    setBusyId(photo.id);
    try {
      const res = await api.delete<{ photos: Photo[] }>(`${basePath}/photos/${photo.id}`);
      update(res.photos);
      toast.success("Foto removida");
    } catch {
      toast.error("Erro ao remover foto");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload */}
      <div className="rounded-md border p-3 space-y-3">
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          disabled={uploading}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Switch id="new-photo-visible" checked={newVisible} onCheckedChange={setNewVisible} disabled={uploading} />
            <Label htmlFor="new-photo-visible" className="flex items-center gap-1 text-xs">
              {newVisible ? <Eye className="h-3.5 w-3.5 text-green-600" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
              Mostrar ao cliente
            </Label>
          </div>
          <Button type="button" size="sm" onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : <><Upload className="mr-2 h-4 w-4" />Adicionar foto</>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          A primeira foto vira a principal automaticamente. Máximo 10MB (JPG, PNG, WEBP).
        </p>
      </div>

      {/* Gallery */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-8 text-center">
          <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma foto cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url ?? ""} alt={photo.caption ?? "Foto"} className="h-28 w-full object-cover" />

              {/* Badges */}
              <div className="absolute left-1 top-1 flex flex-col gap-1">
                {photo.is_primary && (
                  <Badge className="gap-1 bg-amber-500 text-white text-[10px] hover:bg-amber-500">
                    <Star className="h-3 w-3 fill-white" /> Principal
                  </Badge>
                )}
                {photo.visible_to_client && (
                  <Badge className="gap-1 bg-green-600 text-white text-[10px] hover:bg-green-600">
                    <Eye className="h-3 w-3" /> Cliente
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-around bg-black/55 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                {busyId === photo.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <>
                    <button type="button" title="Definir como principal" onClick={() => setPrimary(photo)} className="text-white hover:text-amber-300">
                      <Star className={`h-4 w-4 ${photo.is_primary ? "fill-amber-300 text-amber-300" : ""}`} />
                    </button>
                    <button type="button" title={photo.visible_to_client ? "Ocultar do cliente" : "Mostrar ao cliente"} onClick={() => toggleVisible(photo)} className="text-white hover:text-green-300">
                      {photo.visible_to_client ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button type="button" title="Remover" onClick={() => remove(photo)} className="text-white hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
