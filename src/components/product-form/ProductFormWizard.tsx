import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useTokens } from '@/hooks/useTokens';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Package, 
  ImageIcon, 
  DollarSign, 
  Settings,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { StepProductInfo } from './steps/StepProductInfo';
import { StepImages } from './steps/StepImages';
import { StepPricing } from './steps/StepPricing';
import { StepOptions } from './steps/StepOptions';

import { getAllCategoriesFlat } from '@/data/categories';

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

interface ProductFormWizardProps {
  product?: Product | null;
  onSave: () => void;
  onCancel: () => void;
  shopId?: string;
}

const STEPS = [
  { id: 1, title: 'Produit', icon: Package, description: 'Informations de base' },
  { id: 2, title: 'Images', icon: ImageIcon, description: 'Photos du produit' },
  { id: 3, title: 'Prix', icon: DollarSign, description: 'Prix et stock' },
  { id: 4, title: 'Options', icon: Settings, description: 'Finalisation' },
];

const categoriesFlat = getAllCategoriesFlat();

export const ProductFormWizard = ({ product, onSave, onCancel, shopId }: ProductFormWizardProps) => {
  const { user } = useAuth();
  const trialStatus = useTrialStatus();
  const { tokenBalance, loading: tokensLoading, refreshBalance } = useTokens();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userCountry, setUserCountry] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || 0,
    original_price: product?.original_price || 0,
    category: product?.category || '',
    stock_quantity: product?.stock_quantity ?? 10,
    is_active: product?.is_active ?? true,
    is_flash_sale: product?.is_flash_sale || false,
    badge: product?.badge || '',
    images: product?.images?.[0] || '',
    video_url: product?.video_url || '',
    city: '',
  });

  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Step validation
  const [stepValidation, setStepValidation] = useState({
    1: false,
    2: false,
    3: false,
    4: true,
  });

  // Fetch user's country
  useEffect(() => {
    const fetchUserCountry = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('country, city')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        setUserCountry(data.country || '');
        if (!product?.id && data.city) {
          setFormData(prev => ({ ...prev, city: data.city }));
        }
      }
    };
    
    fetchUserCountry();
  }, [user, product?.id]);

  // Validate steps
  useEffect(() => {
    setStepValidation({
      1: formData.title.trim().length >= 2 && formData.category !== '',
      2: previewImages.length > 0 || (product?.images && product.images.length > 0),
      3: formData.price > 0,
      4: true,
    });
  }, [formData, previewImages, product?.images]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // File validation (reused from original)
  const validateFileSignature = async (file: File): Promise<boolean> => {
    try {
      const buffer = await file.slice(0, 12).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
          bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
      
      return false;
    } catch {
      return false;
    }
  };

  const handleImageFileChange = async (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    
    const validationPromises = fileArray.map(async (file) => {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: "Format non supporté",
          description: `${file.name} doit être JPEG, PNG ou WebP`,
          variant: "destructive",
        });
        return null;
      }
      
      const isValidSignature = await validateFileSignature(file);
      if (!isValidSignature) {
        toast({
          title: "Fichier invalide",
          description: `${file.name} n'est pas une image valide`,
          variant: "destructive",
        });
        return null;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} doit faire moins de 5MB`,
          variant: "destructive",
        });
        return null;
      }
      
      return file;
    });

    const validatedFiles = await Promise.all(validationPromises);
    const validFiles = validatedFiles.filter((file): file is File => file !== null);

    if (validFiles.length === 0) return;

    const totalImages = imageFiles.length + validFiles.length;
    if (totalImages > 5) {
      toast({
        title: "Maximum 5 images",
        description: "Vous ne pouvez pas ajouter plus de 5 images",
        variant: "destructive",
      });
      return;
    }

    setImageFiles(prev => [...prev, ...validFiles]);
    
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  const removePreviewImage = (index: number) => {
    URL.revokeObjectURL(previewImages[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0 || !user) return [];

    setUploadingImages(true);
    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls.filter(url => url && url.startsWith('http'));
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
        .upload(fileName, videoFile, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-videos')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading video:', error);
      return null;
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Upload images
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages();
      }
      
      const allImages = [...imageUrls];
      if (formData.images && formData.images.trim()) {
        allImages.push(formData.images);
      }

      // Upload video
      let videoUrl = formData.video_url;
      if (videoFile) {
        const uploadedVideoUrl = await uploadVideo();
        if (uploadedVideoUrl) videoUrl = uploadedVideoUrl;
      }

      // Validate pricing
      if (formData.original_price && formData.original_price < formData.price) {
        toast({
          title: "Prix invalide",
          description: "Le prix original doit être supérieur au prix de vente",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const discount_percentage = formData.original_price > 0 
        ? Math.round(((formData.original_price - formData.price) / formData.original_price) * 100)
        : 0;

      // Get shop_id
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
        stock_quantity: formData.stock_quantity > 0 ? formData.stock_quantity : 1,
        is_active: formData.is_active,
        is_flash_sale: formData.is_flash_sale,
        badge: formData.badge || null,
        images: allImages,
        video_url: videoUrl || null,
        seller_id: user.id,
        shop_id: finalShopId,
        city: formData.city || null,
        country: userCountry || 'CI',
      };

      if (product?.id) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        
        if (updateError) throw updateError;

        toast({
          title: "✅ Produit modifié",
          description: "Les modifications ont été enregistrées",
        });
        onSave();
      } else {
        // New product - check tokens
        const { data: balanceCheck, error: balanceError } = await supabase
          .rpc('check_token_balance', { _seller_id: user.id });

        if (balanceError) {
          toast({
            title: "❌ Erreur",
            description: "Impossible de vérifier votre solde de jetons",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const balance = balanceCheck as { has_tokens: boolean; token_balance: number } | null;

        if (!balance?.has_tokens || balance?.token_balance <= 0) {
          toast({
            title: "❌ Jetons insuffisants",
            description: "Rechargez vos jetons pour publier",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Consume token
        const { data: tokenConsumed, error: tokenError } = await supabase
          .rpc('consume_token_for_publication', { _seller_id: user.id, _product_id: null });

        if (tokenError || !tokenConsumed) {
          toast({
            title: "❌ Erreur",
            description: "Impossible de déduire le jeton",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Insert product
        const { error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
        
        if (insertError) {
          toast({
            title: "❌ Erreur de sauvegarde",
            description: "Impossible de sauvegarder le produit",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        await refreshBalance();
        const newBalance = (balance?.token_balance || 1) - 1;

        toast({
          title: "✅ Article publié !",
          description: `Il vous reste ${newBalance} jeton${newBalance > 1 ? 's' : ''}`,
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

  const goToStep = (step: number) => {
    if (step < 1 || step > 4) return;
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep < 4 && stepValidation[currentStep as keyof typeof stepValidation]) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isUploading = uploadingImages || uploadingVideo;
  const canSubmit = stepValidation[1] && stepValidation[2] && stepValidation[3] && !loading && !isUploading && !tokensLoading && (product?.id || tokenBalance > 0);

  const progress = ((currentStep - 1) / 3) * 100;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header with progress */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 bg-background">
        {/* Step indicators */}
        <div className="flex justify-between items-center mb-3">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = stepValidation[step.id as keyof typeof stepValidation] && currentStep > step.id;
            
            return (
              <motion.button
                key={step.id}
                type="button"
                onClick={() => goToStep(step.id)}
                className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary/10' 
                    : isCompleted 
                      ? 'bg-green-50 dark:bg-green-950/30' 
                      : 'bg-muted/30'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            {currentStep === 1 && (
              <StepProductInfo
                formData={formData}
                onInputChange={handleInputChange}
                categories={categoriesFlat}
                userCountry={userCountry}
              />
            )}
            {currentStep === 2 && (
              <StepImages
                previewImages={previewImages}
                onImageFileChange={handleImageFileChange}
                onRemoveImage={removePreviewImage}
                existingImages={product?.images || []}
              />
            )}
            {currentStep === 3 && (
              <StepPricing
                formData={formData}
                onInputChange={handleInputChange}
              />
            )}
            {currentStep === 4 && (
              <StepOptions
                formData={formData}
                onInputChange={handleInputChange}
                previewImages={previewImages}
                tokenBalance={tokenBalance}
                isEditing={!!product?.id}
                videoFile={videoFile}
                onVideoChange={setVideoFile}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Token warning */}
      {!product?.id && tokenBalance <= 0 && !tokensLoading && (
        <div className="flex-shrink-0 px-4 pb-2">
          <Alert variant="destructive" className="rounded-xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Jetons insuffisants. Rechargez pour publier.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Sticky bottom navigation */}
      <div className="flex-shrink-0 px-4 py-4 bg-background border-t border-border/50 safe-area-bottom">
        <div className="flex gap-3">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-14 rounded-2xl text-base font-medium"
              disabled={loading || isUploading}
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Retour
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-14 rounded-2xl text-base font-medium"
              disabled={loading || isUploading}
            >
              Annuler
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!stepValidation[currentStep as keyof typeof stepValidation]}
              className="flex-1 h-14 rounded-2xl text-base font-medium"
            >
              Suivant
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 h-14 rounded-2xl text-base font-medium bg-green-600 hover:bg-green-700"
            >
              {loading || isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {uploadingImages ? 'Upload...' : 'Publication...'}
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {product?.id ? 'Modifier' : `Publier (1 jeton)`}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
