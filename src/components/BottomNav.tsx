'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, IndianRupee, Home } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { showOrdersPage, showCartPage } from '@/utils/outletHelpers';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useApp();

  const isActive = (path: string) => pathname === path;
  const cartItemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const shouldShowOrders = state.outletType ? showOrdersPage(state.outletType) : true;
  const shouldShowCart = state.outletType ? showCartPage(state.outletType) : true;
  
  // Calculate grid columns based on what should be shown
  let gridCols = 'grid-cols-1'; // Default to just Menu
  if (shouldShowCart && shouldShowOrders) {
    gridCols = 'grid-cols-3'; // Menu, Cart, Orders
  } else if (shouldShowCart || shouldShowOrders) {
    gridCols = 'grid-cols-2'; // Menu + (Cart OR Orders)
  }

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200">
      <div className={`max-w-xl mx-auto grid ${gridCols}`}>
        <button
          onClick={() => router.push('/menu')}
          className={`flex flex-col items-center justify-center py-3 bg-transparent hover:bg-slate-50 transition-colors ${isActive('/menu') ? '' : 'text-slate-600'}`}
          style={isActive('/menu') ? { color: '#0476b1' } : {}}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Menu</span>
        </button>
        {shouldShowCart && (
          <button
            onClick={() => {
              if (pathname?.startsWith('/menu')) {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-cart'));
                }
              } else {
                router.push('/menu?cart=1');
              }
            }}
            className={`flex flex-col items-center justify-center py-3 relative bg-transparent hover:bg-slate-50 transition-colors ${pathname?.startsWith('/menu') ? '' : 'text-slate-600'}`}
            style={pathname?.startsWith('/menu') ? { color: '#0476b1' } : {}}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold" style={{ backgroundColor: '#0476b1' }}>
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Cart</span>
          </button>
        )}
        {shouldShowOrders && (
          <button
            onClick={() => router.push('/orders')}
            className={`flex flex-col items-center justify-center py-3 bg-transparent hover:bg-slate-50 transition-colors ${isActive('/orders') ? '' : 'text-slate-600'}`}
            style={isActive('/orders') ? { color: '#0476b1' } : {}}
          >
            <IndianRupee className="w-5 h-5" />
            <span className="text-xs font-medium">Orders</span>
          </button>
        )}
      </div>
    </nav>
  );
}


