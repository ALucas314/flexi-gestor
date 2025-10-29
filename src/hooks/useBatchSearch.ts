import { useState, useEffect, useMemo } from "react";
import { BatchWithProduct, getAllAvailableBatches } from "@/lib/batches";

export const useBatchSearch = (userId: string | undefined, products: any[]) => {
  const [availableBatches, setAvailableBatches] = useState<BatchWithProduct[]>([]);
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");

  useEffect(() => {
    const loadBatches = async () => {
      if (userId) {
        const batches = await getAllAvailableBatches(userId);
        setAvailableBatches(batches);
      }
    };

    loadBatches();
  }, [userId, products]);

  const results = useMemo(() => {
    const batchTerm = batchSearchTerm.toLowerCase().trim();
    const productTerm = productSearchTerm.toLowerCase().trim();
    
    // OBRIGATÓRIO: ambos os campos devem estar preenchidos
    if (!batchTerm || !productTerm) return [];
    
    // Filtrar por número do lote E produto/SKU (ambos obrigatórios)
    return availableBatches.filter((batch) => {
      const matchesBatch = batch.batchNumber.toLowerCase().includes(batchTerm);
      const matchesProduct = 
        batch.product.name.toLowerCase().includes(productTerm) ||
        batch.product.sku.toLowerCase().includes(productTerm);
      
      return matchesBatch && matchesProduct;
    });
  }, [batchSearchTerm, productSearchTerm, availableBatches]);

  return {
    availableBatches,
    batchSearchTerm,
    setBatchSearchTerm,
    productSearchTerm,
    setProductSearchTerm,
    results,
  };
};

