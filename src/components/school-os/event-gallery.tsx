"use client";

import * as React from "react";
import { Upload, X, ImageIcon, Loader2, Maximize2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getEventPhotos, uploadEventPhotos, deleteEventPhoto } from "@/lib/api/events";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EventGalleryProps {
  eventId: number;
  isAdmin: boolean;
  eventStatus: string;
}

export function EventGallery({ eventId, isAdmin, eventStatus }: EventGalleryProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const fetchPhotos = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEventPhotos(eventId);
      setPhotos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load photos:", err);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    if (fileArray.length > 10) {
      toast({
        title: "Too many files",
        description: "You can upload up to 10 photos at once.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await uploadEventPhotos(eventId, fileArray);
      toast({
        title: "Photos Uploaded",
        description: `${fileArray.length} photo${fileArray.length > 1 ? "s" : ""} uploaded successfully.`,
      });
      await fetchPhotos();
    } catch {
      toast({
        title: "Upload Failed",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEventPhoto(deleteTarget.id || deleteTarget.photo_id);
      toast({ title: "Photo Deleted", description: "The photo has been removed." });
      setDeleteTarget(null);
      // If we deleted the current lightbox image, close the lightbox
      if (lightboxIndex !== null) setLightboxIndex(null);
      await fetchPhotos();
    } catch {
      toast({ title: "Error", description: "Failed to delete photo.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : photos.length - 1));
  const nextPhoto = () => setLightboxIndex(i => (i !== null && i < photos.length - 1 ? i + 1 : 0));

  // Keyboard navigation for lightbox
  React.useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevPhoto();
      else if (e.key === "ArrowRight") nextPhoto();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs font-medium text-muted-foreground">Loading gallery...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Upload Section — Admin Only */}
      {isAdmin && (
        <label
          className={cn(
            "flex flex-col items-center justify-center gap-2 py-6 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all select-none",
            uploading
              ? "border-slate-200 bg-slate-50 pointer-events-none opacity-60"
              : "border-slate-200 bg-slate-50/50 hover:border-primary hover:bg-primary/5"
          )}
        >
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800">
              {uploading ? "Uploading..." : "Upload Event Photos"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Up to 10 images at once · JPG, PNG, WEBP</p>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 border rounded-xl bg-muted/10">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <h4 className="text-sm font-semibold text-slate-700">No photos yet</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
              {isAdmin
                ? "Upload photos to create a gallery for this event."
                : "Photos will appear here once an administrator uploads them."}
            </p>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {photos.length} photo{photos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo: any, index: number) => (
              <div
                key={photo.id ?? photo.photo_id ?? index}
                className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={photo.photo_url}
                  alt={`Event photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Maximize2 className="h-4 w-4 text-white" />
                  </div>
                  {isAdmin && (
                    <button
                      className="h-8 w-8 rounded-full bg-destructive/90 flex items-center justify-center hover:bg-destructive transition-colors"
                      onClick={e => {
                        e.stopPropagation();
                        setDeleteTarget(photo);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={open => { if (!open) closeLightbox(); }}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-fit p-0 border-none bg-black/95 shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {lightboxIndex !== null && photos[lightboxIndex] && (
            <div className="relative flex items-center justify-center min-h-[300px]">
              <img
                src={photos[lightboxIndex].photo_url}
                alt={`Photo ${lightboxIndex + 1} of ${photos.length}`}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
              />
              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                onClick={closeLightbox}
              >
                <X className="h-4 w-4" />
              </Button>
              {/* Prev */}
              {photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  onClick={e => { e.stopPropagation(); prevPhoto(); }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              {/* Next */}
              {photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  onClick={e => { e.stopPropagation(); nextPhoto(); }}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
              {/* Counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                {lightboxIndex + 1} / {photos.length}
              </div>
              {/* Admin Delete from lightbox */}
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute bottom-3 right-3 h-7 text-xs rounded-lg gap-1"
                  onClick={e => { e.stopPropagation(); setDeleteTarget(photos[lightboxIndex!]); }}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The photo will be permanently removed from the gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete Photo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
