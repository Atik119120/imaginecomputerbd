import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useFooterSettings } from '@/hooks/useFooterSettings';

interface DynamicLegalPageProps {
  slug: string;
  fallbackTitle: string;
}

export const DynamicLegalPage = ({ slug, fallbackTitle }: DynamicLegalPageProps) => {
  const [title, setTitle] = useState(fallbackTitle);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { footerContent } = useFooterSettings();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('page_contents')
          .select('title, content')
          .eq('slug', slug)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setTitle(data.title || fallbackTitle);
          setContent(data.content || '');
        }
      } catch (err) {
        console.error('Error loading page content:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [slug, fallbackTitle]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto bg-background rounded-xl p-8 md:p-12 shadow-sm">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              {title}
            </h1>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <article className="prose prose-neutral dark:prose-invert max-w-none
                prose-headings:font-heading prose-headings:text-primary
                prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-base prose-h3:font-semibold prose-h3:text-foreground
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-li:text-muted-foreground
                prose-strong:text-foreground
                prose-a:text-primary hover:prose-a:underline">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </article>
            )}

            {/* Dynamic contact footer */}
            <section className="mt-10 bg-secondary/50 rounded-lg p-6">
              <h2 className="font-heading text-xl font-semibold mb-4 text-primary">
                Contact Us
              </h2>
              <p className="text-muted-foreground mb-4">
                For any questions, please reach out to us:
              </p>
              <div className="space-y-2 text-foreground">
                <p><strong>Phone:</strong> {footerContent.phone}</p>
                <p><strong>Email:</strong> {footerContent.email}</p>
                {footerContent.address && (
                  <p><strong>Address:</strong> {footerContent.address}</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <CartSidebar />
      <Footer />
    </div>
  );
};
