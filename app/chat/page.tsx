"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Search,
  User,
  Clock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RotateCcw,
  X,
  ExternalLink,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { chatApi } from "@/lib/chat";
import { canNavigateBack } from "@/lib/workspace-usability";
import PullToRefresh from "@/components/shared/PullToRefresh";
import {
  Participant,
  sanitizeParticipants,
  safeParticipantName,
  getParticipantInitials,
  normalizeSearchText,
  formatConversationTime,
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
  role?: string;
}

export default function NormalChatPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  const isMountedRef = useRef(true);
  const fetchSeqRef = useRef(0);
  const currentUserRef = useRef<StoredUser | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

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
    router.push("/details");
  };

  const filteredChats = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    if (!q) return chats;

    return chats.filter((chat) => {
      const otherName = safeParticipantName(
        chat.otherParticipant,
        chat.name,
        isRtl ? "مستخدم" : "User"
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
  }, [chats, searchQuery, isRtl]);

  const unreadTotal = useMemo(
    () => chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0),
    [chats]
  );

  return (
    <PullToRefresh onRefresh={() => fetchChats()}>
      <div className={styles.inboxPage} dir={isRtl ? "rtl" : "ltr"}>
        <div className={styles.inboxShell}>
          {/* Static Navigation Bar */}
          <nav
            className={styles.navBar}
            aria-label={isRtl ? "شريط التنقل العلوي للمحادثات" : "Conversations navigation"}
          >
            <div className={styles.navBreadcrumb}>
              <span className={styles.navTag}>
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isRtl ? "المحادثات" : "Inbox"}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleSafeBack}
              className={styles.backButton}
              aria-label={isRtl ? "الرجوع للصفحة السابقة" : "Go back"}
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
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className={styles.headerTextGroup}>
                <h1 className={styles.headerTitle}>
                  {isRtl ? "محادثاتي" : "My Conversations"}
                </h1>
                <p className={styles.headerSubtitle}>
                  {isRtl
                    ? "متابعة المحادثات والردود والتواصل المباشر في مكان واحد."
                    : "Track messages, responses, and direct discussions in one place."}
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
                aria-label={`${unreadTotal} ${isRtl ? "رسائل غير مقروءة" : "unread messages"}`}
              >
                <span className={styles.statNumber}>
                  {unreadTotal.toLocaleString(isRtl ? "ar-SA" : "en-US")}
                </span>
                <span className={styles.statLabel}>{isRtl ? "غير مقروءة" : "Unread"}</span>
              </div>
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
                  isRtl
                    ? "ابحث باسم المشارك، البريد، أو نص الرسالة..."
                    : "Search by participant, email, or message..."
                }
                className={styles.searchInput}
                aria-label={isRtl ? "بحث في المحادثات" : "Search conversations"}
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
              <span>{isRtl ? "تحديث" : "Refresh"}</span>
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
          <section aria-label={isRtl ? "قائمة المحادثات" : "Conversation list"}>
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
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h2 className={styles.emptyTitle}>
                  {isRtl ? "لا توجد محادثات حتى الآن" : "No conversations yet"}
                </h2>
                <p className={styles.emptyDescription}>
                  {isRtl
                    ? "عند التواصل مع المعلن أو إرسال استفسار حول عقار أو طلب خدمة، ستظهر جميع محادثاتك هنا."
                    : "When you contact an advertiser or inquiry about a property or service, your conversations will appear here."}
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/offers")}
                  className={styles.emptyActionBtn}
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>{isRtl ? "استكشف العروض العقارية" : "Explore Property Offers"}</span>
                </button>
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
                    isRtl ? "مستخدم" : "User"
                  );
                  const initials = getParticipantInitials(participantName);
                  const timeDisplay = formatConversationTime(
                    chat.lastMessage?.createdAt,
                    isRtl
                  );
                  const hasUnread = chat.unreadCount > 0;
                  const snippet =
                    chat.lastMessage && chat.lastMessage.content
                      ? chat.lastMessage.content
                      : isRtl
                      ? "ابدأ محادثة جديدة"
                      : "Start a new conversation";

                  return (
                    <div
                      key={chat.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/chat/${chat.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/chat/${chat.id}`);
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
                                {isRtl ? "عرض عقاري" : "Offer"}
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
        </div>
      </div>
    </PullToRefresh>
  );
}
