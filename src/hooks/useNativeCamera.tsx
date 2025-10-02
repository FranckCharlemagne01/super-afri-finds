import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/ui/use-toast';

export const useNativeCamera = () => {
  const { toast } = useToast();

  const takePicture = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        toast({
          title: 'Fonctionnalité native',
          description: 'La caméra native est disponible uniquement sur l\'application mobile.',
          variant: 'destructive'
        });
        return null;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      return {
        base64: image.base64String,
        format: image.format,
        dataUrl: `data:image/${image.format};base64,${image.base64String}`
      };
    } catch (error) {
      console.error('Error taking picture:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'accéder à la caméra.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const pickImage = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        toast({
          title: 'Fonctionnalité native',
          description: 'L\'accès à la galerie est disponible uniquement sur l\'application mobile.',
          variant: 'destructive'
        });
        return null;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });

      return {
        base64: image.base64String,
        format: image.format,
        dataUrl: `data:image/${image.format};base64,${image.base64String}`
      };
    } catch (error) {
      console.error('Error picking image:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'accéder à la galerie.',
        variant: 'destructive'
      });
      return null;
    }
  };

  return {
    takePicture,
    pickImage
  };
};
