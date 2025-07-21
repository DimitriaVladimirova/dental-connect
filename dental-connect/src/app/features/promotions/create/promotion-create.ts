import {
  Component, ChangeDetectionStrategy, signal, inject, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PromotionsService } from '../../../core/services/promotions.service';
import { AuthService } from '../../../core/services/auth.service';
import { DentistsService } from '../../../core/services/dentists.service';
import { Router, RouterLink } from '@angular/router';

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

  loadingProfile = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  profileId = signal<string | null>(null);

  form = this.fb.group({
    service: ['', [Validators.required, Validators.minLength(2)]],
    price: [null as number | null, [Validators.required, Validators.min(1)]],
    description: ['']
  });

  ngOnInit(): void {
    if (!this.isDentist()) {
      this.error.set('Only logged-in dentists can create promotions.');
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
        }
        this.loadingProfile.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Failed to load dentist profile.');
        this.loadingProfile.set(false);
      }
    });
  }

  isDentist() {
    return this.auth.isLoggedIn() && this.auth.role === 'dentist';
  }

  fieldInvalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.touched && c.invalid;
  }

  submit() {
    if (this.saving() || this.loadingProfile()) return;

    if (!this.isDentist()) {
      this.error.set('Only logged-in dentists can create promotions.');
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

    this.promos.create({
      dentistId,
      service: service!.trim(),
      price: Number(price),
      description: (description || '').trim()
    }).subscribe({
      next: created => {
        this.saving.set(false);
        this.router.navigate(['/promotions'], { queryParams: { dentist: dentistId } });
      },
      error: err => {
        this.error.set(err.error?.message || 'Creation failed.');
        this.saving.set(false);
      }
    });
  }
}