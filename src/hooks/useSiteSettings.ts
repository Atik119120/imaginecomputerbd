import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  headerPhone: string;
  headerTagline: string;
}

const defaults: SiteSettings = {
  siteName: 'Amazing Computer',
  logoUrl: '',
  faviconUrl: '',
  headerPhone: '(880) 123 456 789',
  headerTagline: 'Feel the Pure Style',
};

const fetchSiteSettings = async (): Promise<SiteSettings> => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .in('key', ['logo', 'site_name', 'favicon', 'header_content']);
  if (error) throw error;

  const updated = { ...defaults };
  data?.forEach((setting: any) => {
    if (setting.key === 'site_name') updated.siteName = setting.value?.name || defaults.siteName;
    if (setting.key === 'logo') updated.logoUrl = setting.value?.url || '';
    if (setting.key === 'favicon') updated.faviconUrl = setting.value?.url || '';
    if (setting.key === 'header_content') {
      updated.headerPhone = setting.value?.phone || defaults.headerPhone;
      updated.headerTagline = setting.value?.tagline || defaults.headerTagline;
    }
  });
  return updated;
};

export const useSiteSettings = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['site_settings_main'],
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000,
  });

  const settings = data || defaults;

  useEffect(() => {
    if (settings.faviconUrl) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = settings.faviconUrl;
      else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = settings.faviconUrl;
        document.head.appendChild(newLink);
      }
    }
    // Per-page <title> is managed by react-helmet-async SEO component.
  }, [settings.faviconUrl, settings.siteName]);

  return {
    ...settings,
    loading: isLoading,
    refetch: () => qc.invalidateQueries({ queryKey: ['site_settings_main'] }),
  };
};
