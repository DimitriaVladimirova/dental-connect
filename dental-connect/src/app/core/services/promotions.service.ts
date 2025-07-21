import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Promotion } from '../../models/promotion';
import { Observable, map } from 'rxjs';

type PromotionCreate = Omit<Promotion, '_id' | '_ownerId' | '_createdOn' | '_updatedOn'>;
type PromotionUpdate = Omit<Promotion, '_ownerId' | '_createdOn' | '_updatedOn'>;

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

  listByDentistClient(dentistId: string): Observable<Promotion[]> {
    return this.list().pipe(
      map(arr => arr.filter(p => p.dentistId === dentistId))
    );
  }

  getOne(id: string): Observable<Promotion> {
    return this.api.get<Promotion>(`/data/promotions/${id}`);
  }

  create(promo: PromotionCreate): Observable<Promotion> {
    const payload = { ...promo, price: Number(promo.price) };
    return this.api.post<Promotion>('/data/promotions', payload);
  }

  update(id: string, promo: PromotionUpdate): Observable<Promotion> {
    const payload = { ...promo, price: Number(promo.price) };
    return this.api.put<Promotion>(`/data/promotions/${id}`, payload);
  }

  delete(id: string): Observable<unknown> {
    return this.api.delete(`/data/promotions/${id}`);
  }
}