import { reportError } from "@/lib/errorReporting";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Send,
  Search,
  MessageCircle,
  Check,
  CheckCheck,
  X,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Smile,
  Image as ImageIcon,
  Mic,
  Square,
  Heart,
  Play,
  Pause,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConversations, type Conversation } from "@/hooks/useConversations";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/timeAgo";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  media_url?: string | null;
  media_type?: string | null;
}

interface SearchProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface OpenDmDetail {
  userId?: string;
  userName?: string;
  userAvatar?: string | null;
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "maintenant";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) {
    return date.toLocaleDateString("fr-FR", { weekday: "short" });
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: Record<string, Message[]> = {};

  messages.forEach((message) => {
    const date = new Date(message.created_at).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
  });

  return Object.entries(groups).map(([date, dayMessages]) => ({
    date,
    messages: dayMessages,
  }));
}

function VoiceMessagePlayer({ src, isMine }: { src: string; isMine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setProgress(audio.currentTime / (audio.duration || 1)));
    audio.addEventListener("ended", () => { setPlaying(false); setProgress(0); });
    return () => { audio.pause(); audio.src = ""; };
  }, [src]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().catch(() => {}); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <button onClick={toggle} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      <div className="flex-1 space-y-1">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-current rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="text-2xs opacity-60">{duration > 0 ? fmt(playing ? progress * duration : duration) : "..."}</span>
      </div>
    </div>
  );
}

