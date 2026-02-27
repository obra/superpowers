import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import { create, useModal } from '@ebay/nice-modal-react';
import { Loader2 } from 'lucide-react';
import { defineModal } from '@/shared/lib/modals';
import { formatFileSize } from '@/shared/lib/utils';

export interface ImagePreviewDialogProps {
  imageUrl: string;
  altText: string;
  fileName?: string;
  format?: string;
  sizeBytes?: bigint | null;
}

const ImagePreviewDialogImpl = create<ImagePreviewDialogProps>((props) => {
  const modal = useModal();
  const { imageUrl, altText, fileName, format, sizeBytes } = props;
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClose = () => {
    modal.hide();
  };

  // Build metadata string
  const metadataParts: string[] = [];
  if (format) {
    metadataParts.push(format.toUpperCase());
  }
  const sizeStr = formatFileSize(sizeBytes);
  if (sizeStr) {
    metadataParts.push(sizeStr);
  }
  const metadataLine = metadataParts.join(' · ');

  return (
    <Dialog open={modal.visible} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-5xl p-0 overflow-hidden">
        {fileName && (
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="truncate">{fileName}</DialogTitle>
          </DialogHeader>
        )}
        <div className="relative flex items-center justify-center min-h-[220px] max-h-[76vh] px-4 pb-4">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={altText}
            className={`max-w-full max-h-[70vh] object-contain ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
        {metadataLine && (
          <DialogFooter className="px-4 py-3 border-t sm:justify-start">
            <p className="text-xs text-muted-foreground">{metadataLine}</p>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
});

export const ImagePreviewDialog = defineModal<ImagePreviewDialogProps, void>(
  ImagePreviewDialogImpl
);
