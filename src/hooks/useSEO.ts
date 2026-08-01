import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { seoData } from '../data/seoData';

type SEOPageKey = keyof typeof seoData;

export const useSEO = (pageKey?: SEOPageKey, customData?: {
  title?: string;
  description?: string;
  keywords?: string;
}) => {
  const location = useLocation();

  useEffect(() => {
    let seoInfo;
    
    if (customData) {
      seoInfo = customData;
    } else if (pageKey && seoData[pageKey]) {
      seoInfo = seoData[pageKey];
    } else {
      // Default SEO ma'lumotlari
      seoInfo = {
        title: "JoyBor Admin - Yotoqxona Boshqaruv Tizimi",
        description: "Zamonaviy yotoqxona boshqaruv tizimi - talabalar, to'lovlar, xonalar va arizalarni boshqarish uchun professional platforma",
        keywords: "yotoqxona boshqaruv, talaba boshqaruv, xona boshqaruv, to'lov tizimi, ariza boshqaruv, JoyBor, admin panel"
      };
    }

    // Title o'rnatish
    if (seoInfo.title) {
      document.title = seoInfo.title;
    }

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

    if (seoInfo.description) {
      updateMetaTag('description', seoInfo.description);
      updateMetaTag('og:description', seoInfo.description, true);
      updateMetaTag('twitter:description', seoInfo.description, true);
    }

    if (seoInfo.keywords) {
      updateMetaTag('keywords', seoInfo.keywords);
    }

    if (seoInfo.title) {
      updateMetaTag('og:title', seoInfo.title, true);
      updateMetaTag('twitter:title', seoInfo.title, true);
    }

    // URL yangilash
    const currentUrl = `https://admin.joy-bor.uz${location.pathname}`;
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('twitter:url', currentUrl, true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;

  }, [pageKey, customData, location.pathname]);
};

export default useSEO;