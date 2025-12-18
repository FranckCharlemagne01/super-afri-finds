import { motion } from 'framer-motion';
import { Settings, Eye, Zap, Video, Package, Check, Coins } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface StepOptionsProps {
  formData: {
    title: string;
    category: string;
    price: number;
    is_active: boolean;
    is_flash_sale: boolean;
  };
  onInputChange: (field: string, value: any) => void;
  previewImages: string[];
  tokenBalance: number;
  isEditing: boolean;
  videoFile: File | null;
  onVideoChange: (file: File | null) => void;
}

export const StepOptions = ({ 
  formData, 
  onInputChange, 
  previewImages,
  tokenBalance,
  isEditing,
  videoFile,
  onVideoChange
}: StepOptionsProps) => {
  const { toast } = useToast();

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La vidéo doit faire moins de 50MB",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      onVideoChange(file);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 }
    })
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pb-2"
      >
        <h2 className="text-xl font-bold text-foreground">Récapitulatif</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vérifiez les détails avant de publier
        </p>
      </motion.div>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-5 space-y-4"
      >
        <div className="flex gap-4">
          {previewImages[0] ? (
            <img
              src={previewImages[0]}
              alt="Aperçu"
              className="w-20 h-20 object-cover rounded-2xl shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{formData.title || 'Sans titre'}</h3>
            <p className="text-sm text-muted-foreground">{formData.category || 'Catégorie'}</p>
            <p className="text-xl font-bold text-primary mt-1">
              {formData.price?.toLocaleString()} FCFA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-primary/10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-green-500" />
            <span>{previewImages.length} image{previewImages.length > 1 ? 's' : ''}</span>
          </div>
          {videoFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-green-500" />
              <span>Vidéo</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Token info */}
      {!isEditing && (
        <motion.div
          custom={0}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className={`flex items-center gap-3 p-4 rounded-2xl ${
            tokenBalance > 0 
              ? 'bg-green-50 dark:bg-green-950/30' 
              : 'bg-red-50 dark:bg-red-950/30'
          }`}
        >
          <Coins className={`w-6 h-6 ${tokenBalance > 0 ? 'text-green-600' : 'text-red-600'}`} />
          <div className="flex-1">
            <p className={`font-medium ${tokenBalance > 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              {tokenBalance} jeton{tokenBalance > 1 ? 's' : ''} disponible{tokenBalance > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              1 jeton sera déduit à la publication
            </p>
          </div>
        </motion.div>
      )}

      {/* Options */}
      <motion.div
        custom={1}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <p className="text-sm font-medium">Options de visibilité</p>
        
        <div className="space-y-3">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="is_active" className="font-medium cursor-pointer">
                  Produit actif
                </Label>
                <p className="text-xs text-muted-foreground">
                  Visible sur la marketplace
                </p>
              </div>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => onInputChange('is_active', checked)}
            />
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <Label htmlFor="is_flash_sale" className="font-medium cursor-pointer">
                  Vente flash
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mise en avant spéciale
                </p>
              </div>
            </div>
            <Switch
              id="is_flash_sale"
              checked={formData.is_flash_sale}
              onCheckedChange={(checked) => onInputChange('is_flash_sale', checked)}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Video upload */}
      <motion.div
        custom={2}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <Label htmlFor="video" className="flex items-center gap-2 text-sm font-medium">
          <Video className="w-4 h-4 text-muted-foreground" />
          Vidéo (optionnel)
        </Label>
        <Input
          id="video"
          type="file"
          accept="video/*"
          onChange={handleVideoChange}
          className="h-14 rounded-2xl text-base bg-muted/30 border-0 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-medium"
        />
        {videoFile && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="w-4 h-4" />
            <span className="truncate">{videoFile.name}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          MP4, MOV, AVI • Max 50MB
        </p>
      </motion.div>
    </div>
  );
};
