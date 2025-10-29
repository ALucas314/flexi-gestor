import { useState, useCallback } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  selectedBatchId?: string;
  selectedBatchNumber?: string;
}

export const usePDVCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.id === item.id && cartItem.selectedBatchId === item.selectedBatchId
      );

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id && cartItem.selectedBatchId === item.selectedBatchId
            ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
            : cartItem
        );
      }

      return [...prevCart, { ...item, quantity: item.quantity || 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string, batchId?: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => {
        if (batchId) {
          return !(item.id === id && item.selectedBatchId === batchId);
        }
        return item.id !== id;
      })
    );
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const updateBatch = useCallback((itemId: string, currentBatchId: string | undefined, newBatchId: string, batchNumber: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId && item.selectedBatchId === currentBatchId
          ? { ...item, selectedBatchId: newBatchId, selectedBatchNumber: batchNumber }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    updateBatch,
    clearCart,
    getTotal,
  };
};

