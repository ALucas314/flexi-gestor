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
        // Removido filtro que excluía produtos gerenciados por lote.
        // Agora devolvemos qualquer produto com estoque > 0 que case nome ou SKU.
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

