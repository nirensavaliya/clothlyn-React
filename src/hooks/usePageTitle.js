import { useEffect } from 'react';

const usePageTitle = (pageTitle) => {
  useEffect(() => {
    const baseTitle = 'Sitaram Cloth';
    document.title = pageTitle ? `${baseTitle} - ${pageTitle}` : baseTitle;
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = baseTitle;
    };
  }, [pageTitle]);
};

export default usePageTitle;
