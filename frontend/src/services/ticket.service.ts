import api from './api';
import type { Ticket } from '@/types';

export const ticketService = {
  create: (data: {
    tripId: number;
    seatCount: number;
    pickUpLocation: string;
    dropOffLocation: string;
    guestName?: string;
    guestPhone?: string;
    guestEmail?: string;
  }) => api.post<Ticket>('/tickets', data),

  getMyTickets: () => api.get<Ticket[]>('/tickets/my'),

  getAll: (search?: string) => 
    api.get<Ticket[]>('/tickets', { params: { search } }),

  confirmCash: (id: number) => api.patch<Ticket>(`/tickets/${id}/confirm-cash`),

  cancel: (id: number, reason?: string) => api.patch<Ticket>(`/tickets/${id}/cancel`, { reason }),

  /** Guest: xem thông tin vé bằng email (không cần đăng nhập) */
  getGuestTicket: (id: number, email: string) =>
    api.get<Ticket>(`/tickets/${id}/guest-info`, { params: { email } }),

  /** Guest: tạo link thanh toán PayOS (không cần đăng nhập) */
  createGuestPayment: (id: number, email: string) =>
    api.post<{ paymentUrl: string; paymentId: number }>(`/tickets/${id}/guest-payment`, { email }),
};
