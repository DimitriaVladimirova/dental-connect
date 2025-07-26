import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DentistsService } from '../../../core/services/dentists.service';
import { AuthService } from '../../../core/services/auth.service';
import { DentistProfile } from '../../../models/dentist';

@Component({
  standalone: true,
  selector: 'app-dentist-details',
  templateUrl: '/dentist-details.html',
  styleUrls: ['/dentist-details.css'],
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DentistDetailsComponent {
  private route = inject(ActivatedRoute);
  private dentists = inject(DentistsService);
  protected auth = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);
  dentist = signal<DentistProfile | null>(null);

  isOwner = computed(() => {
    const d = this.dentist();
    const u = this.auth.user;
    return !!d && !!u && d._ownerId === u._id;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Invalid dentist id.');
      this.loading.set(false);
      return;
    }
    this.fetch(id);
  }

  fetch(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.dentists.getOne(id).subscribe({
      next: d => {
        if (!d) {
          this.error.set('Dentist not found.');
        } else {
          this.dentist.set(d);
        }
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Failed to load dentist');
        this.loading.set(false);
      }
    });
  }
}
