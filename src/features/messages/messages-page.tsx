import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { listMessages, sendMessage } from "@/api/messages";
import { getSession } from "@/api/auth";
import { friendlyDate } from "@/lib/format";
import { listTechnicians } from "@/api/technicians";

export function MessagesPage() {
  const qc = useQueryClient();
  const session = getSession();
  const isOwner = session?.role?.toLowerCase() === "owner";
  
  const [content, setContent] = useState("");
  const [activeTechId, setActiveTechId] = useState<string | null>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages"],
    queryFn: listMessages,
    refetchInterval: 3000,
  });

  const { data: techs = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: listTechnicians,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => {
      let receiver = "owner";
      if (isOwner && activeTechId) {
        receiver = activeTechId;
      }
      let sender = "owner";
      if (!isOwner && session?.email) {
        sender = techs.find((t) => t.email === session.email)?.id || session.email;
      }
      return sendMessage({ sender, receiver, content: text });
    },
    onSuccess: () => {
      setContent("");
      void qc.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  // Filter messages relevant to the current conversation
  let visibleMessages = messages;
  if (!isOwner) {
    // Technician only sees their own messages with the owner
    const techId = techs.find((t) => t.email === session?.email)?.id || session?.email || "unknown";
    visibleMessages = messages.filter(
      (m) => m.sender === techId || m.receiver === techId
    );
  } else {
    // Owner sees messages depending on which technician they selected
    if (activeTechId) {
      visibleMessages = messages.filter(
        (m) => m.sender === activeTechId || m.receiver === activeTechId
      );
    } else {
      visibleMessages = [];
    }
  }

  return (
    <AppShell
      title="Messages"
      description={isOwner ? "Chat directly with your technicians" : "Chat directly with the owner"}
    >
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 page-enter h-[calc(100vh-180px)]">
        
        {/* Sidebar (Only useful for owner) */}
        {isOwner && (
          <div className="flex flex-col border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80">
              <h2 className="font-semibold text-sm">Technicians</h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {techs.map((tech) => (
                <button
                  key={tech.id}
                  onClick={() => setActiveTechId(tech.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    activeTechId === tech.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-slate-800/60 text-slate-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <UserRound className="w-4 h-4 opacity-70" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{tech.name}</p>
                    <p className="text-xs opacity-70 truncate">{tech.specialty}</p>
                  </div>
                </button>
              ))}
              {techs.length === 0 && (
                <p className="text-center text-slate-500 text-xs py-8">No technicians found.</p>
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex flex-col border border-slate-800 rounded-xl bg-[#0f111a] overflow-hidden relative">
          {isOwner && !activeTechId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <UserRound className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a technician from the sidebar to start chatting.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {isOwner
                      ? techs.find((t) => t.id === activeTechId)?.name || "Technician"
                      : "Business Owner"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isOwner ? "Direct connection" : "Dispatch & Operations"}
                  </p>
                </div>
              </div>

              {/* Messages list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {visibleMessages.map((msg) => {
                  let isMe = false;
                  if (isOwner) {
                    isMe = msg.sender === "owner";
                  } else {
                    const techId = techs.find((t) => t.email === session?.email)?.id || session?.email;
                    isMe = msg.sender === techId;
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        isMe ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-slate-800 text-slate-200 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 mx-1">
                        {friendlyDate(msg.timestamp)}
                      </span>
                    </div>
                  );
                })}
                {visibleMessages.length === 0 && (
                  <div className="text-center text-slate-500 text-sm py-12">
                    No messages yet. Say hello!
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-slate-900/80 border-t border-slate-800">
                <form
                  className="flex items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (content.trim()) sendMutation.mutate(content);
                  }}
                >
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none min-h-[44px] max-h-[120px]"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (content.trim()) sendMutation.mutate(content);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={!content.trim() || sendMutation.isPending}
                    className="h-[44px] w-[44px] p-0 rounded-xl flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </AppShell>
  );
}
