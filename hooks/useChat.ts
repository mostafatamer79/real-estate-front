// hooks/use-chat.ts - Update for firstName/lastName
import { useState, useEffect, useCallback, useRef } from 'react';
import { socketClient } from '@/lib/socket';

interface UseChatOptions {
  roomId?: string;
  autoConnect?: boolean;
  onMessage?: (message: any) => void;
  onRoomJoined?: (room: any) => void;
  onError?: (error: any) => void;
}

export const useChat = (options: UseChatOptions = {}) => {
  const {
    roomId,
    autoConnect = true,
    onMessage,
    onRoomJoined,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [room, setRoom] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onMessageRef = useRef(onMessage);
  const onRoomJoinedRef = useRef(onRoomJoined);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onRoomJoinedRef.current = onRoomJoined;
    onErrorRef.current = onError;
  }, [onMessage, onRoomJoined, onError]);

  // Initialize socket connection
  useEffect(() => {
    if (autoConnect) {
      socketClient.connect();
    }

    // Set up event listeners
    socketClient.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socketClient.on('disconnect', () => {
      setIsConnected(false);
    });

    socketClient.on('connected', (data) => {
      console.log('Chat connected:', data);
    });

    socketClient.on('authenticated', (data) => {
      console.log('Authenticated:', data);
    });

    socketClient.on('roomJoined', (data) => {
      setRoom(data);
      setMessages(data.messages || []);
      setOnlineUsers(data.activeUsers || []);
      onRoomJoinedRef.current?.(data);
    });

    socketClient.on('receiveMessage', (message) => {
      setMessages(prev => [...prev, message]);
      onMessageRef.current?.(message);
    });

    socketClient.on('messageSent', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketClient.on('userJoined', (data) => {
      setOnlineUsers(prev => [...prev, data.user.id]);
    });

    socketClient.on('userLeft', (data) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    });

    socketClient.on('userTyping', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.isTyping
      }));

      // Clear typing indicator after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [data.userId]: false
          }));
        }, 3000);
      }
    });

    socketClient.on('onlineUsers', (data) => {
      setOnlineUsers(data.users);
    });

    socketClient.on('error', (error) => {
      setError(error.message || 'Chat error occurred');
      onErrorRef.current?.(error);
    });

    // Clean up on unmount
    return () => {
      socketClient.off('connect');
      socketClient.off('disconnect');
      socketClient.off('connected');
      socketClient.off('authenticated');
      socketClient.off('roomJoined');
      socketClient.off('receiveMessage');
      socketClient.off('messageSent');
      socketClient.off('userJoined');
      socketClient.off('userLeft');
      socketClient.off('userTyping');
      socketClient.off('onlineUsers');
      socketClient.off('error');

      if (roomId) {
        socketClient.leaveRoom(roomId);
      }
    };
  }, [autoConnect, roomId]);

  // Join room when roomId changes
  useEffect(() => {
    if (roomId && isConnected) {
      joinRoom(roomId);
    }
  }, [roomId, isConnected]);

  const joinRoom = useCallback(async (roomIdToJoin: string) => {
    if (!socketClient.isConnected) {
      socketClient.connect();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      socketClient.joinRoom(roomIdToJoin);
    } catch (error: any) {
      setError(error.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback((content: string, replyTo?: string) => {
    if (!roomId) {
      setError('No room selected');
      return false;
    }

    if (!content.trim()) {
      return false;
    }

    return socketClient.sendMessage(roomId, content, replyTo);
  }, [roomId]);

  const startTyping = useCallback(() => {
    if (roomId) {
      socketClient.startTyping(roomId);
    }
  }, [roomId]);

  const stopTyping = useCallback(() => {
    if (roomId) {
      socketClient.stopTyping(roomId);
    }
  }, [roomId]);

  const markAsRead = useCallback((messageId?: string) => {
    if (roomId) {
      socketClient.markAsRead(roomId, messageId);
    }
  }, [roomId]);

  const getOnlineUsers = useCallback(() => {
    if (roomId) {
      socketClient.getOnlineUsers(roomId);
    }
  }, [roomId]);

  const disconnect = useCallback(() => {
    if (roomId) {
      socketClient.leaveRoom(roomId);
    }
    socketClient.disconnect();
  }, [roomId]);

  return {
    // State
    isConnected,
    messages,
    room,
    onlineUsers,
    typingUsers,
    error,
    isLoading,

    // Actions
    joinRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    getOnlineUsers,
    disconnect,

    // Socket methods
    emit: socketClient.emit.bind(socketClient),
    on: socketClient.on.bind(socketClient),
    off: socketClient.off.bind(socketClient),
  };
};