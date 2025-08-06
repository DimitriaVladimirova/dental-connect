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
      tap(users => {
  const existing = this.user;
  const role = users.role ?? existing?.role;
  this.setUser({ ...users, role })
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

  private setUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    this.userSubject.next(user);
  }

  private clearUser() {
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }
}

