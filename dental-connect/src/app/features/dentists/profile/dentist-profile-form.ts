import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DentistsService } from '../../../core/services/dentists.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-dentist-profile-form',
  templateUrl: './dentist-profile-form.html',
  styleUrls: ['./dentist-profile-form.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class DentistProfileFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dentists = inject(DentistsService);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  existingId = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    university: [''],
    workplace: [''],
    specialization: [''],
    imageUrl: [''],
    details: [''],
    phone: ['']
  });

  mode = computed(() => this.existingId() ? 'Edit' : 'Create');

  ngOnInit(): void {
    const user = this.auth.user;
    if (!user || this.auth.role !== 'dentist') {
      this.error.set('Only logged-in dentists can access this page.');
      this.loading.set(false);
      return;
    }

    this.dentists.loadMine(user._id).subscribe({
      next: profile => {
        if (profile) {
          this.existingId.set(profile._id!);
           
          this.form.patchValue({
            fullName: profile.fullName ?? '',
            university: profile.university ?? '',
            workplace: profile.workplace ?? '',
            specialization: profile.specialization ?? '',
            imageUrl: profile.imageUrl ?? '',
            details: profile.details ?? '',
            phone: profile.phone ?? ''
          });
        }
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Failed to load profile');
        this.loading.set(false);
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const user = this.auth.user;
    if (!user) return;

    this.saving.set(true);
    this.error.set(null);

    this.dentists.upsertMine(user._id, this.form.value).subscribe({
      next: saved => {
        this.saving.set(false);
        this.router.navigate(['/profile']);
      },
      error: err => {
        this.error.set(err.error?.message || 'Save failed');
        this.saving.set(false);
      }
    });
  }

  fieldInvalid(name: keyof typeof this.form.controls) {
    const ctrl = this.form.controls[name];
    return ctrl.touched && ctrl.invalid;
  }
}
