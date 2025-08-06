import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { DentistProfile } from '../../models/dentist';
import { Observable, map, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DentistsService {
  constructor(private api: ApiService) {}

  list(): Observable<DentistProfile[]> {
    return this.api.get<DentistProfile[]>('/data/dentists');
  }

  getOne(id: string): Observable<DentistProfile> {
    return this.api.get<DentistProfile>(`/data/dentists/${id}`);
  }

  create(profile: Partial<DentistProfile>): Observable<DentistProfile> {
    return this.api.post<DentistProfile>('/data/dentists', profile);
}

  update(id: string, profile: Partial<DentistProfile>): Observable<DentistProfile> {
    return this.api.put<DentistProfile>(`/data/dentists/${id}`, profile);
}

  delete(id: string) {
    return this.api.delete(`/data/dentists/${id}`);
  }
  
   loadMine(ownerId: string) {
    return this.list().pipe(
    map(list => list.find(dentist => dentist._ownerId === ownerId) || null)
  );
}

  upsertMine(ownerId: string, data: Partial<DentistProfile>): Observable<DentistProfile> {
    return this.loadMine(ownerId).pipe(
      switchMap(existing => {
        if (existing && existing._id) {
          return this.update(existing._id, { ...existing, ...data });
        }
        return this.create({ ...data });
      })
    );
  }

    deleteProfile(ownerId: string) {
      return this.loadMine(ownerId).pipe(
        switchMap(profile => {
        if (!profile?._id) throw new Error('No profile found');
     
        return this.delete(profile._id).pipe(map(() => void 0));
      })
    );
  }
}