function ChatView({
  conversation,
  onBack,
  markConversationRead,
}: {
  conversation: Conversation;
  onBack: () => void;
  markConversationRead: (conversationId: string) => Promise<void>;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reactedMessages, setReactedMessages] = useState<Set<string>>(new Set());
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgTapRef = useRef<{ id: string; time: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 30;
  const markReadRef = useRef(markConversationRead);

  useEffect(() => {
    markReadRef.current = markConversationRead;
  }, [markConversationRead]);

  const fetchMessages = useCallback(
    async (pageNum: number) => {
      try {
        const from = pageNum * PAGE_SIZE;
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;

        const sorted = (data || []).reverse();
        setHasMore((data || []).length === PAGE_SIZE);

        if (pageNum === 0) {
          setMessages(sorted);
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }, 60);
        } else {
          const prevHeight = scrollRef.current?.scrollHeight || 0;
          setMessages((prev) => [...sorted, ...prev]);
          requestAnimationFrame(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
            }
          });
        }
      } catch (err) {
       
        toast.error("Impossible de charger les messages");
      }
    },
    [conversation.id]
  );

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchMessages(nextPage);
    } catch (err) {
     
      toast.error("Impossible de charger plus de messages");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page, fetchMessages]);

  useEffect(() => {
    const load = async () => {
      try {
        setPage(0);
        await fetchMessages(0);
        await markReadRef.current(conversation.id);
        setTimeout(() => inputRef.current?.focus(), 0);
      } catch (err) {
       
        toast.error("Impossible d'ouvrir la conversation");
      }
    };

    void load();
  }, [conversation.id, fetchMessages]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    if (scrollRef.current.scrollTop < 80) {
      void loadMoreMessages();
    }
  }, [loadMoreMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          try {
            const message = payload.new as Message;

            setMessages((prev) =>
              prev.some((m) => m.id === message.id) ? prev : [...prev, message]
            );

            setTimeout(() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }
            }, 50);

            if (user && message.sender_id !== user.id) {
              const { error: markReadError } = await supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", message.id);

              if (markReadError) throw markReadError;
              await markReadRef.current(conversation.id);
            }
          } catch (err) {
           
            toast.error("Erreur de synchronisation des messages");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === updated.id ? { ...message, is_read: updated.is_read } : message
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image trop lourde (max 5 Mo)"); return; }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `dm/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("vibes_media").upload(path, file);
    if (error) { reportError(error, { context: "DM image upload" }); toast.error("Échec de l'envoi de l'image"); return null; }
    const { data: { publicUrl } } = supabase.storage.from("vibes_media").getPublicUrl(path);
    return publicUrl;
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedImage) || !user || sending) return;

    const content = newMessage.trim();
    const imageToUpload = selectedImage;
    setNewMessage("");
    clearImage();
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
      media_url: imagePreview,
      media_type: imageToUpload ? "image" : null,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 40);

    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (imageToUpload) {
        setUploading(true);
        mediaUrl = await uploadImage(imageToUpload);
        setUploading(false);
        if (!mediaUrl) { toast.error("Erreur lors de l'upload de l'image"); }
        mediaType = mediaUrl ? "image" : null;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: content || (mediaUrl ? "" : content),
          ...(mediaUrl && { media_url: mediaUrl, media_type: mediaType }),
        } as any)
        .select("*")
        .maybeSingle();

      if (insertError) throw insertError;

      if (inserted) {
        setMessages((prev) =>
          prev.map((message) => (message.id === tempId ? (inserted as Message) : message))
        );
      }

      const { error: convoUpdateError } = await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);

      if (convoUpdateError) {
       
      }

      // Notification silencieuse (intentionnel)
      try {
        await supabase.from("notifications" as any).insert({
          user_id: conversation.otherUserId,
          type: "message",
          title: "Nouveau message",
          body: `${user.email?.split("@")[0] || "Quelqu'un"} t'a envoyé un message`,
          vibe_id: null,
        });
      } catch {
        // intentionally silent
      }
    } catch (err) {
     
      setMessages((prev) => prev.filter((message) => message.id !== tempId));
      setNewMessage(content);
      toast.error("Message non envoyé");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const messageGroups = groupMessagesByDate(messages);
  const lastSentByMe = [...messages].reverse().find((m) => m.sender_id === user?.id);

  return (
    <div className="h-full bg-background flex flex-col">
      {/* ════ HEADER ════ */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/60 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card active:scale-95 transition-all"
            aria-label="Retour"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <Avatar className="w-9 h-9 border border-border/60">
            <AvatarImage src={conversation.otherUserAvatar || undefined} alt={conversation.otherUserName} />
            <AvatarFallback className="bg-card text-foreground text-xs font-semibold">
              {conversation.otherUserName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{conversation.otherUserName}</p>
            <p className="text-xs text-muted-foreground">Actif maintenant</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-card active:scale-95 transition-all"
            aria-label="Appeler"
          >
            <Phone className="w-4 h-4 text-foreground" />
          </button>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-card active:scale-95 transition-all"
            aria-label="Visio"
          >
            <Video className="w-4 h-4 text-foreground" />
          </button>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-card active:scale-95 transition-all"
            aria-label="Infos"
          >
            <Info className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* ════ MESSAGES ════ */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-3"
      >
        <AnimatePresence>
          {loadingMore && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex justify-center py-1"
            >
              <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {hasMore && !loadingMore && messages.length >= PAGE_SIZE && (
          <button
            onClick={() => {
              void loadMoreMessages();
            }}
            className="w-full text-center text-xs text-gold py-1.5 hover:opacity-80 transition-opacity"
          >
            ↑ Voir les messages précédents
          </button>
        )}

        {messages.length === 0 && !loadingMore && (
          <div className="h-full min-h-[45vh] flex flex-col items-center justify-center text-center px-6">
            <Avatar className="w-16 h-16 mb-3 border border-border/60">
              <AvatarImage src={conversation.otherUserAvatar || undefined} alt={conversation.otherUserName} />
              <AvatarFallback className="bg-card text-foreground text-lg font-semibold">
                {conversation.otherUserName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-base font-semibold text-foreground">{conversation.otherUserName}</p>
            <p className="text-sm text-muted-foreground mt-1">Commence la conversation 👋</p>
          </div>
        )}

        {messageGroups.map(({ date, messages: dayMessages }) => (
          <div key={date} className="space-y-1.5">
            <div className="flex items-center justify-center py-1">
              <span className="text-2xs text-muted-foreground bg-card border border-border/60 px-3 py-1 rounded-full">
                {date}
              </span>
            </div>

            <div className="space-y-1.5">
              {dayMessages.map((message, index) => {
                const isMine = message.sender_id === user?.id;
                const prevMessage = dayMessages[index - 1];
                const nextMessage = dayMessages[index + 1];
                const isFirstInGroup = !prevMessage || prevMessage.sender_id !== message.sender_id;
                const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id;
                const isLastSent = message.id === lastSentByMe?.id;
                const isTemp = message.id.startsWith("temp-");

                const bubbleRadius = isMine
                  ? `${isFirstInGroup ? "18px" : "8px"} 4px 4px ${isLastInGroup ? "18px" : "8px"}`
                  : `4px ${isFirstInGroup ? "18px" : "8px"} ${isLastInGroup ? "18px" : "8px"} 4px`;

                const hasReaction = reactedMessages.has(message.id);
                const handleMsgDoubleTap = () => {
                  const now = Date.now();
                  if (lastMsgTapRef.current && lastMsgTapRef.current.id === message.id && now - lastMsgTapRef.current.time < 300) {
                    setReactedMessages(prev => { const n = new Set(prev); if (n.has(message.id)) n.delete(message.id); else n.add(message.id); return n; });
                    try { navigator.vibrate?.(10); } catch {}
                    lastMsgTapRef.current = null;
                  } else {
                    lastMsgTapRef.current = { id: message.id, time: now };
                  }
                };

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-1.5 ${isMine ? "justify-end" : "justify-start"}`}
                    onClick={handleMsgDoubleTap}
                  >
                    {!isMine && (
                      <div className="w-6">
                        {isLastInGroup ? (
                          <Avatar className="w-6 h-6 border border-border/60">
                            <AvatarImage
                              src={conversation.otherUserAvatar || undefined}
                              alt={conversation.otherUserName}
                            />
                            <AvatarFallback className="bg-card text-foreground text-2xs">
                              {conversation.otherUserName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : null}
                      </div>
                    )}

                    <div className={`max-w-[78%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`px-3 py-2 text-sm leading-relaxed break-words ${
                          isMine ? "bg-foreground text-background" : "bg-card border border-border text-foreground"
                        }`}
                        style={{ borderRadius: bubbleRadius }}
                      >
                        {message.media_url && message.media_type === "audio" ? (
                          <VoiceMessagePlayer src={message.media_url} isMine={isMine} />
                        ) : message.media_url ? (
                          <img
                            src={message.media_url}
                            alt=""
                            className="max-w-[200px] rounded-lg mb-1 cursor-pointer"
                            loading="lazy"
                            onClick={() => window.open(message.media_url!, '_blank')}
                          />
                        ) : null}
                        {message.media_type !== "audio" && message.content}
                      </div>

                      {/* Reaction heart */}
                      {hasReaction && (
                        <div className={`-mt-1 ${isMine ? "self-start -ml-1" : "self-end -mr-1"}`}>
                          <span className="text-xs">❤️</span>
                        </div>
                      )}

                      {isLastInGroup && (
                        <div className={`mt-0.5 px-1 flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
                          <span className="text-2xs text-muted-foreground">
                            {isTemp ? "Envoi…" : formatMessageTime(message.created_at)}
                          </span>
                          {isMine && isLastSent && !isTemp && (
                            message.is_read ? (
                              <CheckCheck className="w-3.5 h-3.5 text-gold" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-muted-foreground" />
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ════ IMAGE PREVIEW ════ */}
      {imagePreview && (
        <div className="px-4 py-2 border-t border-border">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-16 rounded-lg" />
            <button onClick={clearImage} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-2xs">✕</button>
          </div>
        </div>
      )}

      {/* ════ RECORDING INDICATOR ════ */}
      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-destructive/30 bg-destructive/5 px-4 py-2 flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-semibold text-destructive">Enregistrement...</span>
            <span className="text-xs text-muted-foreground ml-auto">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ INPUT ════ */}
      <div className="border-t border-border/60 bg-background px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors shrink-0"
          >
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            className="w-9 h-9 rounded-full border border-border/60 bg-card flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
            aria-label="Emoji"
          >
            <Smile className="w-4 h-4 text-foreground" />
          </button>

          <input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Message…"
            maxLength={1000}
            className="flex-1 bg-card border border-border/60 rounded-full px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/40 transition-colors"
          />

          <AnimatePresence mode="wait" initial={false}>
            {(newMessage.trim() || selectedImage) ? (
              <motion.button
                key="send"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => { void handleSend(); }}
                disabled={sending}
                className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                aria-label="Envoyer"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            ) : recording ? (
              <motion.button
                key="stop-rec"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => {
                  // Stop recording
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                    mediaRecorderRef.current.stop();
                  }
                  if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                  setRecording(false);
                  setRecordingTime(0);
                }}
                className="w-9 h-9 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Arrêter"
              >
                <Square className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={async () => {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const recorder = new MediaRecorder(stream);
                    audioChunksRef.current = [];
                    recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
                    recorder.onstop = async () => {
                      stream.getTracks().forEach(t => t.stop());
                      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                      // Upload voice message
                      const filename = `voice_${Date.now()}.webm`;
                      const path = `${user?.id}/${filename}`;
                      const { error: upErr } = await supabase.storage.from("vibes_media").upload(path, blob);
                      if (upErr) { toast.error("Erreur d'envoi audio"); return; }
                      const { data: urlData } = supabase.storage.from("vibes_media").getPublicUrl(path);
                      // Send as message with media
                      await supabase.from("messages").insert({
                        conversation_id: conversation.id,
                        sender_id: user?.id,
                        content: "🎤 Message vocal",
                        media_url: urlData.publicUrl,
                        media_type: "audio",
                      });
                      toast.success("Vocal envoyé !");
                      try { navigator.vibrate?.(10); } catch {}
                    };
                    recorder.start();
                    mediaRecorderRef.current = recorder;
                    setRecording(true);
                    setRecordingTime(0);
                    recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
                    try { navigator.vibrate?.(15); } catch {}
                  } catch {
                    toast.error("Micro non disponible");
                  }
                }}
                className="w-9 h-9 rounded-full border border-border/60 bg-card flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
                aria-label="Message vocal"
              >
                <Mic className="w-4 h-4 text-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  onClick,
}: {
  conversation: Conversation;
  onClick: () => void;
}) {
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card/60 active:bg-card/80 transition-colors text-left"
    >
      <div className="relative">
        <Avatar className="w-12 h-12 border border-border/60">
          <AvatarImage src={conversation.otherUserAvatar || undefined} alt={conversation.otherUserName} />
          <AvatarFallback className="bg-card text-foreground font-semibold">
            {conversation.otherUserName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-foreground text-background text-2xs font-bold flex items-center justify-center">
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-sm ${hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
            {conversation.otherUserName}
          </p>
          <span className="text-2xs text-muted-foreground shrink-0">
            {timeAgo(conversation.lastMessageAt)}
          </span>
        </div>

        {conversation.lastMessage && (
          <p className={`truncate text-xs mt-0.5 ${hasUnread ? "text-foreground" : "text-muted-foreground"}`}>
            {conversation.lastMessage}
          </p>
        )}
      </div>
    </button>
  );
}

export default function MessagesPage({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const {
    conversations,
    loading,
    startConversation,
    markConversationRead,
  } = useConversations();

  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProcessed = useRef(false);
  const prefillProcessed = useRef(false);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      searchTimeout.current = setTimeout(async () => {
        setSearchLoading(true);
        try {
          const term = query.trim();
          const { data, error } = await supabase
            .from("profiles_public" as any)
            .select("user_id, full_name, avatar_url")
            .or(`full_name.ilike.%${term}%,username.ilike.%${term}%`)
            .limit(8);

          if (error) throw error;

          const filtered = (data || []).filter((profile: any) => profile.user_id !== user?.id);
          setSearchResults(filtered as unknown as SearchProfile[]);
        } catch (err) {
         
          toast.error("Recherche impossible");
        } finally {
          setSearchLoading(false);
        }
      }, 300);
    },
    [user]
  );

  const handleStartChat = useCallback(
    async (profile: SearchProfile) => {
      if (!user) {
        toast.error("Connecte-toi pour envoyer un message");
        return;
      }

      if (!profile?.user_id || profile.user_id === user.id) {
        toast.error("Utilisateur invalide");
        return;
      }

      try {
        const conversationId = await startConversation(profile.user_id);

        if (!conversationId) {
          toast.error("Impossible de démarrer la conversation");
          return;
        }

        setActiveConvo({
          id: conversationId,
          otherUserId: profile.user_id,
          otherUserName: profile.full_name || "Utilisateur",
          otherUserAvatar: profile.avatar_url || null,
          lastMessage: null,
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
        });

        setSearchQuery("");
        setSearchResults([]);
      } catch (err) {
       
        toast.error("Impossible de démarrer la conversation");
      }
    },
    [user, startConversation]
  );

  const openFromDetail = useCallback(
    async (detail?: OpenDmDetail) => {
      try {
        if (!detail) return;

        const { userId, userName, userAvatar } = detail;

        if (userId) {
          await handleStartChat({
            user_id: userId,
            full_name: userName || "Utilisateur",
            avatar_url: userAvatar || null,
          });
          return;
        }

        if (userName) {
          setSearchQuery(userName);
          handleSearch(userName);
          setTimeout(() => document.getElementById("dm-search-input")?.focus(), 0);
        }
      } catch (err) {
       
        toast.error("Impossible d'ouvrir cette conversation");
      }
    },
    [handleSearch, handleStartChat]
  );

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (prefillProcessed.current) return;

    const prefillName = sessionStorage.getItem("wk_dm_prefill_name");
    if (!prefillName) return;

    prefillProcessed.current = true;
    sessionStorage.removeItem("wk_dm_prefill_name");
    setSearchQuery(prefillName);
    handleSearch(prefillName);
    setTimeout(() => document.getElementById("dm-search-input")?.focus(), 0);
  }, [handleSearch]);

  useEffect(() => {
    if (pendingProcessed.current || !user) return;

    const pending = sessionStorage.getItem("wk_pending_dm");
    if (!pending) return;

    pendingProcessed.current = true;
    sessionStorage.removeItem("wk_pending_dm");

    try {
      const detail = JSON.parse(pending) as OpenDmDetail;
      void openFromDetail(detail);
    } catch (err) {
     
      toast.error("Impossible d'ouvrir ce message");
    }
  }, [openFromDetail, user]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<OpenDmDetail>;
      void openFromDetail(customEvent.detail);
    };

    window.addEventListener("wk:open-dm", handler as EventListener);
    return () => {
      window.removeEventListener("wk:open-dm", handler as EventListener);
    };
  }, [openFromDetail]);

  if (activeConvo) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`chat-${activeConvo.id}`}
          initial={{ x: "100%", opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.8 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="h-full"
        >
          <ChatView
            conversation={activeConvo}
            onBack={() => setActiveConvo(null)}
            markConversationRead={markConversationRead}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* ════ HEADER ════ */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card active:scale-95 transition-all"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground">Messages</h1>
        </div>

        <button
          onClick={() => document.getElementById("dm-search-input")?.focus()}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card active:scale-95 transition-all"
          aria-label="Rechercher"
        >
          <Search className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* ════ RECHERCHE ════ */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="dm-search-input"
            value={searchQuery}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-10 pr-9 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/40 transition-colors"
          />

          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-card border border-border/60 flex items-center justify-center"
                aria-label="Effacer"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {(searchResults.length > 0 || searchLoading) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-2 rounded-xl border border-border/60 bg-card overflow-hidden"
            >
              {searchLoading ? (
                <div className="py-4 flex justify-center">
                  <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                searchResults.map((profile) => (
                  <button
                    key={profile.user_id}
                    onClick={() => {
                      void handleStartChat(profile);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-background/40 active:bg-background/60 transition-colors border-b border-border/40 last:border-0"
                  >
                    <Avatar className="w-9 h-9 border border-border/60">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || "Utilisateur"} />
                      <AvatarFallback className="bg-background text-foreground text-xs font-semibold">
                        {(profile.full_name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {profile.full_name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-muted-foreground">Envoyer un message</p>
                    </div>

                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════ LISTE CONVERSATIONS ════ */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="px-4 pt-3 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-card border border-border/40 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 rounded bg-card border border-border/40 animate-pulse" />
                  <div className="h-2.5 w-44 rounded bg-card border border-border/40 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="h-full min-h-[52vh] flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-card border border-border/60 flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Tes messages</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Envoie un message à un autre insider de Marrakech
            </p>
            <button
              onClick={() => document.getElementById("dm-search-input")?.focus()}
              className="mt-4 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold active:scale-95 transition-transform"
            >
              Envoyer un message
            </button>
          </div>
        ) : (
          <div>
            {conversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                onClick={() => {
                  setActiveConvo(conversation);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
