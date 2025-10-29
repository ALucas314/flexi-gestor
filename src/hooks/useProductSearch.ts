import { useState, useEffect, useMemo } from "react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  managedByBatch?: boolean;
}

export const useProductSearch = (products: Product[]) => {
  const [searchTerm, setSearchTerm] = useState("");

  const results = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase().trim();
    return products.filter(
      (product) =>
        !product.managedByBatch &&
        product.stock &&
        product.stock > 0 &&
        (product.name.toLowerCase().includes(term) ||
          product.sku.toLowerCase().includes(term))
    );
  }, [searchTerm, products]);

  return {
    searchTerm,
    setSearchTerm,
    results,
  };
};

