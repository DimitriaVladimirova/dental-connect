import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DentistsService } from '../../../core/services/dentists.service';
import { AuthService } from '../../../core/services/auth.service';
import { PromotionsService } from '../../../core/services/promotions.service';
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
  private promos = inject(PromotionsService);

  loading = signal(true);
  error = signal<string | null>(null);
  dentist = signal<DentistProfile | null>(null);
  totalPurchases = signal(0);

  isOwner = computed(() => {
    const dentist = this.dentist();
    const user = this.auth.user;
    return !!dentist && !!user && dentist._ownerId === user._id;
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
      next: dentist => {
        if (!dentist) {
          this.error.set('Dentist not found.');
        } else {
          this.dentist.set(dentist);
          this.loadPurchases();
        }
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Failed to load dentist');
        this.loading.set(false);
      }
    });
  }

  loadPurchases() {
    const dentistId = this.route.snapshot.paramMap.get('id')!;
    
    this.promos.getPurchasesByDentist(dentistId).subscribe({
      next: purchases => this.totalPurchases.set(purchases.length),
      error: err => console.warn('Failed to load purchases', err)
    });
  }
}
