import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, EyeOff, Zap, Lock } from 'lucide-react';
import { SmoothListSkeleton } from '@/components/ui/smooth-skeleton';
import { CountdownTimer } from './CountdownTimer';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category: string;
  images?: string[];
  badge?: string;
  stock_quantity?: number;
  is_active?: boolean;
  is_flash_sale?: boolean;
  is_boosted?: boolean;
  boosted_until?: string;
  rating?: number;
  reviews_count?: number;
  created_at: string;
}

interface SellerProductsProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onBoost?: (productId: string, productTitle: string) => void;
  title?: string;
  emptyMessage?: string;
  canEdit?: boolean;
  canBoost?: boolean;
}

export const SellerProducts = ({ 
  products, 
  loading, 
  onEdit, 
  onDelete, 
  onBoost, 
  title, 
  emptyMessage,
  canEdit = true,
  canBoost = true
}: SellerProductsProps) => {
  const isProductBoosted = (product: Product) => {
    return product.is_boosted && product.boosted_until && new Date(product.boosted_until) > new Date();
  };
  if (loading) {
    return <SmoothListSkeleton items={6} variant="card" className="prevent-flash" />;
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            {emptyMessage || "Aucun produit trouvé."}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Commencez par ajouter votre premier produit !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 prevent-flash">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden card-hover">
          <div className="relative">
            <OptimizedImage
              src={product.images?.[0]}
              alt={product.title}
              aspectRatio="video"
              objectFit="cover"
              containerClassName="w-full h-48"
              productId={product.id}
              enableAutoCleanup={true}
            />
            
            <div className="absolute top-2 left-2 flex gap-2 flex-wrap z-10">
              {isProductBoosted(product) && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  <Zap className="w-3 h-3 mr-1" /> Boosté
                </Badge>
              )}
              {product.badge && (
                <Badge variant="secondary">{product.badge}</Badge>
              )}
              {product.is_flash_sale && (
                <Badge variant="destructive">Flash</Badge>
              )}
              <Badge variant={product.is_active ? "default" : "outline"}>
                {product.is_active ? (
                  <><Eye className="w-3 h-3 mr-1" /> Actif</>
                ) : (
                  <><EyeOff className="w-3 h-3 mr-1" /> Inactif</>
                )}
              </Badge>
            </div>
          </div>

          <CardHeader>
            <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  {product.price.toLocaleString()} FCFA
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {product.original_price.toLocaleString()} FCFA
                  </span>
                )}
              </div>
              {product.discount_percentage && product.discount_percentage > 0 && (
                <Badge variant="destructive">-{product.discount_percentage}%</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Catégorie:</span>
                <span>{product.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock:</span>
                <span>{product.stock_quantity || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avis:</span>
                <span>{product.reviews_count || 0}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(product)}
                          disabled={!canEdit}
                          className={`w-full ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {!canEdit && <Lock className="w-3 h-3 mr-1" />}
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canEdit && (
                      <TooltipContent>
                        <p>Renouvelez votre abonnement pour modifier</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>⚠️ Supprimer le produit</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>Êtes-vous sûr de vouloir supprimer <strong>"{product.title}"</strong> ?</p>
                        <p className="text-destructive text-sm">
                          ⚠️ Cette action est <strong>irréversible</strong> et le produit sera définitivement retiré de la plateforme.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(product.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer définitivement
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {onBoost && !isProductBoosted(product) && canBoost && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onBoost(product.id, product.title)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Booster (2 jetons)
                </Button>
              )}
              
              {!isProductBoosted(product) && !canBoost && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="w-full opacity-60 cursor-not-allowed"
                        >
                          <Lock className="w-3 h-3 mr-1" />
                          <Zap className="w-4 h-4 mr-1" />
                          Booster (2 jetons)
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Renouvelez votre abonnement pour booster</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {isProductBoosted(product) && product.boosted_until && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  <CountdownTimer expiryDate={product.boosted_until} compact className="text-xs" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};