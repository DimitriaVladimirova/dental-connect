import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DentistsService } from '../../../../core/services/dentists.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DentistProfile } from '../../../../models/dentist';
import { DentistProfileFormComponent } from '../dentist-profile-form';

@Component({
  selector: 'app-my-profile',
  imports: [CommonModule, DentistProfileFormComponent],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css'
})
export class MyProfile implements OnInit{
  private auth = inject(AuthService);
  private router = inject(Router);
  private dentists = inject(DentistsService);

  loading = signal(true);
  error   = signal<string|null>(null);
  profile = signal<DentistProfile|null>(null);

  isOwner = computed(() => {
    const d = this.profile();
    const u = this.auth.user;
    return !!d && !!u && d._ownerId === u._id;
  });

  ngOnInit() {
    const u = this.auth.user;
    if (!u || this.auth.role !== 'dentist') {
      this.error.set('Only dentists may view this page.');
      this.loading.set(false);
      return;
    }

    this.dentists.loadMine(u._id).subscribe({
      next: p => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: e => {
        this.error.set(e.error?.message || 'Could not load profile');
        this.loading.set(false);
      }
    });
  }

  onEdit() {
    this.router.navigate(['dentists/profile/edit']);
  }

  onDelete() {
    const p = this.profile();
    if (!p?._id) return;
    if (!p?._id || !confirm('Delete your profile?')) return;
    this.dentists.delete(p._id).subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/']);
      },
      error: e => alert(e.error?.message || 'Delete failed')
    });
  }
}