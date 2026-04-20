import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CartContext = createContext(undefined);

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const resetCart = useCallback(() => {
    setItems([]);
    setItemCount(0);
    setSubtotal(0);
  }, []);

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/cart`, { withCredentials: true });
      const data = response.data || {};
      setItems(data.items || []);
      setItemCount(data.item_count || 0);
      setSubtotal(data.subtotal || 0);
    } catch (error) {
      resetCart();
    } finally {
      setIsLoading(false);
    }
  }, [resetCart]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (item) => {
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/cart/add`, item, { withCredentials: true });
      await refreshCart();
      return true;
    } catch { return false; } finally { setIsLoading(false); }
  }, [refreshCart]);

  const removeFromCart = useCallback(async (itemId) => {
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/api/cart/${itemId}`, { withCredentials: true });
      await refreshCart();
      return true;
    } catch { return false; } finally { setIsLoading(false); }
  }, [refreshCart]);

  const updateCartItem = useCallback(async (itemId, years) => {
    setIsLoading(true);
    try {
      await axios.put(`${API_URL}/api/cart/${itemId}?years=${years}`, {}, { withCredentials: true });
      await refreshCart();
      return true;
    } catch { return false; } finally { setIsLoading(false); }
  }, [refreshCart]);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/api/cart`, { withCredentials: true });
      resetCart();
      return true;
    } catch { return false; } finally { setIsLoading(false); }
  }, [resetCart]);

  const checkout = useCallback(async (originUrl) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/cart/checkout?origin_url=${encodeURIComponent(originUrl)}`,
        {},
        { withCredentials: true }
      );
      const data = response.data || {};
      if (data.is_free) await refreshCart();
      return { checkoutUrl: data.checkout_url, sessionId: data.session_id, isFree: data.is_free || false };
    } catch { return null; } finally { setIsLoading(false); }
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, isLoading, addToCart, removeFromCart, updateCartItem, clearCart, refreshCart, checkout }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
