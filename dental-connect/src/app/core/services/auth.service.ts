import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../../models/user';

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

  register(
    email: string,
    password: string,
    role: 'dentist' | 'patient',
    personalHealthNumber?: string
  ) {
    return this.api.post<User>('/users/register', {
      email,
      password,
      role,
      ...(role === 'dentist' && personalHealthNumber
      ? { personalHealthNumber }
      : {})
   }).pipe(
      tap(user => this.setUser(user))
  );
}

  login(email: string, password: string) {
    return this.api.post<User>('/users/login', { email, password }).pipe(
      tap(u => {
  const existing = this.user;
  const role = u.role ?? existing?.role;
  this.setUser({ ...u, role })
  })
)
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

