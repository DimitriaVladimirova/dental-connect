import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DentistsService } from '../../../core/services/dentists.service';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { DentistProfile } from '../../../models/dentist';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  standalone: true,
  selector: 'app-dentists-list',
  templateUrl: './dentists-list.html',
  styleUrls: ['./dentists-list.css'],
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
export class DentistsListComponent {

  private dentistsService = inject(DentistsService);
  protected auth = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);
  dentists = signal<DentistProfile[]>([]);

  constructor() {
    this.fetch();
  }

  fetch() {
    this.loading.set(true);
    this.error.set(null);
    this.dentistsService.list().subscribe({
      next: list => {
        this.dentists.set(list);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Failed to load dentists');
        this.loading.set(false);
      }
    });
  }

  trackById = (_: number, d: DentistProfile) => d._id;

  isDentistLoggedIn() {
    return this.auth.isLoggedIn() && this.auth.role === 'dentist';
  }
}
