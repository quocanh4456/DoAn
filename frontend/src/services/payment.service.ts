import api from './api';

export const paymentService = {
  createPayOSUrl: (ticketId: number) =>
    api.post<{ paymentUrl: string; paymentId: number }>(
      '/payments/create-payos-url',
      { ticketId },
    ),

  createPayOSUrlMulti: (ticketIds: number[]) =>
    api.post<{ paymentUrl: string; paymentId: number }>(
      '/payments/create-payos-url-multi',
      { ticketIds },
    ),
};
