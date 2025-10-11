import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useTokens } from '@/hooks/useTokens';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextInput, NumericInput } from '@/components/ui/validated-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface Product {
  id?: string;
  title: string;
  description?: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category: string;
  images?: string[];
  video_url?: string;
  badge?: string;
  stock_quantity?: number;
  is_active?: boolean;
  is_flash_sale?: boolean;
}

interface ProductFormProps {
  product?: Product | null;
  onSave: () => void;
  onCancel: () => void;
  shopId?: string;
}

import { getAllCategoriesFlat } from '@/data/categories';

const categoriesFlat = getAllCategoriesFlat();


export const ProductForm = ({ product, onSave, onCancel, shopId }: ProductFormProps) => {
  const { user } = useAuth();
  const trialStatus = useTrialStatus();
  const { tokenBalance, loading: tokensLoading, refreshBalance } = useTokens();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || 0,
    original_price: product?.original_price || 0,
    category: product?.category || '',
    stock_quantity: product?.stock_quantity || 0,
    is_active: product?.is_active ?? true,
    is_flash_sale: product?.is_flash_sale || false,
    badge: product?.badge || '',
    images: product?.images?.[0] || '',
    video_url: product?.video_url || '',
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);


  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0 || !user) return [];

    setUploadingImages(true);
    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'uploader les images",
        variant: "destructive",
      });
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const uploadVideo = async (): Promise<string | null> => {
    if (!videoFile || !user) return null;

    setUploadingVideo(true);
    try {
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('product-videos')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-videos')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'uploader la vidéo",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Upload images if present
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages();
      }
      
      // Combine uploaded images with URL image
      const allImages = [...imageUrls];
      if (formData.images && formData.images.trim()) {
        allImages.push(formData.images);
      }

      // Upload video if present
      let videoUrl = formData.video_url;
      if (videoFile) {
        const uploadedVideoUrl = await uploadVideo();
        if (uploadedVideoUrl) {
          videoUrl = uploadedVideoUrl;
        }
      }

      // Security: Validate pricing before calculating discount
      if (formData.original_price && formData.original_price < formData.price) {
        toast({
          title: "Prix invalide",
          description: "Le prix original doit être supérieur ou égal au prix de vente",
          variant: "destructive",
        });
        return;
      }

      // Calculate discount percentage
      const discount_percentage = formData.original_price > 0 
        ? Math.round(((formData.original_price - formData.price) / formData.original_price) * 100)
        : 0;

      // Security: Ensure discount is valid (0-100%)
      if (discount_percentage < 0 || discount_percentage > 100) {
        toast({
          title: "Remise invalide",
          description: "La remise doit être entre 0% et 100%",
          variant: "destructive",
        });
        return;
      }

      // Get seller's shop_id (use provided shopId or fetch from database)
      let finalShopId = shopId;
      if (!finalShopId) {
        const { data: shopData } = await supabase
          .from('seller_shops')
          .select('id')
          .eq('seller_id', user.id)
          .eq('is_active', true)
          .single();
        finalShopId = shopData?.id || null;
      }

      const productData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        original_price: formData.original_price || null,
        discount_percentage: discount_percentage || null,
        category: formData.category,
        stock_quantity: formData.stock_quantity,
        is_active: formData.is_active,
        is_flash_sale: formData.is_flash_sale,
        badge: formData.badge || null,
        images: allImages,
        video_url: videoUrl || null,
        seller_id: user.id,
        shop_id: finalShopId,
      };

      if (product?.id) {
        // Update existing product (no token required)
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        
        if (updateError) throw updateError;

        toast({
          title: "✅ Produit modifié",
          description: "Les modifications ont été enregistrées et sont maintenant visibles sur la plateforme",
        });

        onSave();
      } else {
        // New product - Transaction atomique : vérifier et déduire le jeton AVANT la publication
        console.log('🔍 Vérification des jetons disponibles...');
        
        // Vérifier le solde de jetons
        const { data: balanceCheck, error: balanceError } = await supabase
          .rpc('check_token_balance', {
            _seller_id: user.id
          });

        if (balanceError) {
          console.error('Erreur lors de la vérification des jetons:', balanceError);
          toast({
            title: "❌ Erreur",
            description: "Impossible de vérifier votre solde de jetons. Veuillez réessayer.",
            variant: "destructive",
          });
          return;
        }

        // Type assertion pour le retour de la fonction
        const balance = balanceCheck as { 
          has_tokens: boolean; 
          token_balance: number;
          free_tokens: number;
          paid_tokens: number;
          expires_at: string | null;
        } | null;

        if (!balance?.has_tokens || balance?.token_balance <= 0) {
          console.log('❌ Jetons insuffisants');
          toast({
            title: "❌ Jetons insuffisants",
            description: "Vous n'avez plus de jetons disponibles pour publier ce produit. Veuillez recharger vos jetons pour continuer.",
            variant: "destructive",
          });
          return;
        }

        console.log('✅ Jetons disponibles:', balance.token_balance);
        console.log('🔒 Déduction d\'un jeton...');

        // Déduire 1 jeton de manière atomique (avec verrou transactionnel)
        const { data: tokenConsumed, error: tokenError } = await supabase
          .rpc('consume_token_for_publication', {
            _seller_id: user.id,
            _product_id: null // Pas encore de product_id
          });

        if (tokenError || !tokenConsumed) {
          console.error('❌ Erreur lors de la déduction du jeton:', tokenError);
          toast({
            title: "❌ Erreur",
            description: "Impossible de déduire le jeton. Veuillez réessayer.",
            variant: "destructive",
          });
          return;
        }

        console.log('✅ Jeton déduit avec succès');
        console.log('📝 Création du produit...');

        // Maintenant insérer le produit (le jeton a déjà été déduit)
        const { data: insertedProduct, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
        
        if (insertError) {
          console.error('❌ Erreur lors de la création du produit:', insertError);
          // IMPORTANT: Le jeton a déjà été consommé, on informe l'utilisateur
          toast({
            title: "❌ Erreur de sauvegarde",
            description: "Impossible de sauvegarder le produit. Un jeton a été consommé. Contactez le support si le problème persiste.",
            variant: "destructive",
          });
          
          // Log l'erreur pour l'admin
          console.error('[ADMIN LOG] Product save failed after token consumption:', {
            user_id: user.id,
            error: insertError,
            timestamp: new Date().toISOString()
          });
          
          return;
        }

        console.log('✅ Produit créé avec succès:', insertedProduct.id);

        // Rafraîchir le solde de jetons
        await refreshBalance();

        const newBalance = (balance?.token_balance || 1) - 1;

        toast({
          title: "✅ Article publié avec succès",
          description: `Votre article a été publié ! Il vous reste ${newBalance} jeton${newBalance > 1 ? 's' : ''}.`,
        });

        onSave();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le produit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishWithPayment = async (productData: any) => {
    if (!user) return;

    try {
      // Get user profile for email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.email) {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer votre email. Veuillez mettre à jour votre profil.",
          variant: "destructive",
        });
        return;
      }

      // Initialize payment for article publication
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'initialize_payment',
          user_id: user.id,
          email: profile.email,
          amount: 1000, // 1000 FCFA per article
          payment_type: 'article_publication',
          product_data: productData
        }
      });

      if (error) {
        console.error('Error initializing payment:', error);
        toast({
          title: "Erreur de paiement",
          description: "Impossible d'initialiser le paiement. Veuillez réessayer.",
          variant: "destructive",
        });
        return;
      }

      if (!data?.data?.authorization_url) {
        toast({
          title: "Erreur de paiement",
          description: "URL de paiement non disponible",
          variant: "destructive",
        });
        return;
      }

      // Redirect to Paystack payment page
      window.location.href = data.data.authorization_url;
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du processus de paiement",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Security: Validate file signatures (magic numbers) to prevent spoofed files
  const validateFileSignature = async (file: File): Promise<boolean> => {
    try {
      const buffer = await file.slice(0, 12).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
      
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
      
      // WebP: RIFF....WEBP
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
          bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
      
      return false;
    } catch (error) {
      console.error('Error validating file signature:', error);
      return false;
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validation des fichiers
    const validationPromises = files.map(async (file) => {
      // Vérifier le type de fichier (MIME type)
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: "Format non supporté",
          description: `Le fichier ${file.name} n'est pas dans un format supporté (JPEG, PNG, WebP)`,
          variant: "destructive",
        });
        return null;
      }
      
      // Security: Verify file signature (magic numbers) to prevent MIME type spoofing
      const isValidSignature = await validateFileSignature(file);
      if (!isValidSignature) {
        toast({
          title: "Fichier invalide",
          description: `Le fichier ${file.name} n'est pas une image valide. Les fichiers malveillants sont bloqués.`,
          variant: "destructive",
        });
        return null;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `Le fichier ${file.name} doit faire moins de 5MB`,
          variant: "destructive",
        });
        return null;
      }
      
      return file;
    });

    const validatedFiles = await Promise.all(validationPromises);
    const validFiles = validatedFiles.filter((file): file is File => file !== null);

    if (validFiles.length === 0) return;

    if (validFiles.length > 5) {
      toast({
        title: "Trop d'images",
        description: "Vous ne pouvez pas uploader plus de 5 images",
        variant: "destructive",
      });
      return;
    }

    setImageFiles(validFiles);
    
    // Créer les aperçus
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const removePreviewImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    
    // Libérer l'URL de l'objet supprimé
    URL.revokeObjectURL(previewImages[index]);
    
    setImageFiles(newFiles);
    setPreviewImages(newPreviews);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-6">
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
        <div className="space-y-2">
          <Label htmlFor="title" className={isMobile ? "text-sm font-medium" : ""}>
            Titre du produit *
          </Label>
          <TextInput
            id="title"
            value={formData.title}
            onChange={(value) => handleInputChange('title', value)}
            placeholder="Nom de votre produit"
            required
            allowNumbers={true}
            className={isMobile ? "text-base min-h-[44px]" : ""}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className={isMobile ? "text-sm font-medium" : ""}>
            Catégorie *
          </Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => handleInputChange('category', value)}
          >
            <SelectTrigger className={isMobile ? "text-base min-h-[44px]" : ""}>
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent className={isMobile ? "max-h-[50vh]" : ""}>
              {categoriesFlat.map((item) => (
                <SelectItem key={item.value} value={item.value} className={isMobile ? "text-base" : ""}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price" className={isMobile ? "text-sm font-medium" : ""}>
            Prix (FCFA) *
          </Label>
          <NumericInput
            id="price"
            value={formData.price?.toString() || ''}
            onChange={(value) => handleInputChange('price', Number(value) || 0)}
            placeholder="0"
            required
            className={isMobile ? "text-base min-h-[44px]" : ""}
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="original_price" className={isMobile ? "text-sm font-medium" : ""}>
            Prix original (FCFA)
          </Label>
          <NumericInput
            id="original_price"
            value={formData.original_price?.toString() || ''}
            onChange={(value) => handleInputChange('original_price', Number(value) || 0)}
            placeholder="0"
            className={isMobile ? "text-base min-h-[44px]" : ""}
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_quantity" className={isMobile ? "text-sm font-medium" : ""}>
            Quantité en stock
          </Label>
          <NumericInput
            id="stock_quantity"
            value={formData.stock_quantity?.toString() || ''}
            onChange={(value) => handleInputChange('stock_quantity', Number(value) || 0)}
            placeholder="0"
            className={isMobile ? "text-base min-h-[44px]" : ""}
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="badge" className={isMobile ? "text-sm font-medium" : ""}>
            Badge (optionnel)
          </Label>
          <Input
            id="badge"
            value={formData.badge}
            onChange={(e) => handleInputChange('badge', e.target.value)}
            placeholder="Nouveau, Populaire, etc."
            className={isMobile ? "text-base min-h-[44px]" : ""}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className={isMobile ? "text-sm font-medium" : ""}>
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Décrivez votre produit en détail..."
          rows={isMobile ? 3 : 4}
          className={isMobile ? "text-base min-h-[80px]" : ""}
        />
      </div>

      <div className="space-y-3">
        <Label className={isMobile ? "text-sm font-medium" : ""}>Images du produit</Label>
        
        {/* Upload d'images optimisé mobile */}
        <div className="border-2 border-dashed rounded-lg p-3 text-center bg-muted/30">
          {isMobile ? (
            /* Interface mobile optimisée */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    imageInputRef.current?.click();
                  }}
                  className="h-20 flex flex-col items-center justify-center space-y-1.5 bg-background border-2 rounded-lg active:scale-95 transition-all touch-manipulation shadow-sm"
                  aria-label="Sélectionner des images depuis votre galerie"
                >
                  <ImageIcon className="h-7 w-7 text-primary" />
                  <span className="text-xs font-medium">Galerie</span>
                </button>
                
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="h-20 flex flex-col items-center justify-center space-y-1.5 bg-background border-2 rounded-lg active:scale-95 transition-all touch-manipulation shadow-sm"
                  aria-label="Prendre une photo avec votre appareil"
                >
                  <Camera className="h-7 w-7 text-primary" />
                  <span className="text-xs font-medium">Appareil photo</span>
                </button>
              </div>
              
              <p className="text-xs text-muted-foreground leading-tight">
                PNG, JPG, WebP jusqu'à 5MB. Max 5 images.
              </p>
            </div>
          ) : (
            /* Interface desktop */
            <div>
              <div className="flex justify-center mb-4">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
              <div className="mb-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => imageInputRef.current?.click()}
                  className="w-auto"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  📤 Ajouter des images
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Glissez vos images ici ou cliquez pour les sélectionner
              </p>
              <p className="text-xs text-gray-400 mt-2">
                PNG, JPG, WebP jusqu'à 5MB chacune. Maximum 5 images.
              </p>
            </div>
          )}
          
          {/* Inputs pour galerie et caméra - optimisés pour compatibilité mobile */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleImageFileChange}
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              whiteSpace: 'nowrap',
              border: 0,
              opacity: 0,
              pointerEvents: 'none'
            }}
            aria-label="Sélectionner des images depuis la galerie"
            tabIndex={-1}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            capture="user"
            onChange={handleImageFileChange}
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              whiteSpace: 'nowrap',
              border: 0,
              opacity: 0,
              pointerEvents: 'none'
            }}
            aria-label="Prendre une photo avec l'appareil"
            tabIndex={-1}
          />
        </div>

        {/* Aperçu des images uploadées */}
        {previewImages.length > 0 && (
          <div className="space-y-2">
            <Label className={isMobile ? "text-sm font-medium" : ""}>Aperçu des images</Label>
            <div className={`grid ${isMobile ? 'grid-cols-3 gap-2' : 'grid-cols-2 md:grid-cols-3 gap-4'}`}>
              {previewImages.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Aperçu ${index + 1}`}
                    className={`w-full ${isMobile ? 'h-20' : 'h-32'} object-cover rounded-lg border shadow-sm`}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className={`absolute -top-1.5 -right-1.5 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'} rounded-full p-0 shadow-md`}
                    onClick={() => removePreviewImage(index)}
                  >
                    <X className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternative: URL d'image */}
        {!isMobile && (
          <div className="space-y-2">
            <Label htmlFor="images">Ou ajouter une image par URL (optionnel)</Label>
            <Input
              id="images"
              value={formData.images}
              onChange={(e) => handleInputChange('images', e.target.value)}
              placeholder="https://exemple.com/image.jpg"
            />
          </div>
        )}
      </div>

      {/* Video Upload Section */}
      <div className="space-y-2">
        <Label htmlFor="video">Vidéo du produit (optionnel)</Label>
        <div className="space-y-2">
          <Input
            id="video"
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Vérification de la taille (max 50MB)
                if (file.size > 50 * 1024 * 1024) {
                  toast({
                    title: "Fichier trop volumineux",
                    description: "La vidéo doit faire moins de 50MB",
                    variant: "destructive",
                  });
                  e.target.value = '';
                  return;
                }
                setVideoFile(file);
              }
            }}
            className="cursor-pointer"
          />
          {formData.video_url && (
            <div className="text-sm text-muted-foreground">
              Vidéo actuelle: <span className="text-success">✓ Vidéo ajoutée</span>
            </div>
          )}
          {videoFile && (
            <div className="text-sm text-success">
              Nouvelle vidéo sélectionnée: {videoFile.name}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Formats acceptés: MP4, MOV, AVI. Taille max: 50MB
          </p>
        </div>
      </div>

      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center space-x-4'}`}>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Produit actif</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_flash_sale"
              checked={formData.is_flash_sale}
              onCheckedChange={(checked) => handleInputChange('is_flash_sale', checked)}
            />
            <Label htmlFor="is_flash_sale">Vente flash</Label>
          </div>
        </div>
      </div>

      {/* Alert if no tokens available for new product */}
      {!product?.id && tokenBalance <= 0 && !tokensLoading && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Vous n'avez plus de jetons disponibles pour publier un produit. 
            Veuillez acheter des jetons pour continuer.
          </AlertDescription>
        </Alert>
      )}

      {/* Alert if low tokens */}
      {!product?.id && tokenBalance > 0 && tokenBalance < 5 && !tokensLoading && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            ⚠️ Attention ! Il ne vous reste que {tokenBalance} jeton{tokenBalance > 1 ? 's' : ''}. 
            Pensez à recharger bientôt.
          </AlertDescription>
        </Alert>
      )}

      <div className={`flex ${isMobile ? 'flex-col-reverse space-y-reverse space-y-2 pt-2' : 'justify-end space-x-2'}`}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className={isMobile ? "w-full min-h-[44px]" : ""}
          disabled={loading || uploadingVideo || uploadingImages}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={loading || uploadingVideo || uploadingImages || tokensLoading || (!product?.id && tokenBalance <= 0)}
          className={isMobile ? "w-full min-h-[44px]" : ""}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Sauvegarde...' : 
           uploadingImages ? 'Upload images...' : 
           uploadingVideo ? 'Upload vidéo...' : 
           tokensLoading ? 'Chargement...' :
           product?.id ? 'Modifier le produit' : 
           tokenBalance <= 0 ? 'Jetons insuffisants' :
           `Publier le produit (1 jeton)`}
        </Button>
      </div>
    </form>
  );
};