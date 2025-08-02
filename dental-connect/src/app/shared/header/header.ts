import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf, CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  imports: [ CommonModule, RouterLink, NgIf, RouterLinkActive ]})

export class HeaderComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);
  user$ = this.auth.user$;
  
  isDentist = computed(() => {
    const user = this.auth.user;
    return !!user && user.role === 'dentist';
  });
  
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
