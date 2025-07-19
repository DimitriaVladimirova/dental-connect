import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Purchase } from '../../models/purchase';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  constructor(private api: ApiService) {}

  purchase(promotionId: string, dentistId: string) {
    const body: Purchase = {
      promotionId,
      dentistId,
      createdOn: Date.now()
    };
    return this.api.post<Purchase>('/data/purchases', body);
  }

  myPurchases(userId: string) {
    const where = encodeURIComponent(`_ownerId="${userId}"`);
    return this.api.get<Purchase[]>(`/data/purchases?where=${where}`);
  }
}
