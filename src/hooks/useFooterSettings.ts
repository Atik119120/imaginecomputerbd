import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FooterSettings {
  tagline: string;
  phone: string;
  email: string;
  address: string;
  copyright: string;
}

interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
}

interface PaymentMethods {
  bkash: boolean;
  nagad: boolean;
  roket: boolean;
  cod: boolean;
}

const defaultFooter: FooterSettings = {
  tagline: 'Feel the Pure Style',
  phone: '09617827080',
  email: 'admin@gadgeterdokanbd.com',
  address: 'Dhaka, BD',
  copyright: 'Gadget er Dokan',
};
const defaultSocial: SocialLinks = { facebook: '', instagram: '', youtube: '', linkedin: '' };
const defaultPayments: PaymentMethods = { bkash: true, nagad: true, roket: true, cod: true };

const fetchFooterData = async () => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .in('key', ['footer_content', 'social_links', 'payment_methods']);
  if (error) throw error;

  let footerContent = { ...defaultFooter };
  let socialLinks = { ...defaultSocial };
  let paymentMethods = { ...defaultPayments };

  data?.forEach((setting: any) => {
    if (setting.key === 'footer_content' && setting.value) {
      footerContent = { ...defaultFooter, ...setting.value };
    }
    if (setting.key === 'social_links' && setting.value) {
      socialLinks = { ...defaultSocial, ...setting.value };
    }
    if (setting.key === 'payment_methods') {
      const methods = (setting.value as string[]) || [];
      paymentMethods = {
        bkash: methods.includes('bkash'),
        nagad: methods.includes('nagad'),
        roket: methods.includes('roket'),
        cod: methods.includes('cod'),
      };
    }
  });

  return { footerContent, socialLinks, paymentMethods };
};

export const useFooterSettings = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['footer_settings'],
    queryFn: fetchFooterData,
    staleTime: 5 * 60 * 1000,
  });

  return {
    footerContent: data?.footerContent || defaultFooter,
    socialLinks: data?.socialLinks || defaultSocial,
    paymentMethods: data?.paymentMethods || defaultPayments,
    loading: isLoading,
  };
};
