import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatDialog } from '@/components/ChatDialog';

interface ContactSellerButtonProps {
  productId: string;
  sellerId: string;
  productTitle: string;
  productPrice: number;
  productImage: string;
  iconOnly?: boolean;
}

export const ContactSellerButton = ({ 
  productId, 
  sellerId, 
  productTitle, 
  productPrice,
  productImage,
  iconOnly = false 
}: ContactSellerButtonProps) => {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  const handleOpenChat = () => {
    if (!user) {
      // SECURITY: Validate redirect URL is safe (relative path only)
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/') && !currentPath.startsWith('//')) {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      window.location.href = '/auth';
      return;
    }
    
    setChatOpen(true);
  };

  return (
    <>
      <Button 
        variant="outline" 
        className={iconOnly ? "p-2 min-w-[44px] min-h-[44px] flex-1" : "w-full min-h-[44px]"} 
        size="sm"
        onClick={handleOpenChat}
      >
        <MessageSquare className="w-4 h-4" />
        {!iconOnly && <span className="ml-2">Contacter le vendeur</span>}
      </Button>

      <ChatDialog
        initialMessage={{
          id: 'new',
          sender_id: user?.id || '',
          recipient_id: sellerId,
          product_id: productId,
          subject: `Question sur le produit : ${productTitle}`,
          content: '',
          product: {
            title: productTitle,
            images: [productImage],
            price: productPrice,
          },
        }}
        open={chatOpen}
        onOpenChange={setChatOpen}
        userType="buyer"
      />
    </>
  );
};