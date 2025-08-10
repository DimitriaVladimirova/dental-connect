import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { DentistsService } from '../../../core/services/dentists.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class RegisterComponent {
  loading = false;
  error = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private dentistsService: DentistsService
  ) {
    const patient = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/)
      ]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      repass: ['', [Validators.required]],
    }, {
      validators: (group) => {
        const pass = group.get('password')?.value;
        const rePass = group.get('repass')?.value;
        return pass && rePass && pass !== rePass ? { mismatch: true } : null;
      }
    });

    const dentist = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/)
      ]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      repass: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)]],
      personalHealthNumber: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^\d+$/)]],
    }, {
      validators: (group) => {
        const pass = group.get('password')?.value;
        const rePass = group.get('repass')?.value;
        return pass && rePass && pass !== rePass ? { mismatch: true } : null;
      }
    });

    this.form = this.fb.group({
      role: ['patient', Validators.required],
      patient,
      dentist
    });

    const roleCtrl = this.form.get('role')!;
    this.applyGroupState(roleCtrl.value);
    roleCtrl.valueChanges.subscribe((role: 'patient' | 'dentist') => this.applyGroupState(role));
  }

  get role(): 'patient' | 'dentist' {
    return this.form.get('role')!.value as 'patient' | 'dentist';
  }
  get patientGroup() { return this.form.get('patient') as FormGroup; }
  get dentistGroup() { return this.form.get('dentist') as FormGroup; }
  get isDentist() { return this.role === 'dentist'; }

  private applyGroupState(role: 'patient' | 'dentist') {
    if (role === 'patient') {
      this.patientGroup.enable({ emitEvent: false });
      this.dentistGroup.disable({ emitEvent: false });
    } else {
      this.dentistGroup.enable({ emitEvent: false });
      this.patientGroup.disable({ emitEvent: false });
    }
  }

    submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    if (this.role === 'patient') {
      const { email, password } = this.patientGroup.value;
      const cleanEmail = (email ?? '').trim();
      const cleanPassword = (password ?? '').trim();

      this.auth.register(cleanEmail, cleanPassword, 'patient', undefined).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigateByUrl('/');
        },
        error: err => {
          this.loading = false;
          this.error = err?.error?.message || 'Registration failed';
        }
      });
    } else {
      const { email, password, personalHealthNumber } = this.dentistGroup.value;
      const cleanEmail = (email ?? '').trim();
      const cleanPassword = (password ?? '').trim();
      const cleanPHN = String(personalHealthNumber ?? '').trim();

      this.auth.register(cleanEmail, cleanPassword, 'dentist', cleanPHN).subscribe({
        next: () => {
        this.loading = false;
        this.router.navigateByUrl('/dentists/profile/create');
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || 'Registration failed';
        }
      });
    }
  }
}
