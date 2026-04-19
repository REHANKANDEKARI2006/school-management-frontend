"use client";

import * as React from "react";
import { Upload, X, ImageIcon, Loader2, Maximize2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getEventPhotos, uploadEventPhotos } from "@/lib/api/events";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const fetchPhotos = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEventPhotos(eventId);
      setPhotos(data || []);
    } catch (err) {
      console.error("Failed to load photos:", err);
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
        title: "Success",
        description: `${fileArray.length} photos uploaded successfully.`,
      });
      fetchPhotos();
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const isCompleted = eventStatus?.toLowerCase() === "completed";

  if (loading && photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Gallery...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upload Section (Admin Only & Completed Event) */}
      {isAdmin && isCompleted && (
        <div className="relative group">
          <label className={cn(
            "flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-[2.5rem] transition-all cursor-pointer",
            uploading 
              ? "bg-slate-50 border-slate-200 pointer-events-none" 
              : "bg-blue-50/30 border-blue-200 hover:bg-blue-50 hover:border-blue-400 shadow-sm"
          )}>
            <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-200 mb-4 group-hover:scale-110 transition-transform">
              {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
            </div>
            <div className="text-center">
              <p className="text-base font-black text-blue-900 uppercase tracking-tight">
                {uploading ? "Uploading Photos..." : "Upload Event Moments"}
              </p>
              <p className="text-xs font-bold text-blue-600/60 uppercase tracking-widest mt-1">
                Select up to 10 photos simultaneously
              </p>
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
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
          <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
            <ImageIcon className="h-10 w-10 text-slate-300" />
          </div>
          <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">No Gallery Yet</h4>
          <p className="text-sm font-medium text-slate-400 mt-2 text-center max-w-xs">
            {isAdmin && isCompleted 
              ? "Capture the special moments and share them with the school community!" 
              : "Event photos will appear here once they are uploaded by an administrator."}
          </p>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo: any) => (
            <div 
              key={photo.id} 
              className="group relative aspect-square rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 cursor-zoom-in"
              onClick={() => setSelectedImage(photo.photo_url)}
            >
              <img 
                src={photo.photo_url} 
                alt="Event" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                       <Maximize2 className="h-4 w-4" />
                     </div>
                  </div>
                  {isAdmin && (
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Delete logic would go here
                        toast({ title: "Note", description: "Delete feature not yet fully connected." });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden border-none bg-transparent shadow-none focus:outline-none">
           <DialogHeader className="sr-only">
             <DialogTitle>Photo Preview</DialogTitle>
           </DialogHeader>
           <div className="relative w-full h-full flex items-center justify-center">
              {selectedImage && (
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="max-w-full max-h-[90vh] object-contain rounded-3xl"
                />
              )}
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute top-4 right-4 rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
