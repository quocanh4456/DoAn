import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '@/services/api';

export function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    api
      .get('/payments/vnpay-return', { params })
      .then(({ data }) => setResult(data))
      .catch(() =>
        setResult({ success: false, message: 'Không thể xác minh thanh toán' }),
      );
  }, [searchParams]);

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
        Đang xác minh thanh toán...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <Card className="w-full max-w-md text-center shadow-xl border-0">
        <CardHeader className="pb-2">
          {result.success ? (
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          )}
          <CardTitle className="text-2xl">
            {result.success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">{result.message}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/customer/tickets">
              <Button className="px-6">{result.success ? 'Xem vé của tôi' : 'Thử lại'}</Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="px-6">Về trang chủ</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
