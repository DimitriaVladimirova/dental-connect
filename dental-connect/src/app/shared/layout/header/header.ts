import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  imports: [RouterLink, RouterLinkActive, NgIf, AsyncPipe]
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user$ = this.auth.user$;
  isLoggedIn = computed(() => this.auth.isLoggedIn());
  isDentist(): boolean {
  return this.auth.isLoggedIn() && this.auth.role === 'dentist';
}

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
