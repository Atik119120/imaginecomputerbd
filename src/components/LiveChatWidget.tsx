import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { useWhatsappNumber } from '@/hooks/useWhatsappNumber';

const SESSION_KEY = 'lcb_chat_session_id';
const CONV_KEY = 'lcb_chat_conversation_id';

interface Message {
  id: string;
  sender_type: 'customer' | 'admin' | 'bot';
  sender_name: string | null;
  message: string;
  created_at: string;
}

export const LiveChatWidget = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const whatsappNumber = useWhatsappNumber();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hide on admin and auth pages
  const hidden = location.pathname.startsWith('/admin') || location.pathname.startsWith('/auth');




  // Listen for external open events (from mobile bottom nav)
  useEffect(() => {
    const openHandler = () => handleOpen();
    window.addEventListener('lcb:open-chat', openHandler);
    return () => window.removeEventListener('lcb:open-chat', openHandler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Restore existing conversation
  useEffect(() => {
    if (hidden) return;
    const existingConv = localStorage.getItem(CONV_KEY);
    if (existingConv) {
      setConversationId(existingConv);
      loadMessages(existingConv);
    }
  }, [hidden]);

  // Realtime subscribe for admin replies
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Auto scroll
  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, open]);

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
  };

  const ensureConversation = async (): Promise<string | null> => {
    if (conversationId) return conversationId;

    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, sessionId);
    }

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        session_id: sessionId,
        visitor_name: name || null,
        visitor_contact: contact || null,
        unread_admin_count: 0,
      })
      .select('id')
      .single();

    if (error || !data) {
      toast.error('Could not start chat. Please try again.');
      return null;
    }

    localStorage.setItem(CONV_KEY, data.id);
    setConversationId(data.id);

    // Send welcome bot message
    await supabase.from('chat_messages').insert({
      conversation_id: data.id,
      sender_type: 'bot',
      sender_name: 'Support Bot',
      message:
        "👋 Welcome to Lily Closet BD! Please share your problem or question, and our support team will get back to you shortly. For instant help, you can also reach us on WhatsApp.",
    });

    return data.id;
  };

  const handleOpen = async () => {
    setOpen(true);
    // Skip info form — chat opens directly
    setShowInfoForm(false);
    if (!name) setName('Guest');
  };

  const handleStartChat = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setSending(true);
    const convId = await ensureConversation();
    setSending(false);
    if (convId) {
      setShowInfoForm(false);
      loadMessages(convId);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    let convId = conversationId;
    if (!convId) {
      convId = await ensureConversation();
      if (!convId) {
        setSending(false);
        return;
      }
    }

    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: convId,
      sender_type: 'customer',
      sender_name: name || 'Customer',
      message: text,
    });

    if (error) {
      toast.error('Message failed to send');
      setInput(text);
    } else {
      // Bump unread for admin
      await supabase
        .from('chat_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_admin_count: (await getUnreadCount(convId)) + 1,
        })
        .eq('id', convId);

      // Notify all admins via email (non-blocking)
      supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'support_message',
          data: {
            visitorName: name || 'Guest',
            visitorContact: contact || null,
            message: text,
          },
        },
      }).catch((err) => console.error('Admin notify failed:', err));
    }
    setSending(false);
  };

  const getUnreadCount = async (convId: string): Promise<number> => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('unread_admin_count')
      .eq('id', convId)
      .single();
    return data?.unread_admin_count || 0;
  };

  const handleWhatsApp = () => {
    if (!whatsappNumber) {
      toast.error('WhatsApp number not configured yet');
      return;
    }
    const msg = encodeURIComponent("Hi! I have a question about your products.");
    window.open(`https://wa.me/${whatsappNumber.replace('+', '')}?text=${msg}`, '_blank');
  };

  if (hidden) return null;

  return (
    <>
      {/* Floating buttons stack — bottom-right, lifted above mobile bottom nav */}
      <div className="fixed right-0 z-40 flex flex-col gap-3 bottom-20 lg:bottom-6 pr-0">
        {/* WhatsApp button */}
        {whatsappNumber && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWhatsApp}
            className="w-9 h-9 rounded-l-lg bg-[#25D366] text-white shadow-md shadow-[#25D366]/30 flex items-center justify-center hover:shadow-lg transition-shadow"
            aria-label="WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
          </motion.button>
        )}

        {/* Live chat button */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpen}
          className="hidden lg:flex w-9 h-9 rounded-l-lg bg-accent text-accent-foreground shadow-md shadow-accent/40 items-center justify-center hover:shadow-lg transition-shadow relative"
          aria-label="Open chat"
        >
          <MessageCircle className="w-4 h-4" />
          {messages.some((m) => m.sender_type === 'admin') && !open && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
          )}
        </motion.button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 left-4 sm:left-auto bottom-20 sm:bottom-24 lg:bottom-24 sm:right-4 sm:w-96 max-h-[70vh] sm:max-h-[600px] bg-background border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Customer Support</h3>
                  <p className="text-xs opacity-90 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    We typically reply within minutes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            {showInfoForm ? (
              <div className="flex-1 p-5 flex flex-col gap-4 overflow-auto">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-7 h-7 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-1">Welcome! 👋</h4>
                  <p className="text-sm text-muted-foreground">
                    Please share a few details so we can assist you better.
                  </p>
                </div>
                <div className="space-y-3">
                  <Input
                    placeholder="Your name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    placeholder="Phone or Email (optional)"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleStartChat}
                  disabled={sending || !name.trim()}
                  className="w-full"
                >
                  {sending ? 'Starting...' : 'Start Chat'}
                </Button>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20">
                  {messages.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Start the conversation...
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isCustomer = msg.sender_type === 'customer';
                    const isBot = msg.sender_type === 'bot';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${
                            isCustomer
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : isBot
                              ? 'bg-accent/15 text-foreground border border-accent/30 rounded-bl-sm'
                              : 'bg-card border border-border rounded-bl-sm'
                          }`}
                        >
                          {!isCustomer && (
                            <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                              {isBot ? '🤖 ' : '💬 '}
                              {msg.sender_name || (isBot ? 'Bot' : 'Support')}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border bg-background">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Type your message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || sending}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  {whatsappNumber && (
                    <button
                      onClick={handleWhatsApp}
                      className="mt-2 w-full text-xs text-muted-foreground hover:text-[#25D366] transition-colors flex items-center justify-center gap-1.5"
                    >
                      Or chat with us directly on WhatsApp →
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
