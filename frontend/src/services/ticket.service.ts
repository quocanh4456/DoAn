import api from './api';
import type { Ticket } from '@/types';

export const ticketService = {
  create: (data: {
    tripId: number;
    seatCount: number;
    pickUpLocation: string;
    dropOffLocation: string;
  }) => api.post<Ticket>('/tickets', data),

  getMyTickets: () => api.get<Ticket[]>('/tickets/my'),

  getAll: () => api.get<Ticket[]>('/tickets'),

  cancel: (id: number) => api.patch<Ticket>(`/tickets/${id}/cancel`),
};
