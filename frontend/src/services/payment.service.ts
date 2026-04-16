import api from './api';

export const paymentService = {
  createVnpayUrl: (ticketId: number) =>
    api.post<{ paymentUrl: string; paymentId: number }>(
      '/payments/create-vnpay-url',
      { ticketId },
    ),
};
