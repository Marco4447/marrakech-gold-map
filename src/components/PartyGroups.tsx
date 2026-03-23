import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Users, Plus, Clock, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/timeAgo";

interface PartyGroup {
  id: string;
  place_id: string;
  name: string;
  emoji: string;
  created_by: string;
  expires_at: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
  place_name?: string;
}

interface GroupMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null } | null;
}

interface Props {
  placeId: string;
  placeName: string;
}

const GROUP_EMOJIS = ["🎉", "🔥", "🍸", "🌙", "💃", "🎵", "✨", "🥳"];

export default function PartyGroups({ placeId, placeName }: Props) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<PartyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("party_groups" as any)
        .select("*")
        .eq("place_id", placeId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (data && user) {
        const groupIds = (data as any[]).map((g: any) => g.id);
        let memberMap: Record<string, number> = {};
        let myGroups = new Set<string>();

        if (groupIds.length > 0) {
          const { data: members } = await supabase
            .from("party_group_members" as any)
            .select("group_id, user_id")
            .in("group_id", groupIds);

          (members as any[] || []).forEach((m: any) => {
            memberMap[m.group_id] = (memberMap[m.group_id] || 0) + 1;
            if (m.user_id === user.id) myGroups.add(m.group_id);
          });
        }

        setGroups((data as any[]).map((g: any) => ({
          ...g,
          member_count: memberMap[g.id] || 0,
          is_member: myGroups.has(g.id),
          place_name: placeName,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [placeId, user]);

  const handleJoin = async (groupId: string) => {
    if (!user) { toast.error("Connecte-toi d'abord"); return; }
    const { error } = await supabase.from("party_group_members" as any).insert({ group_id: groupId, user_id: user.id } as any);
    if (error && !error.message.includes("duplicate")) { toast.error("Erreur"); return; }
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, is_member: true, member_count: (g.member_count || 0) + 1 } : g));
    toast.success("T'as rejoint le groupe ! 🎉");
  };

  const handleLeave = async (groupId: string) => {
    if (!user) return;
    await supabase.from("party_group_members" as any).delete().eq("group_id", groupId).eq("user_id", user.id);
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, is_member: false, member_count: Math.max(0, (g.member_count || 1) - 1) } : g));
  };

  const timeLeft = (expires: string) => {
    const diff = new Date(expires).getTime() - Date.now();
    if (diff <= 0) return "Expiré";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h${m}m` : `${m}m`;
  };

  if (loading) return null;
  if (groups.length === 0 && !user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gold" />
          <h3 className="font-display text-sm font-semibold text-foreground">Groupes ce soir</h3>
        </div>
        {user && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 text-2xs font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full">
            <Plus className="w-3 h-3" /> Créer
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">Aucun groupe actif — crée le premier !</p>
      ) : (
        <div className="space-y-2">
          {groups.map(group => (
            <div key={group.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
              group.is_member ? "bg-gold/10 border-gold/30" : "bg-muted/20 border-border"
            }`}>
              <span className="text-xl">{group.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{group.name}</p>
                <div className="flex items-center gap-2 text-2xs text-muted-foreground">
                  <span>{group.member_count} membre{(group.member_count || 0) !== 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" /> {timeLeft(group.expires_at)}
                  </span>
                </div>
              </div>
              {group.is_member ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setActiveGroupId(group.id)} className="text-2xs font-semibold text-gold bg-gold/15 px-2.5 py-1 rounded-full">
                    Chat
                  </button>
                  <button onClick={() => handleLeave(group.id)} className="p-1 text-muted-foreground hover:text-destructive">
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => handleJoin(group.id)} className="text-2xs font-bold text-primary-foreground bg-gold px-3 py-1 rounded-full">
                  Rejoindre
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && <CreateGroupModal placeId={placeId} placeName={placeName} onClose={() => setShowCreate(false)}
          onCreated={(g) => { setGroups(prev => [g, ...prev]); setShowCreate(false); }} />}
      </AnimatePresence>

      {/* Chat modal */}
      <AnimatePresence>
        {activeGroupId && <GroupChat groupId={activeGroupId} onClose={() => setActiveGroupId(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function CreateGroupModal({ placeId, placeName, onClose, onCreated }: {
  placeId: string; placeName: string; onClose: () => void; onCreated: (g: PartyGroup) => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(`Soirée @ ${placeName}`);
  const [emoji, setEmoji] = useState("🎉");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from("party_groups" as any).insert({
      place_id: placeId, name: name.trim(), emoji, created_by: user.id,
    } as any).select().single();

    if (error) { toast.error("Erreur"); setCreating(false); return; }

    // Auto-join
    await supabase.from("party_group_members" as any).insert({ group_id: (data as any).id, user_id: user.id } as any);
    
    onCreated({ ...(data as any), member_count: 1, is_member: true, place_name: placeName });
    toast.success("Groupe créé ! 🎉");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex items-end justify-center">
      <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
        className="w-full max-w-lg bg-card border-t border-border rounded-t-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-foreground">Créer un groupe</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          {GROUP_EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                emoji === e ? "bg-gold/20 ring-2 ring-gold" : "bg-muted/50"
              }`}>{e}</button>
          ))}
        </div>

        <input value={name} onChange={e => setName(e.target.value.slice(0, 50))}
          className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          placeholder="Nom du groupe..." />

        <p className="text-2xs text-muted-foreground">⏳ Le groupe expire automatiquement dans 12h</p>

        <button onClick={handleCreate} disabled={creating || !name.trim()}
          className="w-full py-3 rounded-xl font-bold text-primary-foreground bg-gold disabled:opacity-40">
          {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Créer le groupe 🎉"}
        </button>
      </motion.div>
    </motion.div>
  );
}

function GroupChat({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("party_group_messages" as any)
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) {
        const userIds = [...new Set((data as any[]).map((m: any) => m.user_id))];
        let profileMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from("profiles_public").select("user_id, full_name, avatar_url").in("user_id", userIds);
          profiles?.forEach(p => { if (p.user_id) profileMap[p.user_id] = p; });
        }
        setMessages((data as any[]).map((m: any) => ({ ...m, profile: profileMap[m.user_id] || null })));
      }
    };
    fetch();

    const channel = supabase
      .channel(`party-chat-${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "party_group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => { setMessages(prev => [...prev, payload.new as any]); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!user || !text.trim()) return;
    if (text.length > 500) { toast.error("Max 500 caractères"); return; }
    setSending(true);
    const { error } = await supabase.from("party_group_messages" as any).insert({
      group_id: groupId, user_id: user.id, content: text.trim(),
    } as any);
    if (error) toast.error("Erreur");
    else setText("");
    setSending(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-display text-sm font-bold text-foreground">💬 Chat du groupe</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">Aucun message — lance la conversation !</p>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                <Avatar className="w-6 h-6 border border-border shrink-0 mt-1">
                  <AvatarImage src={msg.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xs bg-gold/10 text-gold">
                    {(msg.profile?.full_name || "?")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[70%] px-3 py-2 rounded-2xl ${
                  isMe ? "bg-gold text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm text-foreground"
                }`}>
                  {!isMe && (
                    <p className="text-2xs font-semibold opacity-70 mb-0.5">{msg.profile?.full_name || "Anonyme"}</p>
                  )}
                  <p className="text-sm leading-snug">{msg.content}</p>
                  <p className={`text-2xs mt-0.5 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {timeAgo(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {user && (
        <div className="border-t border-border px-4 py-3 flex items-center gap-2 bg-card">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message..."
            className="flex-1 text-sm bg-muted/50 rounded-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none" />
          <button onClick={handleSend} disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-full bg-gold flex items-center justify-center disabled:opacity-40">
            {sending ? <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" /> : <Send className="w-4 h-4 text-primary-foreground" />}
          </button>
        </div>
      )}
    </motion.div>
  );
}
