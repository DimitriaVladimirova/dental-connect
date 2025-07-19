import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Promotion } from '../../models/promotion';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PromotionsService {
  constructor(private api: ApiService) {}

  list(): Observable<Promotion[]> {
    return this.api.get<Promotion[]>('/data/promotions');
  }

  listByDentist(dentistId: string): Observable<Promotion[]> {
    const where = encodeURIComponent(`dentistId="${dentistId}"`);
    return this.api.get<Promotion[]>(`/data/promotions?where=${where}`);
  }

  getOne(id: string): Observable<Promotion> {
    return this.api.get<Promotion>(`/data/promotions/${id}`);
  }

  create(promo: Promotion): Observable<Promotion> {
    return this.api.post<Promotion>('/data/promotions', promo);
  }

  update(id: string, promo: Promotion): Observable<Promotion> {
    return this.api.put<Promotion>(`/data/promotions/${id}`, promo);
  }

  delete(id: string) {
    return this.api.delete(`/data/promotions/${id}`);
  }
}
