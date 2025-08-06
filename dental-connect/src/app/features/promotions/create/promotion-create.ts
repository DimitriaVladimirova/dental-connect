import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PromotionsService } from '../../../core/services/promotions.service';
import { AuthService } from '../../../core/services/auth.service';
import { DentistsService } from '../../../core/services/dentists.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-promotion-create',
  templateUrl: './promotion-create.html',
  styleUrls: ['./promotion-create.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromotionCreate implements OnInit {
  private fb = inject(FormBuilder);
  private promos = inject(PromotionsService);
  private dentists = inject(DentistsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loadingProfile = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  profileId = signal<string | null>(null);
  promotionId = signal<string | null>(null);
  isEditMode = signal(false);

  form = this.fb.group({
    service: ['', [Validators.required, Validators.minLength(2)]],
    price: [null as number | null, [Validators.required, Validators.min(1)]],
    description: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.promotionId.set(id);
    this.isEditMode.set(!!id);

    if (!this.isDentist()) {
      this.error.set('Only logged-in dentists can manage promotions.');
      this.loadingProfile.set(false);
      return;
    }

    const user = this.auth.user!;

    this.dentists.loadMine(user._id).subscribe({
      next: prof => {
        if (!prof) {
          this.error.set('You need to create your dentist profile first.');
        } else {
          this.profileId.set(prof._id!);

          if (id) {
            this.promos.getOne(id).subscribe({
              next: promo => {
                this.form.patchValue({
                  service: promo.service,
                  price: promo.price,
                  description: promo.description
                });
              },
              error: err => {
                this.error.set('Failed to load promotion for editing.');
              }
            });
          }
        }
        this.loadingProfile.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Failed to load profile.');
        this.loadingProfile.set(false);
      }
    });
  }

  isDentist() {
    return this.auth.isLoggedIn() && this.auth.role === 'dentist';
  }

  fieldInvalid(name: string) {
    const field = this.form.get(name);
    return !!field && field.touched && field.invalid;
  }

  submit() {
    if (this.saving() || this.loadingProfile()) return;

    if (!this.isDentist()) {
      this.error.set('Only dentists can manage promotions.');
      return;
    }

    const dentistId = this.profileId();
    if (!dentistId) {
      this.error.set('Create your dentist profile before adding promotions.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const { service, price, description } = this.form.value;
    const payload = {
      dentistId,
      service: service!.trim(),
      price: Number(price),
      description: (description || '').trim()
    };

    const id = this.promotionId();
    const request$ = id
      ? this.promos.update(id, payload)
      : this.promos.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/promotions'], {
          queryParams: { dentist: dentistId }
        });
      },
      error: err => {
        this.error.set(err.error?.message || 'Operation failed.');
        this.saving.set(false);
      }
    });
  }
}
