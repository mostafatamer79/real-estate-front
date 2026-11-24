"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Search,
  User,
  Clock,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { chatApi } from "@/lib/chat";
import api from "@/lib/api";
import { toast } from "sonner";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { canNavigateBack } from "@/lib/workspace-usability";
import {
  Participant,
  sanitizeParticipants,
  safeParticipantName,
  getParticipantInitials,
  normalizeSearchText,
  formatConversationTime,
  useModalFocusTrap,
} from "@/lib/redesign-chat07-chat-utils";
import styles from "@/components/chat/chat-lists-redesign.module.css";

interface ChatRoom {
  id: string;
  name?: string | null;
  lastMessage?: {
    content?: string | null;
    sender?: {
      id?: string | number | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
    createdAt?: string | null;
  } | null;
  participants: Participant[];
  unreadCount: number;
  offerId?: string | null;
  otherParticipant?: Participant | null;
}

interface StoredUser {
  id?: string | number;
  userId?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export default function InternalChatPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { isOpen, message, isAdmin } = useSectionGuard("chat");
  const isRtl = language === "ar";

  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  // States for starting new direct chat
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [usersList, setUsersList] = useState<StoredUser[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadUsersError, setLoadUsersError] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const isMountedRef = useRef(true);
  const fetchSeqRef = useRef(0);
  const currentUserRef = useRef<StoredUser | null>(null);
  const modalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const modalDialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useModalFocusTrap(
    isNewChatModalOpen,
    () => {
      if (!creatingRoom) {
        setIsNewChatModalOpen(false);
      }
    },
    modalDialogRef,
    modalTriggerRef,
    { disableEscape: creatingRoom }
  );

  const fetchChats = useCallback(async (user?: StoredUser | null) => {
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await chatApi.getUserRooms();
      if (!isMountedRef.current || seq !== fetchSeqRef.current) return;

      const rawRooms = Array.isArray(response)
        ? response
        : (response && typeof response === "object" && "data" in response && Array.isArray((response as { data: unknown }).data)
            ? (response as { data: unknown[] }).data
            : []);

      const dedupedMap = new Map<string, unknown>();
      for (const r of rawRooms) {
        if (r && typeof r === "object" && "id" in r && (r as { id: unknown }).id != null) {
          dedupedMap.set(String((r as { id: unknown }).id), r);
        }
      }
      const dedupedRooms = Array.from(dedupedMap.values());

      const activeUser = user !== undefined ? user : currentUserRef.current;
      const meId = activeUser?.id ?? activeUser?.userId;

      const transformed: ChatRoom[] = dedupedRooms.map((raw) => {
        const room = raw as {
          id: string | number;
          name?: string | null;
          lastMessage?: {
            content?: string | null;
            sender?: {
              id?: string | number | null;
              firstName?: string | null;
              lastName?: string | null;
            } | null;
            createdAt?: string | null;
          } | null;
          participants?: unknown;
          unreadCount?: unknown;
          offerId?: string | number | null;
        };

        const participants: Participant[] = sanitizeParticipants(room.participants);

        const otherParticipant = participants.find(
          (p) => (meId != null && p.id != null ? String(p.id) !== String(meId) : true)
        ) || null;

        const rawUnread = room.unreadCount;
        const validUnread = typeof rawUnread === "number" && Number.isFinite(rawUnread) && rawUnread > 0
          ? Math.floor(rawUnread)
          : 0;

        return {
          id: String(room.id),
          name: room.name ?? null,
          lastMessage: room.lastMessage
            ? {
                content: room.lastMessage.content ?? "",
                sender: room.lastMessage.sender ?? null,
                createdAt: room.lastMessage.createdAt ?? null,
              }
            : null,
          participants,
          unreadCount: validUnread,
          offerId: room.offerId != null ? String(room.offerId) : null,
          otherParticipant,
        };
      });

      // Sort descending by last message date
      transformed.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt ? Date.parse(a.lastMessage.createdAt) : 0;
        const timeB = b.lastMessage?.createdAt ? Date.parse(b.lastMessage.createdAt) : 0;
        const validA = Number.isFinite(timeA) ? timeA : 0;
        const validB = Number.isFinite(timeB) ? timeB : 0;
        return validB - validA;
      });

