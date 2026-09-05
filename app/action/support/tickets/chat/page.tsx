"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  useTicketDetail,
  useTicketMessages,
} from "../../../../manage/support/queries";
import {
  createTicketMessage,
  updateTicketStatus,
} from "../../../../manage/support/services";
import { useSessionCheck, getLabel } from "@/lib";
import { useSupportMasterList } from "../../../../administrator/masters/support/query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  SendHorizontal,
  Clock,
  CheckCircle,
  HelpCircle,
  Lock,
  Paperclip,
  X,
  FileText,
  Info,
  Tag,
  User,
  Building2,
  Calendar,
  ShieldAlert,
  Briefcase,
  Eye,
} from "lucide-react";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");
    return RQ;
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-full bg-muted animate-pulse rounded-xl border" />
    ),
  },
) as any;

import "react-quill-new/dist/quill.snow.css";
import "react-quill-new/dist/quill.bubble.css";

export default function SupportTicketChatPopupPage() {
  const { t, lang } = useTranslation();
  const searchParams = useSearchParams();
  const ticketNumber = searchParams.get("ticket_number") || "";
  const queryClient = useQueryClient();

  const { data: Session } = useSessionCheck();
  const user = Session?.result?.data;


  const [activeTab, setActiveTab] = useState<"support" | "info" | "note">(
    "support",
  );
  const [replyText, setReplyText] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<
    string | null
  >(null);


  const isCourtStaff = useMemo(() => {
    if (!user?.role) return false;
    const staffRoles = [
      "SUPER_ADMIN",
      "ADMIN",
      "RI",
      "RSI",
      "COURT_USER",
      "READER",
      "PESHKAR",
    ];
    return staffRoles.includes(user.role.toUpperCase());
  }, [user]);


  const isSenderStaff = (sender: any) => {
    if (!sender) return false;
    if (sender.is_staff === true) return true;

    const roleVal =
      typeof sender.role === "string"
        ? sender.role
        : sender.role?.code || sender.role?.name || sender.role_code || "";

    const staffRoleCodes = [
      "CO",
      "PO",
      "SA",
      "CC",
      "ADMIN",
      "SUPER_ADMIN",
      "STAFF",
      "COURT",
      "PESHKAR",
      "READER",
      "AHLAMAD",
      "JUDGE",
      "TEHSILDAR",
    ];
    return staffRoleCodes.includes(roleVal.toUpperCase());
  };


  const ticketQuery = useTicketDetail(ticketNumber);
  const ticket = ticketQuery.data?.result?.data;


  const isBoardUser = useMemo(() => {
    if (!user) return false;
    const roleUpper = user.role?.toUpperCase();
    return (
      (roleUpper === "SUPER_ADMIN" || roleUpper === "ADMIN") && !user.court_id
    );
  }, [user]);


  const isCaseRelated = !!ticket?.case;


  const isReadOnlyForBoard = isBoardUser && isCaseRelated;

  const messagesQuery = useTicketMessages(ticketNumber);
  const messagesList = messagesQuery.data?.result?.data || [];

  const statusesQuery = useSupportMasterList("support-statuses", {
    limit: 100,
  });


  useEffect(() => {
    if (ticket) {
      setEditStatus(String(ticket.status_detail?.id || ""));
      setResolutionNotes(ticket.resolution_notes || "");
    }
  }, [ticket]);


  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesList]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);


  const sendReplyMutation = useMutation({
    mutationFn: (payload: { message: string; attachment?: File | null }) => {
      if (payload.attachment) {
        const formData = new FormData();
        formData.append("message", payload.message);
        formData.append("attachment", payload.attachment);
        return createTicketMessage(ticketNumber, formData);
      } else {
        return createTicketMessage(ticketNumber, { message: payload.message });
      }
    },
    onSuccess: () => {
      setReplyText("");
      setAttachmentFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({
        queryKey: ["SUPPORT_TICKETS_MESSAGES", ticketNumber],
      });

      if (window.opener) {
        window.opener.postMessage("REFRESH_SUPPORT_TICKET_LIST", "*");
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to post message.");
    },
  });


  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (isReplyEmpty && !attachmentFile) return;
      sendReplyMutation.mutate({
        message: replyText,
        attachment: attachmentFile,
      });
    }
  };


  const isReplyEmpty = useMemo(() => {
    const clean = replyText.replace(/<[^>]*>/g, "").trim();
    return !clean;
  }, [replyText]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReplyEmpty && !attachmentFile) return;
    sendReplyMutation.mutate({
      message: replyText,
      attachment: attachmentFile,
    });
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are allowed as attachments.");
      return;
    }

    setAttachmentFile(file);
    toast.success(`Attached PDF: ${file.name}`);
  };

  const handleClearAttachment = () => {
    setAttachmentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const updateStateMutation = useMutation({
    mutationFn: (payload: any) => updateTicketStatus(ticketNumber, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Ticket state saved successfully!");
      queryClient.invalidateQueries({
        queryKey: ["SUPPORT_TICKETS_DETAIL", ticketNumber],
      });
      if (window.opener) {
        window.opener.postMessage("REFRESH_SUPPORT_TICKET_LIST", "*");
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update state.");
    },
  });

  const handleSaveState = () => {
    updateStateMutation.mutate({
      status: Number(editStatus),
      resolution_notes: resolutionNotes,
    });
  };

  if (!ticketNumber) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        No ticket selected.
      </div>
    );
  }

  if (ticketQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground italic animate-pulse">
        Loading support conversation...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col font-sans">
      {}
      <div className="px-6 py-3.5 border-b bg-card flex items-center justify-between gap-4 shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono font-bold bg-muted px-2.5 py-1 rounded-lg text-foreground border shadow-2xs shrink-0">
            #{ticket?.ticket_number}
          </span>
          <h1
            className="text-sm md:text-base font-bold text-foreground tracking-tight truncate max-w-100"
            title={ticket?.subject}
          >
            {ticket?.subject}
          </h1>
        </div>

        <div className="shrink-0">
          <StatusBadge
            variant={
              ticket?.status_detail?.code === "RESOLVED"
                ? "success"
                : ticket?.status_detail?.code === "IN_PROGRESS"
                  ? "info"
                  : ticket?.status_detail?.code === "CLOSED"
                    ? "neutral"
                    : "warning"
            }
          >
            {getLabel(ticket?.status_detail, lang)}
          </StatusBadge>
        </div>
      </div>

      {}
      <div className="px-6 border-b bg-muted/20 flex items-center gap-1 shrink-0 select-none">
        <button
          type="button"
          onClick={() => setActiveTab("support")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "support"
              ? "border-primary text-primary bg-background/60"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Support
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "info"
              ? "border-primary text-primary bg-background/60"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Info
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("note")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "note"
              ? "border-primary text-primary bg-background/60"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Note
        </button>
      </div>

      {}
      {activeTab === "support" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3.5 bg-slate-200/80 dark:bg-neutral-900/90 no-scrollbar flex flex-col w-full">
            {}
            {ticket?.description && (
              <div className="flex items-center gap-2.5 max-w-[82%] self-start animate-in fade-in slide-in-from-bottom-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-neutral-700/60 shadow-3xs cursor-pointer hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                      title="Click for sender info"
                    >
                      <User className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="top"
                    sideOffset={6}
                    className="w-52 p-3 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-md bg-white dark:bg-neutral-900 text-popover-foreground z-50"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider text-white bg-emerald-600">
                          Requester
                        </span>
                      </div>
                      <div className="text-xs font-bold text-foreground">
                        {
                          (
                            ticket.created_by ||
                            ticket.contact_email ||
                            "User"
                          ).split("@")[0]
                        }
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="px-3.5 py-2 rounded-2xl rounded-tl-xs text-xs leading-relaxed shadow-3xs wrap-break-word w-fit max-w-full bg-white dark:bg-neutral-900 text-foreground border-none [border:none_!important]">
                    <div
                      className="ql-editor p-0 prose dark:prose-invert max-w-none wrap-break-word"
                      dangerouslySetInnerHTML={{
                        __html: ticket.description || "",
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold px-1">
                    {formatDateTime(ticket.created_at)}
                  </div>
                </div>
              </div>
            )}

            {}
            {messagesQuery.isLoading ? (
              <div className="text-center text-xs text-muted-foreground italic py-4">
                Loading timeline...
              </div>
            ) : (
              messagesList.map((msg: any) => {
                const isMe = Boolean(
                  (msg.sender_detail?.username &&
                    user?.username &&
                    msg.sender_detail.username === user.username) ||
                  (msg.sender_username &&
                    user?.username &&
                    msg.sender_username === user.username) ||
                  (msg.sender &&
                    user?.id &&
                    String(msg.sender) === String(user.id)),
                );

                const isStaff = Boolean(
                  msg.is_staff === true ||
                  msg.sender_detail?.is_staff === true ||
                  isSenderStaff(msg.sender_detail) ||
                  isSenderStaff({ role: msg.sender_role }) ||
                  (msg.sender_role &&
                    [
                      "CO",
                      "PO",
                      "SA",
                      "CC",
                      "ADMIN",
                      "SUPER_ADMIN",
                      "STAFF",
                      "COURT",
                      "PESHKAR",
                    ].includes(String(msg.sender_role).toUpperCase())),
                );

                const rawSenderName =
                  msg.sender_name ||
                  msg.sender_detail?.name ||
                  msg.sender_username ||
                  msg.sender_detail?.username ||
                  (isStaff ? "Court Official" : "Requester");
                const senderName = rawSenderName.includes("@")
                  ? rawSenderName.split("@")[0]
                  : rawSenderName;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-center gap-2.5 max-w-[82%] ${
                      isStaff
                        ? "self-end justify-end"
                        : "self-start justify-start"
                    } animate-in fade-in slide-in-from-bottom-2`}
                  >
                    {}
                    {!isStaff && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-neutral-700/60 shadow-3xs cursor-pointer hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                            title="Click for sender info"
                          >
                            <User className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          side="top"
                          sideOffset={6}
                          className="w-52 p-3 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-md bg-white dark:bg-neutral-900 text-popover-foreground z-50"
                        >
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider text-white bg-emerald-600">
                                Requester
                              </span>
                            </div>
                            <div className="text-xs font-bold text-foreground">
                              {isMe ? "Me" : senderName}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {}
                    <div
                      className={`flex flex-col gap-0.5 min-w-0 ${isStaff ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`px-2.5 py-1.5 rounded-2xl text-xs leading-relaxed shadow-3xs wrap-break-word w-fit max-w-full border-none [border:none_!important] bg-white dark:bg-neutral-900 text-foreground ${
                          isStaff ? "rounded-tr-xs" : "rounded-tl-xs"
                        }`}
                      >
                        {}
                        {msg.attachment && (
                          <div className="mb-2 p-2 rounded-xl bg-slate-100/90 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-neutral-700/60 flex items-center gap-2.5 shadow-3xs hover:bg-slate-200/70 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200/60 dark:border-red-900/60">
                              <FileText className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs font-bold text-foreground truncate">
                                Attachment File
                              </span>
                              <span className="text-[10px] font-semibold text-muted-foreground">
                                PDF Document
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewAttachmentUrl(msg.attachment)
                              }
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shrink-0 transition-all flex items-center gap-1 shadow-3xs cursor-pointer"
                            >
                              <span>View</span>
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {}
                        {msg.message && (
                          <div
                            className="ql-editor p-0 prose dark:prose-invert max-w-none wrap-break-word text-foreground"
                            dangerouslySetInnerHTML={{ __html: msg.message }}
                          />
                        )}
                      </div>

                      {}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold px-1">
                        {formatDateTime(msg.created_at)}
                      </div>
                    </div>

                    {}
                    {isStaff && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-neutral-700/60 shadow-3xs cursor-pointer hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                            title="Click for sender info"
                          >
                            <Building2 className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          side="top"
                          sideOffset={6}
                          className="w-52 p-3 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-md bg-white dark:bg-neutral-900 text-popover-foreground z-50"
                        >
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider text-white bg-indigo-600">
                                Court Official
                              </span>
                            </div>
                            <div className="text-xs font-bold text-foreground">
                              {isMe ? "Me" : senderName}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                );
              })
            )}

            {}
            {ticket?.status_detail?.code === "RESOLVED" && (
              <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-400 shadow-3xs">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <strong className="font-bold">Issue Resolved: </strong>
                  {ticket.resolution_notes ||
                    "The helpdesk administrator has successfully resolved this ticket."}
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {}
          <div className="p-4 border-t bg-card shrink-0">
            {}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {}
            {attachmentFile && (
              <div className="mb-2.5 p-2 bg-slate-50 dark:bg-neutral-900 border rounded-lg flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate max-w-60">
                    {attachmentFile.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({(attachmentFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearAttachment}
                  className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {ticket?.status_detail?.code === "CLOSED" ? (
              <div className="p-3 text-center text-xs text-muted-foreground bg-slate-50 border border-dashed rounded-xl flex items-center justify-center gap-1.5 font-medium">
                <Lock className="w-4 h-4 text-muted-foreground" />
                This support ticket has been CLOSED. Replies are disabled.
              </div>
            ) : isReadOnlyForBoard ? (
              <div className="p-3 text-center text-xs text-amber-800 bg-amber-50 border border-amber-200 border-dashed rounded-xl flex items-center justify-center gap-1.5 font-medium dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400">
                <Lock className="w-4 h-4 text-amber-500" />
                Replies to case-related tickets are restricted to Court staff
                only.
              </div>
            ) : (
              <form
                onSubmit={handleSendReply}
                className="w-full max-w-full min-w-0 flex items-end gap-2.5"
                onKeyDown={handleKeyDown}
              >
                {}
                <button
                  type="button"
                  onClick={handleAttachmentClick}
                  disabled={sendReplyMutation.isPending}
                  className="h-10 w-10 rounded-full text-muted-foreground hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-foreground flex items-center justify-center transition-transform active:scale-95 border border-slate-200/80 dark:border-neutral-800 bg-background shadow-3xs shrink-0 relative"
                  title="Attach PDF Document"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                  {attachmentFile && (
                    <span className="absolute top-1 right-1 bg-blue-600 w-2.5 h-2.5 rounded-full ring-2 ring-background animate-pulse" />
                  )}
                </button>

                {}
                <div className="flex-1 min-w-0 max-w-full min-h-[40px] bg-slate-100/90 dark:bg-neutral-900/80 border border-slate-200/60 dark:border-neutral-800/60 rounded-2xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/15 focus-within:border-blue-500/40 focus-within:bg-background transition-all relative flex items-center">
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                    .quill-reply-editor {
                      width: 100% !important;
                      max-width: 100% !important;
                      min-width: 0 !important;
                    }
                    .quill-reply-editor .ql-container {
                      font-size: 0.875rem !important;
                      line-height: 1.5 !important;
                    }
                    .quill-reply-editor .ql-editor {
                      word-break: break-all !important;
                      overflow-wrap: anywhere !important;
                      white-space: pre-wrap !important;
                      max-width: 100% !important;
                      min-width: 0 !important;
                      min-height: 28px !important;
                      max-height: 380px !important;
                      overflow-y: auto !important;
                      padding: 4px 0 !important;
                    }
                    .ql-editor p {
                      margin: 0 !important;
                      padding: 0 !important;
                    }
                    .quill-reply-editor .ql-tooltip {
                      z-index: 50 !important;
                      margin-left: 12px !important;
                    }
                  `,
                    }}
                  />
                  <ReactQuill
                    theme="bubble"
                    value={replyText}
                    onChange={setReplyText}
                    bounds=".quill-reply-editor"
                    placeholder="Type message reply... (Highlight text to format | Ctrl + Enter to Send)"
                    modules={{
                      toolbar: [
                        ["bold", "italic", "underline", "strike"],
                        [{ color: [] }, { background: [] }],
                        [{ list: "ordered" }, { list: "bullet" }],
                        [{ align: [] }],
                      ],
                    }}
                    className="quill-reply-editor w-full min-w-0 max-w-full"
                  />
                </div>

                {}
                <Button
                  type="submit"
                  disabled={
                    (isReplyEmpty && !attachmentFile) ||
                    sendReplyMutation.isPending
                  }
                  className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0 p-0"
                  title="Send Reply"
                >
                  <SendHorizontal className="w-4.5 h-4.5" />
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {}
      {activeTab === "info" && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40 dark:bg-neutral-950/10">
          <div className="max-w-3xl mx-auto space-y-6">
            {}
            <div className="bg-card border rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                Ticket Classification & Status
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl border space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Ticket Number
                  </span>
                  <div className="text-sm font-mono font-bold text-foreground">
                    #{ticket?.ticket_number}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl border space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Current Status
                  </span>
                  <div>
                    <StatusBadge
                      variant={
                        ticket?.status_detail?.code === "RESOLVED"
                          ? "success"
                          : ticket?.status_detail?.code === "IN_PROGRESS"
                            ? "info"
                            : ticket?.status_detail?.code === "CLOSED"
                              ? "neutral"
                              : "warning"
                      }
                    >
                      {getLabel(ticket?.status_detail, lang)}
                    </StatusBadge>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl border space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Category
                  </span>
                  <div className="text-xs font-bold text-foreground">
                    {getLabel(ticket?.category_detail, lang) || "—"}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl border space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Sub-Category
                  </span>
                  <div className="text-xs font-bold text-foreground">
                    {getLabel(ticket?.sub_category_detail, lang) || "—"}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl border space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Priority Level
                  </span>
                  <div className="text-xs font-bold text-foreground">
                    {ticket?.priority || "NORMAL"}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl border space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Created On
                  </span>
                  <div className="text-xs font-bold text-foreground">
                    {formatDateTime(ticket?.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="bg-card border rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Requester & Assignment Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl border space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Contact Email
                  </span>
                  <div className="text-xs font-bold text-foreground">
                    {ticket?.contact_email || "—"}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl border space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Contact Phone
                  </span>
                  <div className="text-xs font-bold text-foreground">
                    {ticket?.contact_phone || "—"}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl border space-y-1 col-span-1 md:col-span-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {ticket?.case_number
                      ? "Associated Court"
                      : "Assigned Authority"}
                  </span>
                  <div className="text-xs font-bold text-foreground">
                    {ticket?.case_number
                      ? ticket.case_court_name_en || ticket.case_court_name
                        ? `${ticket.case_court_name_en || ticket.case_court_name} (${ticket.case_court_code || ""})`
                        : "—"
                      : "Board of Revenue (Super Admin)"}
                  </div>
                </div>
              </div>
            </div>

            {}
            {ticket?.case_number && (
              <div className="bg-card border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Associated Case Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20 space-y-1">
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                      Case Number
                    </span>
                    <div className="text-sm font-mono font-bold text-amber-900 dark:text-amber-200">
                      {ticket.case_number}
                    </div>
                  </div>

                  <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20 space-y-1 flex flex-col justify-center">
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                      View Case Profile
                    </span>
                    <div>
                      <a
                        href={`/case/${ticket.case_number}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        Open Case Profile &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {activeTab === "note" && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40 dark:bg-neutral-950/10">
          <div className="max-w-3xl mx-auto space-y-6">
            {}
            <div className="bg-card border rounded-2xl p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Resolution Notes & Remarks
              </h3>

              <div className="p-4 bg-slate-50 dark:bg-neutral-900 border rounded-xl text-xs leading-relaxed text-foreground min-h-[80px]">
                {ticket?.resolution_notes ||
                  "No resolution notes or remarks recorded yet."}
              </div>
            </div>

            {}
            {isCourtStaff && !isReadOnlyForBoard && (
              <div className="bg-card border rounded-2xl p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  Update Ticket State & Remarks
                </h3>

                <div className="space-y-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Transition State
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="h-10 rounded-xl border px-3 text-xs bg-background text-foreground font-medium cursor-pointer"
                    >
                      <option value="">Select Status</option>
                      {statusesQuery.data?.result?.data?.map?.((item: any) => (
                        <option key={item.id} value={item.id}>
                          {getLabel(item, lang)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Resolution Notes / Action Summary
                    </label>
                    <textarea
                      placeholder="Enter resolution notes, action taken, or internal remarks..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={4}
                      className="p-3 text-xs rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-blue-500/20 resize-none outline-none"
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSaveState}
                    disabled={updateStateMutation.isPending}
                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 rounded-xl shadow-xs"
                  >
                    {updateStateMutation.isPending
                      ? "Saving Changes..."
                      : "Save State & Notes"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .quill-reply-editor.ql-bubble {
          background: transparent !important;
          border: none !important;
        }
        .quill-reply-editor .ql-container.ql-bubble {
          border: none !important;
          font-size: 13.5px !important;
          background: transparent !important;
        }
        .quill-reply-editor .ql-editor {
          min-height: 24px !important;
          max-height: 80px !important;
          overflow-y: auto !important;
          padding: 4px 2px !important;
          background: transparent !important;
        }
        .quill-reply-editor .ql-editor.ql-blank::before {
          left: 2px !important;
          right: 2px !important;
          font-style: normal !important;
          color: var(--muted-foreground) !important;
          opacity: 0.7 !important;
        }

        .ql-bubble .ql-tooltip {
          background-color: #1e293b !important;
          border-radius: 10px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3) !important;
          padding: 6px 10px !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          z-index: 1000 !important;
        }
        .ql-bubble .ql-toolbar button {
          color: #f1f5f9 !important;
        }
        .ql-bubble .ql-toolbar button:hover {
          color: #3b82f6 !important;
        }
        .ql-bubble .ql-toolbar button.ql-active {
          color: #3b82f6 !important;
        }
        .ql-bubble .ql-stroke {
          stroke: #f1f5f9 !important;
        }
        .ql-bubble .ql-fill {
          fill: #f1f5f9 !important;
        }
        .ql-bubble button:hover .ql-stroke {
          stroke: #3b82f6 !important;
        }
        .ql-bubble button:hover .ql-fill {
          fill: #3b82f6 !important;
        }
        .prose-white p, .prose-white strong, .prose-white li, .prose-white ul, .prose-white ol {
          color: white !important;
        }
      `,
        }}
      />

      {}
      <Dialog
        open={Boolean(previewAttachmentUrl)}
        onOpenChange={(open) => !open && setPreviewAttachmentUrl(null)}
      >
        <DialogContent className="fixed inset-0 !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !w-full !h-full !max-w-none !max-h-none sm:!max-w-none sm:!w-full sm:!h-full rounded-none border-0 p-4 flex flex-col bg-background text-foreground z-[100] shadow-none">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b shrink-0 pr-8">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <DialogTitle className="text-sm font-bold text-foreground">
                Attachment Document Preview
              </DialogTitle>
            </div>
            <DialogDescription className="hidden">
              In-app preview of attached support document
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 w-full h-full min-h-0 pt-2 overflow-hidden bg-slate-100 dark:bg-neutral-900">
            {previewAttachmentUrl && (
              <iframe
                src={previewAttachmentUrl}
                title="Attachment Preview"
                className="w-full h-full border-0"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
