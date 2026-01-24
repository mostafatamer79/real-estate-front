
"use client";

import { io, Socket } from "socket.io-client";

class SocketClient {
  private socket: Socket | null = null;
  private url: string = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009") + "/chat";

  connect() {
    if (this.socket?.connected) return;

    // Get auth token if needed
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;

    if (!user?.id) return;


    this.socket = io(this.url, {
      path: "/socket.io",
       // Ensure this matches backend namespace if any, mostly it's empty or /chat
       // Backend gateway says @WebSocketGateway({ namespace: '/chat' }) so we need to connect to that namespace
      auth: {
        token,
        userId: user.id
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  isSocketConnected() {
    return this.socket?.connected;
  }
  
  // Method to get socket instance, but usually better to wrap emit/on
  getSocket() {
      return this.socket;
  }

  emit(event: string, data: any) {
    if (!this.socket) this.connect();
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (data: any) => void) {
     if (!this.socket) this.connect();
     this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  get isConnected() {
    return !!this.socket?.connected;
  }

  joinRoom(roomId: string) {
    this.emit('joinRoom', { roomId });
  }

  leaveRoom(roomId: string) {
    this.emit('leaveRoom', { roomId });
  }

  sendMessage(roomId: string, content: string, replyTo?: string) {
    this.emit('sendMessage', { roomId, content, replyTo });
    return true;
  }

  startTyping(roomId: string) {
    this.emit('typing', { roomId, isTyping: true });
  }

  stopTyping(roomId: string) {
    this.emit('typing', { roomId, isTyping: false });
  }

  markAsRead(roomId: string, messageId?: string) {
    this.emit('markAsRead', { roomId, messageId });
  }

  getOnlineUsers(roomId: string) {
    this.emit('getOnlineUsers', { roomId });
  }
}

export const socketClient = new SocketClient();