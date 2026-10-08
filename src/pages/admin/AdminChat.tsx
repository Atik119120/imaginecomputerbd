import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, User, Phone, Clock, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

interface Conversation {
  id: string;
  session_id: string;
  visitor_name: string | null;
  visitor_contact: string | null;
  status: string;
  last_message_at: string;
  unread_admin_count: number;
  created_at: string;
}

interface Message {
  id: string;
  sender_type: 'customer' | 'admin' | 'bot';
  sender_name: string | null;
  message: string;
  created_at: string;
}

export const AdminChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();

    // Realtime: new messages or conversation updates
    const channel = supabase
      .channel('admin-chat')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_conversations' },
        () => loadConversations()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as Message & { conversation_id: string };
          if (activeConv && newMsg.conversation_id === activeConv.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConv?.id]);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(100);
    if (data) setConversations(data as Conversation[]);
  };

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);

    // Mark admin as read
    if (conv.unread_admin_count > 0) {
      await supabase
        .from('chat_conversations')
        .update({ unread_admin_count: 0 })
        .eq('id', conv.id);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !activeConv || sending) return;
    const text = reply.trim();
    setReply('');
    setSending(true);

    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: activeConv.id,
      sender_type: 'admin',
      sender_name: user?.email?.split('@')[0] || 'Admin',
      message: text,
    });

    if (error) {
      toast.error('Reply failed: ' + error.message);
      setReply(text);
    } else {
      await supabase
        .from('chat_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_customer_count: 0,
        })
        .eq('id', activeConv.id);

      // Email the customer if their contact looks like an email
      const contact = activeConv.visitor_contact || '';
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
        supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'admin_reply',
            to: contact,
            data: {
              customerName: activeConv.visitor_name || 'there',
              reply: text,
            },
          },
        }).catch((err) => console.error('Admin reply email failed:', err));
      }
    }
    setSending(false);
  };

  const handleStatusChange = async (status: string) => {
    if (!activeConv) return;
    await supabase.from('chat_conversations').update({ status }).eq('id', activeConv.id);
    setActiveConv({ ...activeConv, status });
    loadConversations();
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col lg:flex-row gap-4 bg-card rounded-xl border border-border overflow-hidden">
      {/* Conversation list */}
      <div className={`lg:w-80 lg:border-r border-border flex flex-col ${activeConv ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Live Chats
            <span className="ml-auto text-xs text-muted-foreground">{conversations.length}</span>
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={`w-full text-left p-3 border-b border-border hover:bg-secondary/50 transition-colors ${
                  activeConv?.id === conv.id ? 'bg-secondary' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-brand-red/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {(conv.visitor_name?.[0] || 'G').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conv.visitor_name || 'Guest'}
                      </p>
                      {conv.visitor_contact && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {conv.visitor_contact}
                        </p>
                      )}
                    </div>
                  </div>
                  {conv.unread_admin_count > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                      {conv.unread_admin_count}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="capitalize">{conv.status}</span>
                  <span>{formatTime(conv.last_message_at)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${activeConv ? 'flex' : 'hidden lg:flex'}`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a conversation to start replying</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConv(null)}
                  className="lg:hidden text-sm text-primary"
                >
                  ← Back
                </button>
                <div className="w-10 h-10 rounded-full bg-brand-red/10 text-primary flex items-center justify-center font-semibold">
                  {(activeConv.visitor_name?.[0] || 'G').toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    {activeConv.visitor_name || 'Guest'}
                  </p>
                  {activeConv.visitor_contact && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {activeConv.visitor_contact}
                    </p>
                  )}
                </div>
              </div>
              <select
                value={activeConv.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs bg-secondary border border-border rounded-lg px-2 py-1.5"
              >
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20">
              {messages.map((msg) => {
                const isAdmin = msg.sender_type === 'admin';
                const isBot = msg.sender_type === 'bot';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                        isAdmin
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : isBot
                          ? 'bg-accent/15 border border-accent/30 rounded-bl-sm'
                          : 'bg-card border border-border rounded-bl-sm'
                      }`}
                    >
                      <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                        {isBot ? '🤖 Bot' : isAdmin ? '👤 You' : `💬 ${msg.sender_name || 'Customer'}`}
                      </p>
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className="text-[10px] opacity-60 mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleReply();
              }}
              className="p-3 border-t border-border flex gap-2"
            >
              <Input
                placeholder="Type your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                disabled={sending}
              />
              <Button type="submit" disabled={!reply.trim() || sending}>
                <Send className="w-4 h-4 mr-1.5" />
                Send
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
