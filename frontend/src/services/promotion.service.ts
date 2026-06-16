import api from './api';

export interface PromoValidateResult {
  valid: boolean;
  code: string;
  description: string;
  discountPercent: number;
  discountAmount: number;
  maxDiscount: number;
  finalAmount: number;
}

export const promotionService = {
  validate: (code: string, totalAmount: number) =>
    api.post<PromoValidateResult>('/promotions/validate', { code, totalAmount }),
};
