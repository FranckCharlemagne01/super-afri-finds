import { useState, useCallback } from 'react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface QuickAnswer {
  trigger: string;
  response: string;
}

export const useChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Base de connaissances FAQ Djassa
  const knowledgeBase: QuickAnswer[] = [
    {
      trigger: 'compte|inscription|inscrire',
      response: `Pour créer un compte sur Djassa :
👉 Cliquez sur "S'inscrire"
👉 Remplissez vos informations (nom, email, téléphone)
👉 Validez votre compte
Un email ou SMS de confirmation vous sera envoyé.

✅ L'inscription est gratuite avec 28 jours d'essai !`
    },
    {
      trigger: 'acheter|achat|commander|produit',
      response: `Pour acheter sur Djassa :
1️⃣ Connectez-vous à votre compte
2️⃣ Choisissez un produit
3️⃣ Ajoutez-le au panier
4️⃣ Suivez les étapes de paiement sécurisé

💳 Modes de paiement disponibles :
• Orange Money, MTN Mobile Money, Moov
• Carte bancaire
• PayPal (bientôt disponible)`
    },
    {
      trigger: 'suivi|commande|livraison|statut',
      response: `Pour suivre votre commande :
📦 Rendez-vous dans "Mes commandes"
👀 Consultez le statut en temps réel :
• En attente
• Expédié  
• Livré

🚚 La livraison est assurée par nos partenaires transporteurs ou directement par le vendeur.`
    },
    {
      trigger: 'paiement|payer|money|carte',
      response: `Modes de paiement sécurisés sur Djassa :
💰 Mobile Money :
• Orange Money
• MTN Mobile Money  
• Moov

💳 Carte bancaire (sécurisé SSL)
🌟 PayPal (bientôt disponible)

🔒 Tous les paiements sont protégés par chiffrement SSL.`
    },
    {
      trigger: 'vendre|vendeur|annonce|publier',
      response: `Pour vendre sur Djassa :
📝 Connectez-vous à votre compte vendeur
📸 Cliquez sur "Ajouter un produit"
🖼️ Téléchargez vos photos
📋 Renseignez les détails (prix, description)

💰 Commission : Une petite commission est prélevée sur chaque vente
📊 Compte premium : Plus de visibilité et outils avancés disponibles`
    },
    {
      trigger: 'problème|arnaque|sécurité|aide',
      response: `En cas de problème :
⚠️ Ne validez JAMAIS un paiement en dehors de Djassa
🔒 Utilisez uniquement nos moyens de paiement sécurisés
📞 Contactez notre support via "Assistance" dans votre espace client

🛡️ Vos paiements sont protégés par SSL et nos équipes vérifient les vendeurs.`
    },
    {
      trigger: 'premium|abonnement|essai|formule',
      response: `Avantages du compte premium :
✨ Plus de visibilité pour vos annonces
📈 Outils marketing avancés
📊 Statistiques de ventes détaillées
🎯 Support prioritaire

💡 Pour passer au premium :
Mon compte > Abonnement > Choisir votre formule`
    }
  ];

  const quickOptionsResponses = {
    acheter: knowledgeBase.find(kb => kb.trigger.includes('acheter'))?.response || '',
    suivi: knowledgeBase.find(kb => kb.trigger.includes('suivi'))?.response || '',
    paiement: knowledgeBase.find(kb => kb.trigger.includes('paiement'))?.response || '',
    vendre: knowledgeBase.find(kb => kb.trigger.includes('vendre'))?.response || '',
    probleme: knowledgeBase.find(kb => kb.trigger.includes('problème'))?.response || ''
  };

  const findAnswer = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Détecter les salutations
    const greetingTriggers = ['bonjour', 'bonsoir', 'salut', 'coucou', 'hello', 'hi'];
    if (greetingTriggers.some(trigger => message.includes(trigger))) {
      const greetingResponses = [
        '👋 Bonjour ! Heureux de vous retrouver sur Djassa. Comment puis-je vous aider aujourd\'hui ?',
        'Bonsoir 🌙, ravi de vous assister sur Djassa. De quoi avez-vous besoin ?',
        '👋 Salut ! Je suis Boza, votre assistant Djassa. Que puis-je faire pour vous ?',
        'Bonjour et bienvenue 😊 ! Boza à votre service pour vous accompagner sur Djassa.'
      ];
      // Choisir la réponse selon l'heure ou le message
      if (message.includes('bonsoir')) {
        return 'Bonsoir 🌙, ravi de vous assister sur Djassa. De quoi avez-vous besoin ?';
      }
      return greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
    }
    
    // Détecter les remerciements
    const thankYouTriggers = ['merci', 'thanks', 'thank you', 'merci beaucoup', 'merci infiniment', 'merci bien'];
    if (thankYouTriggers.some(trigger => message.includes(trigger))) {
      const politeResponses = [
        'Avec plaisir 🙏, je suis là pour vous aider à chaque étape sur Djassa !',
        'Merci à vous 🙏. N\'hésitez pas à revenir vers moi si vous avez d\'autres questions.',
        'Toujours à votre service 💡 ! Bonne visite sur Djassa.',
        'C\'est un plaisir de vous aider 🌟 ! Djassa est là pour faciliter vos achats et ventes.',
        'Je vous en prie 😊 ! L\'équipe Djassa et moi sommes ravis de vous accompagner.'
      ];
      return politeResponses[Math.floor(Math.random() * politeResponses.length)];
    }
    
    for (const item of knowledgeBase) {
      const triggers = item.trigger.split('|');
      if (triggers.some(trigger => message.includes(trigger))) {
        // Ajouter une question de relance
        const followUpQuestions = [
          '\n\n💡 Puis-je vous aider avec autre chose ?',
          '\n\n🤔 Avez-vous d\'autres questions sur Djassa ?',
          '\n\n✨ Souhaitez-vous que je vous guide sur une autre fonctionnalité ?',
          '\n\n📱 Y a-t-il autre chose que vous aimeriez savoir ?'
        ];
        const randomFollowUp = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
        return item.response + randomFollowUp;
      }
    }

    // Réponse par défaut si aucune correspondance
    return `Je n'ai pas encore cette réponse dans ma base de données. 🤔

Voulez-vous contacter le support Djassa ?

📞 Support WhatsApp : +225 07 88 28 12 22
📧 Email : support@djassa.com
💬 Chat en direct via votre espace client

Notre équipe vous répondra rapidement ! 😊

💡 Ou posez-moi une autre question, je serai ravi de vous aider !`;
  };

  const simulateTyping = useCallback((callback: () => void, delay = 1200) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simuler la réflexion du bot
    simulateTyping(() => {
      const botResponse = findAnswer(text);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    });
  }, [simulateTyping]);

  const selectQuickOption = useCallback((optionId: string) => {
    const optionLabels = {
      acheter: 'Comment acheter sur Djassa ?',
      suivi: 'Comment suivre ma commande ?',
      paiement: 'Quels sont les modes de paiement ?',
      vendre: 'Comment vendre sur Djassa ?',
      probleme: 'J\'ai un problème, que faire ?'
    };

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: optionLabels[optionId as keyof typeof optionLabels] || optionId,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    simulateTyping(() => {
      const response = quickOptionsResponses[optionId as keyof typeof quickOptionsResponses];
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    });
  }, [simulateTyping]);

  return {
    messages,
    isTyping,
    sendMessage,
    selectQuickOption
  };
};