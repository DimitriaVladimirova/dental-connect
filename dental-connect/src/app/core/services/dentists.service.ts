import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { DentistProfile } from '../../models/dentist';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DentistsService {
  constructor(private api: ApiService) {}

  list(): Observable<DentistProfile[]> {
    return this.api.get<DentistProfile[]>('/data/dentists');
  }

  getOne(id: string): Observable<DentistProfile> {
    return this.api.get<DentistProfile>(`/data/dentists/${id}`);
  }

  create(profile: DentistProfile): Observable<DentistProfile> {
    return this.api.post<DentistProfile>('/data/dentists', profile);
  }

  update(id: string, profile: DentistProfile): Observable<DentistProfile> {
    return this.api.put<DentistProfile>(`/data/dentists/${id}`, profile);
  }

  delete(id: string) {
    return this.api.delete(`/data/dentists/${id}`);
  }
}
