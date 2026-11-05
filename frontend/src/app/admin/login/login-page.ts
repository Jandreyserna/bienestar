import { Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth-service';
import { apiErrorMessage } from '../../core/http/api-error';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="login">
      <form class="card login-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <a routerLink="/" class="back">← Volver al sitio</a>
        <h1>Panel de administración</h1>
        <p class="muted">Bienestar Moral</p>

        @if (expired()) {
          <div class="alert alert-info" role="status">Tu sesión expiró. Ingresa de nuevo.</div>
        }
        @if (error(); as message) {
          <div class="alert alert-error" role="alert">{{ message }}</div>
        }

        <div class="field">
          <label for="email">Correo</label>
          <input id="email" type="email" formControlName="email" autocomplete="username" />
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password" />
        </div>
        <button class="btn btn-primary" type="submit" [disabled]="loading()">
          {{ loading() ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>
    </main>
  `,
  styles: `
    .login { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem var(--bm-gutter);
      background: radial-gradient(circle at 20% 10%, var(--bm-primary-soft), transparent 50%),
                  radial-gradient(circle at 90% 90%, var(--bm-accent-soft), transparent 45%); }
    .login-card { width: min(100%, 420px); padding: 2rem; }
    h1 { font-size: 1.7rem; margin: 1rem 0 0.25rem; }
    .back { font-size: 0.9rem; text-decoration: none; }
    .btn { width: 100%; }
  `,
})
export class LoginPage {
  /** Query params: ?volver=/admin/cartillas&motivo=expired */
  readonly volver = input<string>();
  readonly motivo = input<string>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly expired = computed(() => this.motivo() === 'expired');

  constructor() {
    if (this.auth.isAuthenticated()) void this.router.navigateByUrl('/admin');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Escribe un correo válido y tu contraseña.');
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .login(email, password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.volver()?.startsWith('/admin') ? this.volver()! : '/admin'),
        error: (err: unknown) => this.error.set(apiErrorMessage(err, 'No fue posible iniciar sesión.')),
      });
  }
}
