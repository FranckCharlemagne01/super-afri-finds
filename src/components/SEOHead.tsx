import { Helmet } from 'react-helmet';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  productData?: {
    name: string;
    description: string;
    price: number;
    currency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    category?: string;
    image?: string;
    sku?: string;
    brand?: string;
  };
  shopData?: {
    name: string;
    description: string;
    logo?: string;
  };
  noindex?: boolean;
}

const BASE_URL = 'https://djassa.djassa.tech';
const DEFAULT_IMAGE = `${BASE_URL}/images/preview.jpg`;

const SEOHead = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  productData,
  shopData,
  noindex = false,
}: SEOHeadProps) => {
  const fullTitle = title 
    ? `${title} | Djassa Marketplace - Achat & Vente en Ligne Côte d'Ivoire`
    : "Djassa Marketplace – Achat et Vente en Ligne en Côte d'Ivoire";
  
  const fullDescription = description || 
    "Djassa Marketplace est la plateforme e-commerce #1 en Côte d'Ivoire. Achetez et vendez en ligne : téléphones, vêtements, électronique, beauté. Créez votre boutique en ligne gratuitement.";
  
  const fullKeywords = keywords || 
    "marketplace Côte d'Ivoire, Djassa Marketplace, achat en ligne Abidjan, vente en ligne, boutique en ligne, e-commerce Afrique, créer boutique en ligne, marketplace africaine";
  
  const fullImage = image || DEFAULT_IMAGE;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={fullKeywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Djassa Marketplace" />
      <meta property="og:locale" content="fr_CI" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Product Structured Data */}
      {productData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": productData.name,
            "description": productData.description,
            "image": productData.image || fullImage,
            "sku": productData.sku,
            "brand": {
              "@type": "Brand",
              "name": productData.brand || "Djassa Marketplace"
            },
            "offers": {
              "@type": "Offer",
              "url": fullUrl,
              "priceCurrency": productData.currency || "XOF",
              "price": productData.price,
              "availability": `https://schema.org/${productData.availability || 'InStock'}`,
              "seller": {
                "@type": "Organization",
                "name": "Djassa Marketplace"
              }
            },
            "category": productData.category
          })}
        </script>
      )}
      
      {/* Shop/Store Structured Data */}
      {shopData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            "name": shopData.name,
            "description": shopData.description,
            "logo": shopData.logo,
            "url": fullUrl,
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "CI",
              "addressLocality": "Côte d'Ivoire"
            },
            "parentOrganization": {
              "@type": "Organization",
              "name": "Djassa Marketplace",
              "url": BASE_URL
            }
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
