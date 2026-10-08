import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentNumbers {
  bkash: string;
  nagad: string;
  rocket: string;
}

interface EnabledMethods {
  cod: boolean;
  bkash: boolean;
  nagad: boolean;
  rocket: boolean;
}

export const usePaymentSettings = () => {
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumbers>({
    bkash: '01XXXXXXXXX',
    nagad: '01XXXXXXXXX',
    rocket: '01XXXXXXXXX',
  });
  const [enabledMethods, setEnabledMethods] = useState<EnabledMethods>({
    cod: true,
    bkash: true,
    nagad: true,
    rocket: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('key,value')
          .in('key', ['payment_numbers', 'payment_methods']);

        if (error) {
          console.error('Error fetching payment settings:', error);
          return;
        }

        data?.forEach((row: any) => {
          if (row.key === 'payment_numbers' && row.value) {
            const numbers = row.value as PaymentNumbers;
            setPaymentNumbers({
              bkash: numbers.bkash || '01XXXXXXXXX',
              nagad: numbers.nagad || '01XXXXXXXXX',
              rocket: numbers.rocket || '01XXXXXXXXX',
            });
          }
          if (row.key === 'payment_methods' && Array.isArray(row.value)) {
            const list = (row.value as string[]).map((s) => s.toLowerCase());
            setEnabledMethods({
              cod: list.includes('cod'),
              bkash: list.includes('bkash'),
              nagad: list.includes('nagad'),
              rocket: list.includes('rocket') || list.includes('roket'),
            });
          }
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentSettings();
  }, []);

  return { paymentNumbers, enabledMethods, loading };
};