      setChats(transformed);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("refresh-notifications"));
      }
    } catch (err: unknown) {
      if (!isMountedRef.current || seq !== fetchSeqRef.current) return;
      console.error("Error fetching chats:", err);
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg ||
          (isRtl
            ? "تعذر تحميل المحادثات. يرجى التحقق من اتصالك والمحاولة مجددًا."
            : "Unable to load conversations. Please check your connection and try again.")
      );
    } finally {
      if (isMountedRef.current && seq === fetchSeqRef.current) {
        setLoading(false);
      }
    }
  }, [isRtl]);

  useEffect(() => {
    let u: StoredUser | null = null;
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          u = JSON.parse(userData) as StoredUser;
          currentUserRef.current = u;
          setCurrentUser(u);
        } catch (err) {
          console.error("Failed to parse user data:", err);
        }
      }
    }
    void fetchChats(u);
  }, [fetchChats]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setLoadUsersError(null);
    try {
      const res = await api.get("/user");
      if (!isMountedRef.current) return;
      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: unknown }).data)
            ? (data as { data: StoredUser[] }).data
            : []);
      setUsersList(list as StoredUser[]);
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Failed to load users:", err);
      const msg = isRtl ? "فشل تحميل قائمة المستخدمين" : "Failed to load users list";
      setLoadUsersError(msg);
      toast.error(msg);
    } finally {
      if (isMountedRef.current) {
        setLoadingUsers(false);
      }
    }
  }, [isRtl]);

  const handleOpenNewChatModal = async () => {
    setIsNewChatModalOpen(true);
    await loadUsers();
  };

  const handleSelectUser = async (targetUser: StoredUser) => {
    if (!targetUser.id) return;
    setCreatingRoom(true);
    try {
      const response = await chatApi.getOrCreateDirectRoom(String(targetUser.id));
      if (!isMountedRef.current) return;

      const roomData = response as {
        id?: string | number;
        roomId?: string | number;
        data?: { id?: string | number; roomId?: string | number };
      };

      const targetRoomId =
        roomData?.id ??
        roomData?.roomId ??
        roomData?.data?.id ??
        roomData?.data?.roomId;

      if (targetRoomId) {
        setIsNewChatModalOpen(false);
        router.push(`/internal/chat/${targetRoomId}`);
      } else {
        toast.error(isRtl ? "تعذر إنشاء المحادثة" : "Could not start chat");
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Error starting direct chat:", err);
      toast.error(isRtl ? "حدث خطأ أثناء فتح المحادثة" : "Error opening chat");
    } finally {
      if (isMountedRef.current) {
        setCreatingRoom(false);
      }
    }
  };

  const handleSafeBack = () => {
    if (typeof window !== "undefined") {
      const navigation = (window as Window & {
        navigation?: {
          currentEntry?: { index: number };
          entries: () => Array<{ index: number; url?: string }>;
        };
      }).navigation;
      const currentEntry = navigation?.currentEntry;
      const previousUrl = currentEntry
        ? navigation?.entries().find((entry) => entry.index === currentEntry.index - 1)?.url
        : undefined;

      if (
        canNavigateBack(
          window.location.href,
          window.history.length,
          document.referrer,
          currentEntry ? { index: currentEntry.index, previousUrl } : undefined
        )
      ) {
        router.back();
        return;
      }
    }
    router.push("/internal");
  };

  const filteredChats = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    if (!q) return chats;

    return chats.filter((chat) => {
      const otherName = safeParticipantName(
        chat.otherParticipant,
        chat.name,
        t("internal.chat.userFallback") || (isRtl ? "مستخدم" : "User")
      );
      if (normalizeSearchText(otherName).includes(q)) return true;
      if (normalizeSearchText(chat.name).includes(q)) return true;
      if (chat.lastMessage?.content && normalizeSearchText(chat.lastMessage.content).includes(q))
        return true;
      for (const p of chat.participants) {
        const pFull = safeParticipantName(p, "", "");
        if (pFull && normalizeSearchText(pFull).includes(q)) return true;
        if (p.email && normalizeSearchText(p.email).includes(q)) return true;
        if (p.phone && normalizeSearchText(p.phone).includes(q)) return true;
      }
      return false;
    });
  }, [chats, searchQuery, isRtl, t]);

  const filteredUsers = useMemo(() => {
    const q = normalizeSearchText(searchUserQuery);
    const myId = currentUserRef.current?.id ?? currentUserRef.current?.userId ?? currentUser?.id ?? currentUser?.userId;

    return usersList.filter((user) => {
      if (myId != null && user.id != null && String(user.id) === String(myId)) {
        return false;
      }
      if (!q) return true;
      const fullName = safeParticipantName(user, "", "");
      return (
        normalizeSearchText(fullName).includes(q) ||
        (user.email ? normalizeSearchText(user.email).includes(q) : false) ||
        (user.phone ? normalizeSearchText(user.phone).includes(q) : false)
      );
    });
  }, [usersList, searchUserQuery, currentUser]);

  const unreadTotal = useMemo(
    () => chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0),
    [chats]
  );

  const canCreateChat =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  if (!isOpen) {
    return (
      <ComingSoonOverlay
        sectionName={t("internal.nav.chat") || (isRtl ? "المحادثات" : "Chat")}
        message={message}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className={styles.inboxPage} dir={isRtl ? "rtl" : "ltr"}>
      <div className={styles.inboxShell}>
        {/* Static Navigation Bar */}
        <nav
          className={styles.navBar}
          aria-label={isRtl ? "شريط التنقل لمركز المحادثات" : "Chat center navigation"}
        >
          <div className={styles.navBreadcrumb}>
            <span className={styles.navTag}>
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("internal.nav.chat") || (isRtl ? "مركز المحادثات" : "Chat")}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleSafeBack}
            className={styles.backButton}
            aria-label={isRtl ? "الرجوع للبوابة الداخلية" : "Return to internal portal"}
          >
            {isRtl ? (
              <>
                <span>العودة</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back</span>
              </>
            )}
          </button>
        </nav>

        {/* Editorial Header Card */}
        <header className={styles.headerCard}>
          <div className={styles.headerInfo}>
            <div className={styles.headerIcon} aria-hidden="true">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className={styles.headerTextGroup}>
              <h1 className={styles.headerTitle}>
                {t("internal.chat.centerTitle") || (isRtl ? "مركز المحادثات الداخلية" : "Internal Chat Center")}
              </h1>
              <p className={styles.headerSubtitle}>
                {t("internal.chat.centerSubtitle") ||
                  (isRtl
                    ? "تواصل مع العملاء وفريق العمل في بيئة تشغيلية آمنة وموحدة."
                    : "Communicate with clients and team members in a secure workspace.")}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <div
              className={styles.statBadge}
              aria-label={`${chats.length} ${isRtl ? "محادثات" : "conversations"}`}
            >
              <span className={styles.statNumber}>
                {chats.length.toLocaleString(isRtl ? "ar-SA" : "en-US")}
              </span>
              <span className={styles.statLabel}>{isRtl ? "محادثة" : "Chats"}</span>
            </div>

            <div
              className={`${styles.statBadge} ${unreadTotal > 0 ? styles.statBadgeUnread : ""}`}
              aria-label={`${unreadTotal} ${isRtl ? "غير مقروءة" : "unread"}`}
            >
              <span className={styles.statNumber}>
                {unreadTotal.toLocaleString(isRtl ? "ar-SA" : "en-US")}
              </span>
              <span className={styles.statLabel}>{isRtl ? "غير مقروءة" : "Unread"}</span>
            </div>

            {canCreateChat && (
              <button
                ref={modalTriggerRef}
                type="button"
                onClick={handleOpenNewChatModal}
                className={styles.newChatButton}
                aria-label={isRtl ? "بدء محادثة مباشرة جديدة" : "Start new direct conversation"}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{isRtl ? "محادثة جديدة" : "New Chat"}</span>
              </button>
            )}
          </div>
        </header>

        {/* Search and Refresh Section */}
        <section
          className={styles.toolbarSection}
          aria-label={isRtl ? "أدوات البحث والتحديث" : "Search and refresh tools"}
        >
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                t("internal.chat.searchPlaceholder") ||
                (isRtl
                  ? "ابحث باسم العضو، البريد، أو نص الرسالة..."
                  : "Search by member, email, or message...")
              }
              className={styles.searchInput}
              aria-label={isRtl ? "بحث في المحادثات الداخلية" : "Search internal conversations"}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={styles.clearSearchBtn}
                aria-label={isRtl ? "مسح نص البحث" : "Clear search"}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => fetchChats()}
            disabled={loading}
            className={styles.refreshButton}
            aria-label={isRtl ? "تحديث قائمة المحادثات" : "Refresh conversations"}
          >
            <RotateCcw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>{t("internal.common.refresh") || (isRtl ? "تحديث" : "Refresh")}</span>
          </button>
        </section>

        {/* Explicit Error State */}
        {error && (
          <div
            className={styles.errorCard}
            role="alert"
            aria-live="assertive"
          >
            <div className={styles.errorContent}>
              <AlertCircle className={styles.errorIcon} aria-hidden="true" />
              <div className={styles.errorTextGroup}>
                <h2 className={styles.errorTitle}>
                  {isRtl ? "تعذر تحميل المحادثات" : "Could not load conversations"}
                </h2>
                <p className={styles.errorDescription}>{error}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchChats()}
              className={styles.retryBtn}
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>{isRtl ? "إعادة المحاولة" : "Try again"}</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        <section aria-label={isRtl ? "قائمة المحادثات الداخلية" : "Internal conversation list"}>
          {loading ? (
            <div
              className={styles.conversationList}
              role="status"
              aria-busy="true"
              aria-label={isRtl ? "جارٍ تحميل المحادثات..." : "Loading conversations..."}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={`${styles.skeletonAvatar} ${styles.skeletonPulse}`} />
                  <div className={styles.skeletonContent}>
                    <div className="flex items-center justify-between gap-4">
                      <div className={`${styles.skeletonLineTitle} ${styles.skeletonPulse}`} />
                      <div className={`${styles.skeletonLineTime} ${styles.skeletonPulse}`} />
                    </div>
                    <div className={`${styles.skeletonLineSubtitle} ${styles.skeletonPulse}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : !error && chats.length === 0 ? (
            /* Genuine Empty State */
            <div className={styles.emptyCard}>
              <div className={styles.emptyIconWrapper} aria-hidden="true">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h2 className={styles.emptyTitle}>
                {t("internal.chat.emptyTitle") || (isRtl ? "لا توجد محادثات" : "No conversations")}
              </h2>
              <p className={styles.emptyDescription}>
                {t("internal.chat.emptySubtitle") ||
                  (isRtl
                    ? "ابدأ التواصل مع فريق العمل أو متابعة العملاء عبر رسائل فورية آمنة."
                    : "Start chatting with your team or customer leads in a secure workspace.")}
              </p>
              {canCreateChat && (
                <button
                  type="button"
                  onClick={handleOpenNewChatModal}
                  className={styles.emptyActionBtn}
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>{isRtl ? "بدء محادثة جديدة" : "Start New Chat"}</span>
                </button>
              )}
            </div>
          ) : !error && filteredChats.length === 0 ? (
            /* Search Empty State */
            <div className={styles.emptyCard}>
              <div className={styles.emptyIconWrapper} aria-hidden="true">
                <Search className="w-8 h-8" />
              </div>
              <h2 className={styles.emptyTitle}>
                {isRtl ? "لا توجد نتائج بحث مطابقة" : "No matching conversations"}
              </h2>
              <p className={styles.emptyDescription}>
                {isRtl
                  ? `لم نتمكن من العثور على محادثات تطابق "${searchQuery}". جرّب كلمة بحث أخرى أو امسح الحقل.`
                  : `We couldn't find any conversations matching "${searchQuery}". Try another keyword or clear the search.`}
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={styles.emptyActionBtn}
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>{isRtl ? "مسح البحث" : "Clear search"}</span>
              </button>
            </div>
          ) : (
            /* Conversation Rows */
            <div className={styles.conversationList}>
              {filteredChats.map((chat) => {
                const participantName = safeParticipantName(
                  chat.otherParticipant,
                  chat.name,
                  t("internal.chat.userFallback") || (isRtl ? "مستخدم" : "User")
                );
                const initials = getParticipantInitials(participantName);
                const timeDisplay = formatConversationTime(
                  chat.lastMessage?.createdAt,
                  isRtl
                );
                const hasUnread = chat.unreadCount > 0;

                // Build message snippet preview
                let snippet = t("internal.chat.startNew") || (isRtl ? "ابدأ محادثة جديدة" : "Start a new conversation");
                if (chat.lastMessage && chat.lastMessage.content) {
                  const sender = chat.lastMessage.sender;
                  const myId = currentUserRef.current?.id ?? currentUserRef.current?.userId ?? currentUser?.id ?? currentUser?.userId;
                  const isMe = sender?.id != null && myId != null && String(sender.id) === String(myId);
                  const senderLabel = isMe
                    ? (t("internal.chat.you") || (isRtl ? "أنت" : "You"))
                    : safeParticipantName(
                        sender,
                        null,
                        t("internal.chat.userFallback") || (isRtl ? "مستخدم" : "User")
                      );
                  snippet = `${senderLabel}: ${chat.lastMessage.content}`;
                }

                return (
                  <div
                    key={chat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/internal/chat/${chat.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/internal/chat/${chat.id}`);
                      }
                    }}
                    className={`${styles.conversationRow} ${
                      hasUnread ? styles.conversationRowUnread : ""
                    }`}
                    aria-label={`${participantName}, ${hasUnread ? `${chat.unreadCount} ${isRtl ? "رسائل غير مقروءة" : "unread"}` : ""}`}
                  >
                    <div className={styles.avatarContainer}>
                      <div className={styles.avatarBox}>
                        {initials ? (
                          <span>{initials}</span>
                        ) : (
                          <User className="w-5 h-5" aria-hidden="true" />
                        )}
                      </div>
                      {hasUnread && (
                        <span
                          className={styles.unreadDotIndicator}
                          aria-hidden="true"
                        >
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className={styles.rowContent}>
                      <div className={styles.rowTop}>
                        <h2
                          className={`${styles.participantName} ${
                            hasUnread ? styles.participantNameUnread : ""
                          }`}
                        >
                          {participantName}
                        </h2>
                        {timeDisplay && (
                          <span className={styles.timestamp}>
                            <Clock className="w-3 h-3 inline-block mx-1" aria-hidden="true" />
                            {timeDisplay}
                          </span>
                        )}
                      </div>

                      <div className={styles.rowBottom}>
                        <p
                          className={`${styles.messageSnippet} ${
                            hasUnread ? styles.messageSnippetUnread : ""
                          }`}
                        >
                          {snippet}
                        </p>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {chat.offerId && (
                            <span className={styles.offerTag}>
                              {t("internal.chat.offerTag") || (isRtl ? "عرض عقاري" : "Offer")}
                            </span>
                          )}
                          {hasUnread && (
                            <span
                              className={styles.unreadCountPill}
                              aria-label={`${chat.unreadCount} ${isRtl ? "غير مقروءة" : "unread"}`}
                            >
                              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* New Chat Modal Dialog */}
        {isNewChatModalOpen && (
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget && !creatingRoom) {
                setIsNewChatModalOpen(false);
              }
            }}
          >
            <div
              ref={modalDialogRef}
              className={styles.modalDialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby="internal-new-chat-title"
              tabIndex={-1}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalTitleGroup}>
                  <div className={styles.modalIcon} aria-hidden="true">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 id="internal-new-chat-title" className={styles.modalTitle}>
                      {isRtl ? "بدء محادثة جديدة" : "New Conversation"}
                    </h2>
                    <p className={styles.modalSubtitle}>
                      {isRtl ? "اختر مستخدمًا أو موظفًا لمراسلته" : "Select a user to chat with"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  disabled={creatingRoom}
                  className={styles.modalCloseBtn}
                  aria-label={isRtl ? "إغلاق النافذة" : "Close dialog"}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* User search inside modal */}
              <div className={styles.modalSearchWrapper}>
                <input
                  type="search"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder={
                    isRtl
                      ? "ابحث بالاسم، البريد أو الهاتف..."
                      : "Search by name, email, or phone..."
                  }
                  className={styles.searchInput}
                  aria-label={isRtl ? "بحث في قائمة المستخدمين" : "Search users list"}
                />
              </div>

              {/* User list */}
              <div className={styles.modalUserList}>
                {loadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--cl-primary-btn-bg)]" />
                    <span className="text-xs font-semibold text-[var(--cl-text-muted)]">
                      {isRtl ? "جارٍ تحميل قائمة المستخدمين..." : "Loading users..."}
                    </span>
                  </div>
                ) : loadUsersError ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                    <p className="text-xs font-bold text-[var(--cl-error-text)]">{loadUsersError}</p>
                    <button
                      type="button"
                      onClick={loadUsers}
                      className={styles.retryBtn}
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{isRtl ? "إعادة المحاولة" : "Try again"}</span>
                    </button>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-10 text-[var(--cl-text-muted)]">
                    <p className="text-xs font-bold">
                      {isRtl ? "لم يتم العثور على مستخدمين" : "No users found"}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const uName = safeParticipantName(
                      user,
                      null,
                      t("internal.chat.userFallback") || (isRtl ? "مستخدم" : "User")
                    );
                    const uInitials = getParticipantInitials(uName);
                    const roleKey = user.role ? `admin.trans.role.${user.role}` : "";
                    const translatedRole = roleKey ? t(roleKey) : "";
                    const roleLabel =
                      translatedRole && translatedRole !== roleKey
                        ? translatedRole
                        : user.role || "";

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        disabled={creatingRoom}
                        className={styles.userOptionBtn}
                        aria-label={`${uName}, ${roleLabel}`}
                      >
                        <div className={styles.userAvatarMini}>
                          {uInitials ? (
                            <span>{uInitials}</span>
                          ) : (
                            <User className="w-4 h-4" aria-hidden="true" />
                          )}
                        </div>

                        <div className={styles.userInfoMini}>
                          <span className={styles.userNameMini}>{uName}</span>
                          <span className={styles.userMetaMini}>
                            {user.email || user.phone || ""}
                          </span>
                        </div>

                        {roleLabel && (
                          <span className={styles.userRoleBadge}>{roleLabel}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {creatingRoom && (
                <div
                  className="flex items-center justify-center gap-2 py-3 border-t border-[var(--cl-border-subtle)] mt-2"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--cl-primary-btn-bg)]" />
                  <span className="text-xs font-bold text-[var(--cl-text-main)]">
                    {isRtl ? "جارٍ فتح المحادثة..." : "Opening conversation..."}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
