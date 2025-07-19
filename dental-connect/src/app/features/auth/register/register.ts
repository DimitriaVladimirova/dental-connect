import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class RegisterComponent {
  loading = false;
  error = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      role: ['patient', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      repass: ['', [Validators.required]],
      fullName: [''],
      personalHealthNumber: ['']
    }, {
      validators: group => {
        const pass = group.get('password')?.value;
        const repass = group.get('repass')?.value;
        return pass && repass && pass !== repass ? { mismatch: true } : null;
      }
    });
  }

  get isDentist() {
    return this.form.controls['role'].value === 'dentist';
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { email, password, role } = this.form.value;
    this.auth.register(email, password, role).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed';
      }
    });
  }
}
