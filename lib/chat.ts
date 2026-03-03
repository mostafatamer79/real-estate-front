import api from './api';

export const chatApi = {
  // Create or get offer chat room
  async getOrCreateOfferRoom(data: {
    offerId: string;
    sellerId: string;
    buyerId: string;
    offerTitle: string;
  }) {
    const response = await api.post('/chat/rooms/offer', data);
    return response.data;
  },

  // Create or get order chat room
  async getOrCreateOrderRoom(data: {
    orderId: string;
    otherId: string; // The owner of the order
    title: string;
  }) {
    const response = await api.post('/chat/rooms/order', data);
    return response.data;
  },

  // Send message
  async sendMessage(roomId: string, content: string) {
    const response = await api.post(`/chat/rooms/${roomId}/messages`, { content });
    return response.data;
  },

  // Get room messages
  async getRoomMessages(roomId: string) {
    const response = await api.get(`/chat/rooms/${roomId}/messages`);
    return response.data; 
  },

  // Get user's rooms
  async getUserRooms() {
    const response = await api.get('/chat/rooms');
    return response.data;
  },
};