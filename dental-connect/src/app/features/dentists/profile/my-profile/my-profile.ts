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
    const dentist = this.profile();
    const user = this.auth.user;
    return !!dentist && !!user && dentist._ownerId === user._id;
  });

  ngOnInit() {
    const user = this.auth.user;
    if (!user || this.auth.role !== 'dentist') {
      this.error.set('Only dentists may view this page.');
      this.loading.set(false);
      return;
    }

    this.dentists.loadMine(user._id).subscribe({
      next: profile => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Could not load profile');
        this.loading.set(false);
      }
    });
  }

  onEdit() {
    this.router.navigate(['dentists/profile/edit']);
  }

  onDelete() {
    const profile = this.profile();
    if (!profile?._id) return;
    if (!profile?._id || !confirm('Delete your profile?')) return;
    this.dentists.delete(profile._id).subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/']);
      },
      error: err => alert(err.error?.message || 'Delete failed')
    });
  }
}