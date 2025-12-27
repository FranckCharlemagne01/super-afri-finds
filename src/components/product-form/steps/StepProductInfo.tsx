import { motion } from 'framer-motion';
import { Package, Tag, MapPin, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TextInput } from '@/components/ui/validated-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StepProductInfoProps {
  formData: {
    title: string;
    description: string;
    category: string;
    city: string;
  };
  onInputChange: (field: string, value: any) => void;
  categories: { value: string; label: string }[];
  userCountry: string;
}

export const StepProductInfo = ({ formData, onInputChange, categories, userCountry }: StepProductInfoProps) => {
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
        <h2 className="text-xl font-bold text-foreground">Informations du produit</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Décrivez votre article pour attirer les acheteurs
        </p>
      </motion.div>

      {/* Title */}
      <motion.div 
        custom={0}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
          <Package className="w-4 h-4 text-primary" />
          Nom du produit *
        </Label>
        <TextInput
          id="title"
          value={formData.title}
          onChange={(value) => onInputChange('title', value)}
          placeholder="Ex: iPhone 14 Pro Max 256GB"
          required
          allowNumbers={true}
          className="h-14 rounded-2xl text-base px-4 bg-muted/30 border-0 focus:ring-2 focus:ring-primary/20"
          autoComplete="off"
        />
        {formData.title.length > 0 && formData.title.length < 2 && (
          <p className="text-xs text-destructive">Minimum 2 caractères</p>
        )}
      </motion.div>

      {/* Category */}
      <motion.div 
        custom={1}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <Label htmlFor="category" className="flex items-center gap-2 text-sm font-medium">
          <Tag className="w-4 h-4 text-primary" />
          Catégorie *
        </Label>
        <Select 
          value={formData.category} 
          onValueChange={(value) => onInputChange('category', value)}
        >
          <SelectTrigger className="h-14 rounded-2xl text-base px-4 bg-muted/30 border-0">
            <SelectValue placeholder="Choisir une catégorie" />
          </SelectTrigger>
          <SelectContent className="max-h-[50vh] rounded-2xl">
            {categories.map((item) => (
              <SelectItem 
                key={item.value} 
                value={item.value} 
                className="text-base py-3 rounded-xl"
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* City - Read only from seller profile */}
      <motion.div 
        custom={2}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <Label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="w-4 h-4 text-primary" />
          Ville de publication
        </Label>
        <div className="h-14 rounded-2xl text-base px-4 bg-muted/50 border-0 flex items-center text-muted-foreground">
          {formData.city || 'Non définie dans votre profil'}
        </div>
        <p className="text-xs text-muted-foreground">
          Cette ville provient de votre profil vendeur
        </p>
      </motion.div>

      {/* Description */}
      <motion.div 
        custom={3}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
          <FileText className="w-4 h-4 text-primary" />
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Décrivez votre produit en détail : état, caractéristiques, raison de la vente..."
          rows={4}
          className="rounded-2xl text-base p-4 bg-muted/30 border-0 focus:ring-2 focus:ring-primary/20 resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.description.length}/500
        </p>
      </motion.div>
    </div>
  );
};
