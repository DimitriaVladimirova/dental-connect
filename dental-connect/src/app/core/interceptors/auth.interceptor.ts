import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const stored = localStorage.getItem('user');
  if (stored) {
    const { accessToken } = JSON.parse(stored);
    if (accessToken) {
      req = req.clone({ setHeaders: { 'x-authorization': accessToken } });
    }
  }
  return next(req);
};
