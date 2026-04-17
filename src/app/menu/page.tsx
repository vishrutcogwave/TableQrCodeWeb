'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { MenuItem, MenuCategory, OutletType } from '@/types';
import { ArrowLeft, ShoppingCart, Search, Filter, ChevronDown, XCircle, Plus, Minus } from 'lucide-react';
import CartSidebar from '@/components/CartSidebar';
import BottomNav from '@/components/BottomNav';
import OTPOverlay from '@/components/OTPOverlay';
import { ApiService } from '@/services/api';
import { formatCurrency } from '@/utils/currency';
import { parseQRCodeURL } from '@/utils/urlParser';
import { handleImageError, hasValidImage } from '@/utils/imageFallback';
import { toTitleCase } from '@/utils/textFormatting';
import { colors } from '@/config/colors';
import { getTerminology } from '@/utils/outletHelpers';


export default function MenuPage() {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVegSelected, setIsVegSelected] = useState(false);
  const [isNonVegSelected, setIsNonVegSelected] = useState(false);
  const [searchResults, setSearchResults] = useState<MenuItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isOTPOverlayOpen, setIsOTPOverlayOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [guestName, setGuestName] = useState<string>('Guest');
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const { state, dispatch } = useApp();
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const hasOpenedFromQueryRef = useRef(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Check if we have QR params in sessionStorage
      const qrParamsRaw = sessionStorage.getItem('qrParams');
      if (qrParamsRaw) {
        try {
          const qrParams = JSON.parse(qrParamsRaw);
          
          // Restore outlet type from sessionStorage if not in context
          let outletType = state.outletType;
          if (!outletType) {
            const outletTypeRaw = sessionStorage.getItem('outletType');
            if (outletTypeRaw) {
              outletType = outletTypeRaw as OutletType;
              dispatch({ type: 'SET_OUTLET_TYPE', payload: outletType });
            } else {
              console.error('No outlet type found in sessionStorage');
              router.push('/brand');
              return;
            }
          }
          
          // Create table info from QR params
          const tableInfoFromQR = {
            tableId: `T${qrParams.tableNumber || '1'}`,
            tableNumber: `${qrParams.tableNumber || '1'}`,
            restaurantId: qrParams.orgOltCode || '1',
            restaurantName: qrParams.orgOltName || 'Restaurant',
            currency: 'INR',
            outletType: outletType
          };
          setTableInfo(tableInfoFromQR);
          // Also update the global context
          dispatch({ type: 'SET_TABLE_INFO', payload: tableInfoFromQR });
          
          // Load guest name from sessionStorage
          const storedGuestName = sessionStorage.getItem('guestName') || 'Guest';
          setGuestName(storedGuestName);
          
          // Handle Roomservice guest details
          if (outletType === 'Roomservice') {
            try {
              const roomNo = qrParams.tableNumber; // Use raw tbl value
              const roomDetails = await ApiService.getRoomServiceDetails(roomNo);
              
              // Store guest details in sessionStorage
              sessionStorage.setItem('guestName', roomDetails.GuestName);
              sessionStorage.setItem('mobileNumber', roomDetails.Mobile);
              
              // Update state and dispatch event
              setGuestName(roomDetails.GuestName);
              window.dispatchEvent(new CustomEvent('guestNameUpdated'));
            } catch (error) {
              console.error('Error fetching room service details:', error);
              setError('Failed to fetch room service details. Please contact staff.');
              return;
            }
          }
          
          fetchMenu(tableInfoFromQR);
        } catch (error) {
          console.error('Error parsing QR params:', error);
          router.push('/brand');
        }
      } else if (state.tableInfo) {
        // Use existing table info from context
        setTableInfo(state.tableInfo);
        
        // Load guest name from sessionStorage
        const storedGuestName = sessionStorage.getItem('guestName') || 'Guest';
        setGuestName(storedGuestName);
        
        fetchMenu(state.tableInfo);
      } else {
        // No table info available, redirect to brand page
        router.push('/brand');
      }
    };

    initializeApp();
  }, []); // Empty dependency array - only run once on mount

  // Listen for guest name updates from sessionStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const storedGuestName = sessionStorage.getItem('guestName') || 'Guest';
      setGuestName(storedGuestName);
    };
    
    // Listen for custom event when guest name is updated
    window.addEventListener('guestNameUpdated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('guestNameUpdated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Check for cart clear flag from payment callback
  useEffect(() => {
    const shouldClearCart = sessionStorage.getItem('shouldClearCart');
    if (shouldClearCart === 'true') {
      dispatch({ type: 'CLEAR_CART' });
      sessionStorage.removeItem('shouldClearCart');
      console.log("Cart cleared from payment callback flag");
    }
  }, [dispatch]);

  // Handle cart query parameter (only once per load)
  useEffect(() => {
    if (!hasOpenedFromQueryRef.current && searchParams?.get('cart') === '1') {
      hasOpenedFromQueryRef.current = true;
      setIsCartOpen(true);
    }
  }, [searchParams]);

  // Listen for in-page cart open events (from BottomNav)
  useEffect(() => {
    const handler = () => setIsCartOpen(true);
    window.addEventListener('open-cart', handler as EventListener);
    return () => window.removeEventListener('open-cart', handler as EventListener);
  }, []);

  // Fetch company info for logo
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const companyData = await ApiService.getCompanyInfoBill();
        console.log('Company info fetched:', companyData);
        console.log('Logo URL:', companyData?.Logo);
        setCompanyInfo(companyData);
      } catch (error) {
        console.error('Error fetching company info:', error);
        // Silently fail - logo is optional
      }
    };
    fetchCompanyInfo();
  }, []);


  // Perform search (3+ chars or explicit trigger on Enter)
  const performSearch = async (force = false) => {
    const term = searchQuery.trim();
    if (!force && term.length < 3) {
      setSearchResults(null);
      return;
    }
    try {
      setIsSearching(true);
      const qrParamsRaw = sessionStorage.getItem('qrParams');
      const oltCode = qrParamsRaw ? (JSON.parse(qrParamsRaw).orgOltCode as string) : state.tableInfo?.restaurantId || '1';
      const allItems = await ApiService.fetchMenuListByOlt(String(oltCode || '1'));

      const lower = term.toLowerCase();
      const nameMatches = allItems.filter(i => i.ItemName.toLowerCase().includes(lower));
      const categoryMatchesCodes = new Set(allItems.filter(i => String(i.Category).toLowerCase().includes(lower)).map(i => i.CatCode));
      const categoryMatches = allItems.filter(i => categoryMatchesCodes.has(i.CatCode));
      const combined = [...nameMatches, ...categoryMatches];

      // Map to MenuItem[] using existing transform
      const mapped: MenuItem[] = combined.map((it) => (ApiService as any).transformMenuItem(it)).filter(Boolean) as any;
      // De-duplicate by id
      const dedup = Array.from(new Map(mapped.map(m => [m.id, m])).values());
      setSearchResults(dedup);
    } catch (e) {
      console.error('Search failed', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchMenu = async (tableInfoToUse?: any) => {
    try {
      setError(null);
      const menuData = await ApiService.fetchMenu();
      
      // Create "ALL" category with all items from all categories
      const allItems: MenuItem[] = [];
      menuData.forEach(category => {
        allItems.push(...category.items);
      });
      
      const allCategory: MenuCategory = {
        id: 'all',
        name: 'ALL',
        items: allItems,
        image: ''
      };
      
      // Add "ALL" category at the beginning
      const menuWithAll = [allCategory, ...menuData];
      setMenu(menuWithAll);
      
      // Auto-select "ALL" category when menu loads
      setSelectedCategory(allCategory);
      setFilteredItems(allItems);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setError('Failed to load menu. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  // Cart helpers for search result items
  const handleSearchQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
    } else {
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { id: itemId, quantity: newQuantity } });
    }
  };

  const getSearchCartItemQuantity = (itemId: string) => {
    const cartItem = state.cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Cart helpers for main items
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
    } else {
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { id: itemId, quantity: newQuantity } });
    }
  };

  const getCartItemQuantity = (itemId: string) => {
    const cartItem = state.cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;

    // Skip OTP verification for Roomservice
    if (state.outletType === 'Roomservice') {
      dispatch({ type: 'ADD_TO_CART', payload: item });
      return;
    }

    // Check if user has valid mobile number in sessionStorage
    const mobileNumber = sessionStorage.getItem('mobileNumber');
    const hasValidMobile = mobileNumber && mobileNumber.trim() !== '';

    if (!hasValidMobile) {
      // No valid mobile number, require OTP verification
      setPendingItem(item);
      setIsOTPOverlayOpen(true);
      return;
    }
    // Valid mobile number exists, add to cart directly
    dispatch({ type: 'ADD_TO_CART', payload: item });
  };


  // Handle category selection
  const handleCategorySelect = (category: MenuCategory) => {
    setSelectedCategory(category);
    setFilteredItems(category.items);
    setSearchQuery(''); // Clear search when switching categories
    setSearchResults(null);
  };

  // Filter items based on search and dietary preferences
  const filterItems = () => {
    if (!selectedCategory) return;

    let items = [...selectedCategory.items];

    const term = searchQuery.trim().toLowerCase();
    if (term.length >= 3) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term)
      );
    }

    // Apply dietary filter based on toggle states
    if (isVegSelected && !isNonVegSelected) {
      // Only Veg selected - show only vegetarian items
      items = items.filter(item => item.isVegetarian);
    } else if (!isVegSelected && isNonVegSelected) {
      // Only Non-Veg selected - show only non-vegetarian items
      items = items.filter(item => item.isNonVegetarian);
    }
    // If both selected or both unselected, show all items (no additional filtering)

    setFilteredItems(items);
  };

  // Update filtered items when search query or filter changes
  useEffect(() => {
    if (selectedCategory) {
      filterItems();
    }
  }, [selectedCategory, searchQuery, isVegSelected, isNonVegSelected]);


  // Handle OTP overlay success
  const handleOTPSuccess = () => {
    if (pendingItem) {
      // Add the pending item to cart
      dispatch({ type: 'ADD_TO_CART', payload: pendingItem });
      setPendingItem(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#0476b1' }}></div>
          <p className="text-slate-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Menu</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchMenu}
            className="text-white px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#0476b1' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentOrderTotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = state.orders.reduce((sum, order) => sum + order.totalAmount, 0) + currentOrderTotal;
  
  console.log("Menu page render - isCartOpen:", isCartOpen);

  return (
    <div className="min-h-screen bg-white main-scroll">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-start" style={{ minWidth: '80px', width: '80px', height: '50px' }}>
              {companyInfo && companyInfo.Logo ? (
                <img
                  key={companyInfo.Logo}
                  src={companyInfo.Logo.includes('cogwave.in') 
                    ? `/api/logo?url=${encodeURIComponent(companyInfo.Logo)}`
                    : companyInfo.Logo}
                  alt="Restaurant Logo"
                  className="max-h-[50px] w-auto h-auto object-contain"
                  style={{ 
                    display: 'block', 
                    maxWidth: '80px',
                    maxHeight: '50px',
                    width: 'auto',
                    height: 'auto'
                  }}
                  onError={(e) => {
                    console.error('Logo image failed to load:', companyInfo.Logo);
                    console.error('Error event:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Logo image loaded successfully:', companyInfo.Logo);
                  }}
                />
              ) : (
                <div style={{ width: '80px', height: '50px' }}></div>
              )}
            </div>
            
            <div className="text-center flex-1">
              <h1 className="text-lg font-bold text-slate-900">
                {tableInfo?.restaurantName || state.tableInfo?.restaurantName}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {guestName}
              </p>
            </div>

            <div className="w-20 flex justify-end">
              {state.outletType !== 'Fastfood' && (
                <div className="px-3 py-1 rounded-full text-base font-medium" style={{ backgroundColor: '#f0f7fc', color: '#0476b1' }}>
                  {(() => {
                    const qrParamsRaw = sessionStorage.getItem('qrParams');
                    if (qrParamsRaw) {
                      try {
                        const qrParams = JSON.parse(qrParamsRaw);
                        return qrParams.tableNumber || '1';
                      } catch (error) {
                        return '1';
                      }
                    }
                    return state.tableInfo?.tableNumber?.replace('Table ', '') || '1';
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for food"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length >= 3) {
                  performSearch(false);
                } else {
                  setSearchResults(null);
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                setSearchQuery(target.value);
                if (target.value.trim().length >= 3) {
                  performSearch(false);
                } else {
                  setSearchResults(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  performSearch(true);
                }
              }}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl border-0 focus:ring-2 focus:bg-white transition-all duration-200 text-slate-900 placeholder-slate-400"
              style={{ '--tw-ring-color': '#0476b1' } as React.CSSProperties}
            />
          </div>

          {/* Veg/Non-Veg Filter Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsVegSelected(!isVegSelected)}
              className={`flex-shrink-0 w-20 h-10 rounded-xl transition-all duration-200 flex items-center justify-center gap-1 ${
                isVegSelected 
                  ? 'bg-green-100 border-2 border-green-500 text-green-700' 
                  : 'bg-slate-100 border-2 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                isVegSelected ? 'bg-green-500 border-green-500' : 'border-slate-400'
              }`}>
                {isVegSelected && (
                  <div className="w-1.5 h-1.5 bg-white rounded"></div>
                )}
              </div>
              <span className="text-xs font-medium">Veg</span>
            </button>
            
            <button
              onClick={() => setIsNonVegSelected(!isNonVegSelected)}
              className={`flex-shrink-0 w-20 h-10 rounded-xl transition-all duration-200 flex items-center justify-center gap-1 ${
                isNonVegSelected 
                  ? 'bg-red-100 border-2 border-red-500 text-red-700' 
                  : 'bg-slate-100 border-2 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                isNonVegSelected ? 'bg-red-500 border-red-500' : 'border-slate-400'
              }`}>
                {isNonVegSelected && (
                  <div className="w-1.5 h-1.5 bg-white rounded"></div>
                )}
              </div>
              <span className="text-xs font-medium">Non-Veg</span>
            </button>
          </div>

        </div>
      </div>

      {/* Search Results */}
      {isSearching && (
        <div className="px-4 py-2 text-slate-600">Searching...</div>
      )}
      {searchResults && (
        <div className="p-4">
          {searchResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">No items found</h3>
              <p className="text-slate-600 mb-2">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((item) => {
                const cartQuantity = getSearchCartItemQuantity(item.id);
                const isOutOfStock = !item.isAvailable;
                const hasImage = hasValidImage(item.image);
                
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 ${isOutOfStock ? 'opacity-60' : ''}`}
                  >
                    <div className="flex gap-4">
                      {/* Item Details - Left Side */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {/* Vegetarian/Non-vegetarian indicator */}
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            item.isVegetarian ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
                          }`}>
                            <div className={`w-2 h-2 rounded ${
                              item.isVegetarian ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                          </div>
                          <h3 className="font-semibold text-slate-900 text-base line-clamp-2 flex-1">{toTitleCase(item.name)}</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold" style={{ color: '#0476b1' }}>
                            {formatCurrency(item.price, tableInfo?.currency || state.tableInfo?.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Item Image and Add Button - Right Side */}
                      {hasImage && (
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={handleImageError}
                            />
                          </div>
                          
                          {/* Out of Stock Overlay */}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                              <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-medium">
                                Out of Stock
                              </span>
                            </div>
                          )}

                          {/* Add Button */}
                          {!isOutOfStock && (
                            <div className="absolute -bottom-2 -right-2">
                              {cartQuantity > 0 ? (
                                <div className="flex items-center gap-1 bg-white rounded-full shadow-lg p-1">
                                  <button
                                    onClick={() => handleSearchQuantityChange(item.id, cartQuantity - 1)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200"
                                    style={{ backgroundColor: '#f0f7fc', color: '#0476b1' }}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-sm font-semibold text-slate-900 min-w-[1.5rem] text-center">
                                    {cartQuantity}
                                  </span>
                                  <button
                                    onClick={() => handleSearchQuantityChange(item.id, cartQuantity + 1)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200"
                                    style={{ backgroundColor: '#f0f7fc', color: '#0476b1' }}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => dispatch({ type: 'ADD_TO_CART', payload: item })}
                                  className="px-8 py-2 rounded-xl text-white text-sm font-semibold transition-colors duration-200"
                                  style={{ backgroundColor: '#0476b1' }}
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* No Image - Only Add Button */}
                      {!hasImage && !isOutOfStock && (
                        <div className="flex items-center">
                          {cartQuantity > 0 ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSearchQuantityChange(item.id, cartQuantity - 1)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
                                style={{ backgroundColor: '#f0f7fc', color: '#0476b1' }}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-semibold text-slate-900 min-w-[1.5rem] text-center">
                                {cartQuantity}
                              </span>
                              <button
                                onClick={() => handleSearchQuantityChange(item.id, cartQuantity + 1)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
                                style={{ backgroundColor: '#f0f7fc', color: '#0476b1' }}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => dispatch({ type: 'ADD_TO_CART', payload: item })}
                              className="px-8 py-2 rounded-xl text-white font-semibold transition-colors duration-200"
                              style={{ backgroundColor: '#0476b1' }}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Categories Horizontal Scroll */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {menu.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category)}
              className={`flex-shrink-0 w-32 h-10 rounded-xl transition-all duration-200 relative overflow-hidden ${
                selectedCategory?.id === category.id
                  ? 'shadow-lg'
                  : 'hover:shadow-md'
              }`}
              style={{ 
                backgroundColor: selectedCategory?.id === category.id ? colors.primaryDark : colors.primaryLight 
              }}
            >
              {/* Category Image - fills entire card if present */}
              {hasValidImage(category.image) && (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => {
                    // If image fails to load, hide it and show background color
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              
              {/* Background color - always present */}
              <div 
                className="absolute inset-0" 
                style={{ 
                  backgroundColor: selectedCategory?.id === category.id ? colors.primaryDark : colors.primaryLight 
                }}
              ></div>
              
              {/* Category Name - centered overlay */}
              <div className="absolute inset-0 flex items-center justify-center p-2 z-10">
                <span 
                  className="text-sm font-medium text-center leading-tight"
                  style={{ 
                    color: selectedCategory?.id === category.id ? 'white' : colors.primary,
                    textShadow: selectedCategory?.id === category.id ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  {toTitleCase(category.name)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">No items found</h3>
            <p className="text-slate-600 mb-8">Try adjusting your search or filter</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setIsVegSelected(false);
                setIsNonVegSelected(false);
              }}
              className="text-white px-8 py-3 rounded-xl font-semibold transition-colors duration-200"
              style={{ backgroundColor: '#0476b1' }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const cartQuantity = getCartItemQuantity(item.id);
              const isOutOfStock = !item.isAvailable;
              const hasImage = hasValidImage(item.image);
              
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 ${
                    isOutOfStock ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Item Details - Left Side */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Vegetarian/Non-vegetarian indicator */}
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          item.isVegetarian ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
                        }`}>
                          <div className={`w-2 h-2 rounded ${
                            item.isVegetarian ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                        <h3 className="font-semibold text-slate-900 text-base line-clamp-2 flex-1">{toTitleCase(item.name)}</h3>
                      </div>
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold" style={{ color: '#0476b1' }}>
                          {formatCurrency(item.price, tableInfo?.currency || state.tableInfo?.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Item Image and Add Button - Right Side */}
                    {hasImage && (
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        </div>
                        
                        {/* Out of Stock Overlay */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                            <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-medium">
                              Out of Stock
                            </span>
                          </div>
                        )}

                        {/* Add Button */}
                        {!isOutOfStock && (
                          <div className="absolute -bottom-2 -right-2">
                            {cartQuantity > 0 ? (
                              <div className="flex items-center gap-1 bg-white rounded-full shadow-lg p-1">
                                <button
                                  onClick={() => handleQuantityChange(item.id, cartQuantity - 1)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200"
                                  style={{ backgroundColor: '#f0f7fc', color: '#0476b1' }}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-semibold text-slate-900 min-w-[1.5rem] text-center">
                                  {cartQuantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.id, cartQuantity + 1)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200"
                                  style={{ backgroundColor: '#f0f7fc', color: '#0476b1' }}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="px-8 py-2 rounded-xl text-white text-sm font-semibold transition-colors duration-200"
                                style={{ backgroundColor: '#0476b1' }}
                              >
                                Add
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* No Image - Only Add Button */}
                    {!hasImage && !isOutOfStock && (
                      <div className="flex items-center">
                        {cartQuantity > 0 ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, cartQuantity - 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
                              style={{ backgroundColor: '#f0f7fc', color: '#0476b1' }}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-semibold text-slate-900 min-w-[1.5rem] text-center">
                              {cartQuantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, cartQuantity + 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
                              style={{ backgroundColor: '#f0f7fc', color: '#0476b1' }}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-8 py-2 rounded-xl text-white font-semibold transition-colors duration-200"
                            style={{ backgroundColor: '#0476b1' }}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Summary Bar removed: BottomNav provides Cart access */}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => {
          console.log("Menu page onClose called, setting isCartOpen to false");
          setIsCartOpen(false);
          // Remove cart=1 from URL so it doesn't immediately reopen
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (url.searchParams.has('cart')) {
              url.searchParams.delete('cart');
              window.history.replaceState({}, '', url.toString());
            }
          }
        }}
        currentOrderTotal={currentOrderTotal}
        grandTotal={grandTotal}
      />
      
      {/* OTP Overlay */}
      <OTPOverlay
        isOpen={isOTPOverlayOpen}
        onClose={() => {
          setIsOTPOverlayOpen(false);
          setPendingItem(null);
        }}
        onSuccess={handleOTPSuccess}
        pendingItem={pendingItem}
        tableInfo={tableInfo}
      />
      
      <BottomNav />
      
      {/* Branding Footer */}
      <div className="bg-slate-50 border-t border-slate-200 py-4 px-4">
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <span className="text-sm">Built by</span>
          <a 
            href="https://cogwave.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity duration-200"
          >
            <img 
              src="/images/hotel-360-logo.jpg" 
              alt="Hotel 360" 
              className="h-10 w-auto"
            />
          </a>
        </div>
      </div>
    </div>
  );
}