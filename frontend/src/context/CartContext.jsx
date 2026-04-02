import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const CartContext = createContext(undefined);

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const getHeaders = useCallback(() => {
    const h = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, []);

  const refreshCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setItems([]);
      setItemCount(0);
      setSubtotal(0);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cart`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setItemCount(data.item_count || 0);
        setSubtotal(data.subtotal || 0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (item) => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(item)
      });
      if (response.ok) { await refreshCart(); return true; }
      return false;
    } catch { return false; } finally { setIsLoading(false); }
  }, [getHeaders, refreshCart]);

  const removeFromCart = useCallback(async (itemId) => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cart/${itemId}`, {
        method: 'DELETE', headers: getHeaders()
      });
      if (response.ok) { await refreshCart(); return true; }
      return false;
    } catch { return false; } finally { setIsLoading(false); }
  }, [getHeaders, refreshCart]);

  const updateCartItem = useCallback(async (itemId, years) => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cart/${itemId}?years=${years}`, {
        method: 'PUT', headers: getHeaders()
      });
      if (response.ok) { await refreshCart(); return true; }
      return false;
    } catch { return false; } finally { setIsLoading(false); }
  }, [getHeaders, refreshCart]);

  const clearCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cart`, {
        method: 'DELETE', headers: getHeaders()
      });
      if (response.ok) { setItems([]); setItemCount(0); setSubtotal(0); return true; }
      return false;
    } catch { return false; } finally { setIsLoading(false); }
  }, [getHeaders]);

  const checkout = useCallback(async (originUrl) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cart/checkout?origin_url=${encodeURIComponent(originUrl)}`, {
        method: 'POST', headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.is_free) await refreshCart();
        return { checkoutUrl: data.checkout_url, sessionId: data.session_id, isFree: data.is_free || false };
      }
      return null;
    } catch { return null; } finally { setIsLoading(false); }
  }, [getHeaders, refreshCart]);

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
