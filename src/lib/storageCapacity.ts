import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Verifica a capacidade de uso dos buckets do Supabase Storage
 * e exibe um aviso caso ultrapasse o limite configurado por env.
 *
 * Configuração opcional via .env:
 * - VITE_STORAGE_CAP_MB: limite total (em MB). Se não definido, não verifica.
 * - VITE_STORAGE_WARN_PCT: percentual para alerta (ex.: 90 para 90%). Default: 90.
 */
export async function checkSupabaseStorageCapacityOnce(): Promise<void> {
  const capMbEnv = import.meta.env.VITE_STORAGE_CAP_MB;
  if (!capMbEnv) return; // Sem limite configurado, não checa

  const warnPctEnv = Number(import.meta.env.VITE_STORAGE_WARN_PCT ?? 90);
  const totalCapBytes = Number(capMbEnv) * 1024 * 1024;

  try {
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
    if (bucketErr || !buckets) return;

    let totalUsed = 0;
    // Soma tamanhos de arquivos na raiz de cada bucket (superficial). Para pastas profundas, amplie conforme necessário.
    for (const bucket of buckets) {
      const { data: files, error } = await supabase.storage.from(bucket.name).list('', { limit: 1000 });
      if (error || !files) continue;
      for (const f of files) {
        if (typeof (f as any).metadata?.size === 'number') {
          totalUsed += (f as any).metadata.size;
        }
      }
    }

    const usedPct = totalCapBytes > 0 ? Math.round((totalUsed / totalCapBytes) * 100) : 0;
    if (usedPct >= warnPctEnv) {
      toast.warning(
        `Limite de armazenamento próximo: ${usedPct}% usado`,
        { description: `Consumo: ${(totalUsed / (1024*1024)).toFixed(1)}MB de ${(totalCapBytes / (1024*1024)).toFixed(0)}MB` }
      );
    }
  } catch (_) {
    // falha silenciosa
  }
}


