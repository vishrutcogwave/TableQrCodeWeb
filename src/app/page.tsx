'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { parseQRCodeURL } from '@/utils/urlParser';
import { ApiService } from '@/services/api';

export default function HomePage() {
  const router = useRouter();
  const { dispatch } = useApp();

  useEffect(() => {
    const run = async () => {
      try {
        const href = window.location.href;
        const hasQuery = window.location.search && window.location.search.length > 1;
        const hasHash = window.location.hash && window.location.hash.length > 1;

        // If hash-style QR is present, parse and proceed
        if (hasHash) {
          const qrParams = parseQRCodeURL(href);
          if (qrParams) {
            sessionStorage.setItem('qrParams', JSON.stringify(qrParams));
            try {
              const outletType = await ApiService.getOutletType(qrParams.orgOltCode);
              dispatch({ type: 'SET_OUTLET_TYPE', payload: outletType });
              sessionStorage.setItem('outletType', outletType);
            } catch (e) {
              console.error('Error fetching outlet type:', e);
            }
            router.replace('/menu');
            return;
          }
        }

        // If any query params exist (non-hash flow), route to menu
        if (hasQuery) {
          router.replace('/menu');
          return;
        }

        // Default fallback
        router.replace('/brand');
      } catch (e) {
        router.replace('/brand');
      }
    };
    run();
  }, [router, dispatch]);

  // Render nothing; immediate redirect
  return null;
}