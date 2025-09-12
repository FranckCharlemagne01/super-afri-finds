import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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
}

const categories = [
  'Téléphones & Tablettes',
  'Électroménager / TV & Audio',
  'Mode',
  'Maison & Décoration',
  'Beauté & Soins personnels',
  'Épicerie & Produits alimentaires',
  'Auto & Accessoires',
];

// Suggestions de contenu par catégorie
const categoryDefaults = {
  'Téléphones & Tablettes': {
    title: 'iPhone 13 Pro 128 Go',
    description: 'iPhone 13 Pro, 128 Go, très bon état. Livré avec son chargeur, coque incluse.'
  },
  'Électroménager / TV & Audio': {
    title: 'TV Samsung 55" 4K Ultra HD',
    description: 'TV Samsung 55" 4K Ultra HD. Très bonne qualité d\'image, télécommande incluse.'
  },
  'Mode': {
    title: 'Veste en jean Levi\'s taille M',
    description: 'Veste en jean Levi\'s taille M. Excellent état, très peu portée.'
  },
  'Maison & Décoration': {
    title: 'Canapé 3 places en tissu gris',
    description: 'Canapé 3 places en tissu gris. Propre, confortable, idéal pour salon moderne.'
  },
  'Beauté & Soins personnels': {
    title: 'Sèche-cheveux Dyson Supersonic',
    description: 'Sèche-cheveux Dyson Supersonic, neuf dans son emballage d\'origine.'
  },
  'Épicerie & Produits alimentaires': {
    title: 'Huile d\'olive extra vierge 1L',
    description: 'Huile d\'olive extra vierge 1L. Produit artisanal, première pression à froid.'
  },
  'Auto & Accessoires': {
    title: 'Tapis de sol universels pour voiture',
    description: 'Tapis de sol universels pour voiture. Antidérapants, faciles à nettoyer.'
  }
};

export const ProductForm = ({ product, onSave, onCancel }: ProductFormProps) => {
  const { user } = useAuth();
  const trialStatus = useTrialStatus();
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

  // Pré-remplir les champs selon la catégorie sélectionnée
  useEffect(() => {
    if (formData.category && !product?.id && categoryDefaults[formData.category as keyof typeof categoryDefaults]) {
      const defaults = categoryDefaults[formData.category as keyof typeof categoryDefaults];
      // Ne pré-remplir que si les champs sont vides pour ne pas écraser les modifications de l'utilisateur
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: defaults.title }));
      }
    }
  }, [formData.category, product?.id]);

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

      // Calculate discount percentage
      const discount_percentage = formData.original_price > 0 
        ? Math.round(((formData.original_price - formData.price) / formData.original_price) * 100)
        : 0;

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
      };

      if (product?.id) {
        // Update existing product (no payment required)
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
        // New product - check trial status
        if (!trialStatus.canPublish) {
          toast({
            title: "Période d'essai expirée",
            description: "Vous devez passer au Premium pour publier de nouveaux articles.",
            variant: "destructive",
          });
          return;
        }

        // If in trial period, save directly without payment
        if (trialStatus.isInTrial) {
          const { error: insertError } = await supabase
            .from('products')
            .insert(productData);
          
          if (insertError) throw insertError;

          toast({
            title: "✅ Article publié gratuitement",
            description: "Votre article a été publié pendant votre période d'essai !",
          });

          onSave();
        } else {
          // Not in trial and not premium - initiate payment process
          handlePublishWithPayment(productData);
        }
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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validation des fichiers
    const validFiles = files.filter(file => {
      // Vérifier le type de fichier
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: "Format non supporté",
          description: `Le fichier ${file.name} n'est pas dans un format supporté (JPEG, PNG, WebP)`,
          variant: "destructive",
        });
        return false;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `Le fichier ${file.name} doit faire moins de 5MB`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
        <div className="space-y-2">
          <Label htmlFor="title">Titre du produit *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Nom de votre produit"
            required
            className={isMobile ? "text-base" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Catégorie *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => handleInputChange('category', value)}
          >
            <SelectTrigger className={isMobile ? "text-base" : ""}>
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Prix (FCFA) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => handleInputChange('price', Number(e.target.value))}
            placeholder="0"
            required
            min="0"
            className={isMobile ? "text-base" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="original_price">Prix original (FCFA)</Label>
          <Input
            id="original_price"
            type="number"
            value={formData.original_price}
            onChange={(e) => handleInputChange('original_price', Number(e.target.value))}
            placeholder="0"
            min="0"
            className={isMobile ? "text-base" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Quantité en stock</Label>
          <Input
            id="stock_quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => handleInputChange('stock_quantity', Number(e.target.value))}
            placeholder="0"
            min="0"
            className={isMobile ? "text-base" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="badge">Badge (optionnel)</Label>
          <Input
            id="badge"
            value={formData.badge}
            onChange={(e) => handleInputChange('badge', e.target.value)}
            placeholder="Nouveau, Populaire, etc."
            className={isMobile ? "text-base" : ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder={formData.category && categoryDefaults[formData.category as keyof typeof categoryDefaults] 
            ? categoryDefaults[formData.category as keyof typeof categoryDefaults].description
            : "Décrivez votre produit en détail..."}
          rows={4}
        />
      </div>

      <div className="space-y-4">
        <Label>Images du produit</Label>
        
        {/* Upload d'images optimisé mobile */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50/50">
          {isMobile ? (
            /* Interface mobile optimisée */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={() => imageInputRef.current?.click()}
                  className="h-24 flex flex-col items-center justify-center space-y-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                >
                  <ImageIcon className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-gray-700">Galerie</span>
                </button>
                
                <button 
                  type="button" 
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-24 flex flex-col items-center justify-center space-y-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                >
                  <Camera className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-gray-700">Appareil photo</span>
                </button>
              </div>
              
              <p className="text-sm text-gray-600">
                Choisissez une image depuis votre galerie ou prenez une photo
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WebP jusqu'à 5MB chacune. Max 5 images.
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
          
          {/* Inputs cachés pour galerie et caméra - optimisés mobile */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageFileChange}
            className="hidden"
          />
        </div>

        {/* Aperçu des images uploadées */}
        {previewImages.length > 0 && (
          <div className="space-y-2">
            <Label>Aperçu des images</Label>
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-3 gap-4'}`}>
              {previewImages.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Aperçu ${index + 1}`}
                    className={`w-full ${isMobile ? 'h-24' : 'h-32'} object-cover rounded-lg border`}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => removePreviewImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternative: URL d'image */}
        <div className="space-y-2">
          <Label htmlFor="images">Ou ajouter une image par URL (optionnel)</Label>
          <Input
            id="images"
            value={formData.images}
            onChange={(e) => handleInputChange('images', e.target.value)}
            placeholder="https://exemple.com/image.jpg"
          />
        </div>
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

      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-2'}`}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className={isMobile ? "w-full" : ""}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={loading || uploadingVideo || uploadingImages || (!product?.id && !trialStatus.canPublish)}
          className={isMobile ? "w-full" : ""}
        >
          {loading ? 'Sauvegarde...' : 
           uploadingImages ? 'Upload images...' : 
           uploadingVideo ? 'Upload vidéo...' : 
           product?.id ? 'Modifier' : 
           trialStatus.isInTrial ? 'Publier (Gratuit - Essai)' :
           trialStatus.canPublish ? 'Publier (1000 FCFA)' :
           'Période d\'essai expirée'}
        </Button>
      </div>
    </form>
  );
};