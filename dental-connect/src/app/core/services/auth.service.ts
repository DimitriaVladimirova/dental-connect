import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface User {
  _id: string;
  email: string;
  accessToken: string;
  role?: 'dentist' | 'patient';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private api: ApiService) {
    const stored = localStorage.getItem('user');
    if (stored) this.userSubject.next(JSON.parse(stored));
  }

  get user(): User | null { return this.userSubject.value; }
  get token(): string | undefined { return this.user?.accessToken; }
  isLoggedIn(): boolean { return !!this.user?.accessToken; }

  register(email: string, password: string, role: 'dentist' | 'patient') {
    return this.api.post<User>('/users/register', { email, password }).pipe(
      tap(u => this.setUser({ ...u, role }))
    );
  }

  login(email: string, password: string) {
    return this.api.post<User>('/users/login', { email, password }).pipe(
      tap(u => {
        // we cannot know role from backend yet – keep previous role if same email
        const existing = this.user;
        const role = existing?.email === u.email ? existing.role : undefined;
        this.setUser({ ...u, role });
      })
    );
  }

  logout() {
    if (!this.isLoggedIn()) return;
    this.api.get('/users/logout').subscribe({
      complete: () => this.clearUser(),
      error: () => this.clearUser()
    });
  }

  setRole(role: 'dentist' | 'patient') {
    if (this.user) {
      const updated = { ...this.user, role };
      this.setUser(updated);
    }
  }

  get role(): 'dentist' | 'patient' | undefined {
  return this.user?.role;
}

  private setUser(u: User) {
    localStorage.setItem('user', JSON.stringify(u));
    this.userSubject.next(u);
  }

  private clearUser() {
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }
}

