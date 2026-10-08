import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useWhatsappNumber = () => {
  const { data } = useQuery({
    queryKey: ['whatsapp_number'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'whatsapp_number')
        .maybeSingle();
      if (!data?.value) return '';
      const num = typeof data.value === 'string' ? data.value : String(data.value);
      return num.replace(/[^0-9+]/g, '');
    },
    staleTime: 5 * 60 * 1000,
  });
  return data || '';
};
