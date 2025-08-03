import { Component, ChangeDetectionStrategy, signal, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PromotionsService } from "../../../core/services/promotions.service";
import { AuthService } from "../../../core/services/auth.service";
import { ActivatedRoute, RouterLink, Router } from "@angular/router";
import { Promotion } from "../../../models/promotion";
import { DentistsService } from "../../../core/services/dentists.service";
import { DentistProfile } from "../../../models/dentist";
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    standalone:true,
    selector: 'app-promotions-list',
    templateUrl: 'promotions-list.html',
    styleUrls: ['promotions-list.css'],
    imports: [CommonModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})

export class PromotionsListComponent {
  private promos = inject(PromotionsService);
  private dentistsSvc = inject(DentistsService);
  protected auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router)

  loading = signal(true);
  error = signal<string | null>(null);

  all = signal<Promotion[]>([]);
  dentistProfiles = signal<DentistProfile[]>([]);
  dentistNameMap = computed(() =>
    this.dentistProfiles().reduce<Record<string, DentistProfile>>((acc, d) => {
      if (d._id) acc[d._id] = d;
      return acc;
    }, {})
  );

  dentistFilter = signal<string | null>(null);

  filtered = computed(() => {
    const id = this.dentistFilter();
    const list = this.all();
    return id ? list.filter(p => p.dentistId === id) : list;
  });

  constructor() {
    const queryDentist = this.route.snapshot.queryParamMap.get('dentist');
    if (queryDentist) this.dentistFilter.set(queryDentist);
    this.fetch();
  }

  fetch() {
    this.loading.set(true);
    this.error.set(null);

    let promosLoaded = false;
    let dentistsLoaded = false;

    const done = () => {
      if (promosLoaded && dentistsLoaded) {
        this.loading.set(false);
      }
    };

    this.promos.list().subscribe({
      next: list => {
        this.all.set(list);
        promosLoaded = true;
        done();
      },
      error: err => {
        this.error.set(err.error?.message || 'Failed to load promotions');
        promosLoaded = true;
        done();
      }
    });

    this.dentistsSvc.list().subscribe({
      next: dentists => {
        this.dentistProfiles.set(dentists);
        dentistsLoaded = true;
        done();
      },
      error: err => {
        console.warn('Failed to load dentists', err);
        dentistsLoaded = true;
        done();
      }
    });
  }

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }

  isDentist() {
    return this.auth.isLoggedIn() && this.auth.role === 'dentist';
  }

  dentistName(p: Promotion): string {
    const profile = this.dentistNameMap()[p.dentistId];
    return profile?.fullName || 'Unknown dentist';
  }

  dentistProfileLink(p: Promotion): string | null {
    const profile = this.dentistNameMap()[p.dentistId];
    return profile?._id ? `/dentists/${profile._id}` : null;
  }

  buy(p: Promotion) {
  if (!this.isLoggedIn()) {
    alert('Please log in to buy promotions.');
    return;
  }
  if (this.isDentist() && p._ownerId === this.auth.user?._id) {
    alert('You cannot buy your own promotion.');
    return;
  }
  alert('You just bought this dental service. Please contact the dentist.');
}

  editPromotion(p: Promotion) {
    this.router.navigate(['/promotions', p._id, 'edit']);
}

  deletePromotion(p: Promotion) {
    if (!confirm('Delete this promotion?')) return;
    this.promos.delete(p._id!).subscribe({
      next: () => this.fetch(),
      error: err => alert(err.error?.message || 'Delete failed')
    });
  }
}