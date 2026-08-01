import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "JoyBor Admin - Yotoqxona Boshqaruv Tizimi",
  description = "Zamonaviy yotoqxona boshqaruv tizimi - talabalar, to'lovlar, xonalar va arizalarni boshqarish uchun professional platforma",
  keywords = "yotoqxona boshqaruv, talaba boshqaruv, xona boshqaruv, to'lov tizimi, ariza boshqaruv, JoyBor, admin panel",
  image = "/logoicon.svg",
  url
}) => {
  const location = useLocation();
  const currentUrl = url || `https://admin.joy-bor.uz${location.pathname}`;

  useEffect(() => {
    // Title o'zgartirish
    document.title = title;

    // Meta teglarni yangilash
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Asosiy meta teglar
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Open Graph
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', currentUrl, true);

    // Twitter
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', image, true);
    updateMetaTag('twitter:url', currentUrl, true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;

  }, [title, description, keywords, image, currentUrl]);

  return null;
};

export default SEOHead;