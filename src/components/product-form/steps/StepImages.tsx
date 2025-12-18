import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, ImageIcon, Plus, X, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StepImagesProps {
  previewImages: string[];
  onImageFileChange: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  existingImages: string[];
}

export const StepImages = ({ 
  previewImages, 
  onImageFileChange, 
  onRemoveImage,
  existingImages 
}: StepImagesProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const totalImages = previewImages.length + existingImages.length;
  const hasImages = totalImages > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pb-2"
      >
        <h2 className="text-xl font-bold text-foreground">Photos du produit</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Des photos de qualité augmentent vos ventes
        </p>
      </motion.div>

      {/* Status indicator */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl ${
          hasImages 
            ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300' 
            : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300'
        }`}
      >
        {hasImages ? (
          <>
            <Check className="w-5 h-5" />
            <span className="font-medium">{totalImages} image{totalImages > 1 ? 's' : ''} ajoutée{totalImages > 1 ? 's' : ''}</span>
          </>
        ) : (
          <>
            <ImageIcon className="w-5 h-5" />
            <span className="font-medium">1 image minimum requise</span>
          </>
        )}
      </motion.div>

      {/* Upload buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <motion.button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          whileTap={{ scale: 0.95 }}
          className="h-28 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-dashed border-primary/30 rounded-3xl transition-all hover:border-primary/50 hover:bg-primary/15 active:bg-primary/20"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-medium text-primary">Galerie</span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          whileTap={{ scale: 0.95 }}
          className="h-28 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-secondary/50 to-secondary/70 border-2 border-dashed border-secondary-foreground/20 rounded-3xl transition-all hover:border-secondary-foreground/30 active:bg-secondary/80"
        >
          <div className="w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center">
            <Camera className="w-6 h-6 text-foreground" />
          </div>
          <span className="text-sm font-medium">Appareil photo</span>
        </motion.button>
      </motion.div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={(e) => onImageFileChange(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        onChange={(e) => onImageFileChange(e.target.files)}
        className="hidden"
      />

      {/* Image previews */}
      {previewImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Vos images</span>
            <span className="text-xs text-muted-foreground">{previewImages.length}/5</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {previewImages.map((preview, index) => (
              <motion.div
                key={preview}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-square group"
              >
                <img
                  src={preview}
                  alt={`Aperçu ${index + 1}`}
                  className="w-full h-full object-cover rounded-2xl shadow-sm"
                />
                <Badge 
                  className="absolute bottom-2 left-2 text-xs px-2 py-0.5 bg-black/60 text-white border-0 rounded-lg"
                >
                  {index + 1}
                </Badge>
                <motion.button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  whileTap={{ scale: 0.9 }}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
            
            {/* Add more button */}
            {previewImages.length < 5 && (
              <motion.button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                whileTap={{ scale: 0.95 }}
                className="aspect-square flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-2xl hover:border-primary/50 transition-colors"
              >
                <Plus className="w-8 h-8 text-muted-foreground" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Security notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4"
      >
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Images publiques
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">
              Vos images seront visibles par tous. Ne partagez jamais de documents personnels ou informations sensibles.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <p className="text-xs font-medium text-muted-foreground">💡 Conseils</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Utilisez une bonne luminosité</li>
          <li>• Montrez le produit sous différents angles</li>
          <li>• Formats acceptés : JPEG, PNG, WebP (max 5MB)</li>
        </ul>
      </motion.div>
    </div>
  );
};
