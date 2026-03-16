import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Zap, Video, Package, Check, Gift, AlertCircle, Sparkles, Wallet } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ActiveBonus {
  id: string;
  bonus_type: string;
  max_products: number;
  used_products: number;
  expires_at: string;
  is_active: boolean;
}

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
  isEditing: boolean;
  videoFile: File | null;
  onVideoChange: (file: File | null) => void;
  activeBonus?: ActiveBonus | null;
  bonusActivated?: boolean;
  onActivateBonus?: () => void;
}

export const StepOptions = ({ 
  formData, 
  onInputChange, 
  previewImages,
  isEditing,
  videoFile,
  onVideoChange,
  activeBonus,
  bonusActivated = false,
  onActivateBonus
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

  const hasValidBonus = activeBonus && activeBonus.is_active && activeBonus.used_products < activeBonus.max_products;
  const remaining = hasValidBonus ? activeBonus.max_products - activeBonus.used_products : 0;

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

      {/* Bonus activation section */}
      {!isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {hasValidBonus ? (
            <div className={`p-4 rounded-2xl border space-y-3 ${
              bonusActivated 
                ? 'border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10' 
                : 'border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm">
                    Bonus de publication
                  </span>
                  <Badge className="bg-primary/10 text-primary text-xs border-0">
                    {activeBonus.bonus_type === 'trial' ? 'Essai' : 'Admin'}
                  </Badge>
                </div>
                {bonusActivated && (
                  <Badge className="bg-green-500 text-white text-xs">
                    <Check className="w-3 h-3 mr-1" /> Activé
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Produits restants</span>
                <span className="font-bold text-foreground">{remaining} / {activeBonus.max_products}</span>
              </div>

              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                  style={{ width: `${(activeBonus.used_products / activeBonus.max_products) * 100}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Expire le {new Date(activeBonus.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>

              {bonusActivated ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm font-medium">Ce produit sera publié avec votre bonus</p>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={onActivateBonus}
                  className="w-full rounded-xl h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Activer le bonus
                </Button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-muted bg-muted/30 space-y-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Aucun bonus disponible
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Votre solde Compte Djassa sera utilisé pour cette publication.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Publication via Compte Djassa</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <p className="text-sm font-medium">Options de visibilité</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
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
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
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
          </div>
        </div>
      </motion.div>

      {/* Video upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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