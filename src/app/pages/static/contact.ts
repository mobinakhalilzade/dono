import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppIcon } from '../../components/icon/icon';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AppIcon],
  template: `
    <section class="static-page">
      <div class="container static-narrow">
        <header class="static-head">
          <h1 class="static-title balance-text">تماس با دونو</h1>
          <p class="static-lead">
            پیشنهاد، سوال یا نیاز به راهنمایی دارید؟ پیام خود را ارسال کنید.
          </p>
        </header>

        <div class="surface-card contact-card">
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="contact-form">
            <div class="two-cols">
              <div class="field-group">
                <label for="contact-name" class="field-label">نام و نام خانوادگی</label>
                <input
                  id="contact-name"
                  type="text"
                  formControlName="name"
                  class="field-input"
                  [class.is-invalid]="submitted() && !!errors()['name']"
                  placeholder="مثلاً مهسا رضایی"
                />
                @if (submitted() && errors()['name']; as err) {
                  <span class="field-error">
                    <app-icon name="alert" [size]="14" />
                    <span>{{ err }}</span>
                  </span>
                }
              </div>

              <div class="field-group">
                <label for="contact-email" class="field-label">ایمیل</label>
                <input
                  id="contact-email"
                  type="email"
                  dir="ltr"
                  formControlName="email"
                  class="field-input"
                  [class.is-invalid]="submitted() && !!errors()['email']"
                  placeholder="name@example.com"
                />
                @if (submitted() && errors()['email']; as err) {
                  <span class="field-error">
                    <app-icon name="alert" [size]="14" />
                    <span>{{ err }}</span>
                  </span>
                }
              </div>
            </div>

            <div class="field-group">
              <label for="contact-subject" class="field-label">موضوع</label>
              <input
                id="contact-subject"
                type="text"
                formControlName="subject"
                class="field-input"
                [class.is-invalid]="submitted() && !!errors()['subject']"
                placeholder="مثلاً سوال درباره تسویه حساب"
              />
              @if (submitted() && errors()['subject']; as err) {
                <span class="field-error">
                  <app-icon name="alert" [size]="14" />
                  <span>{{ err }}</span>
                </span>
              }
            </div>

            <div class="field-group">
              <label for="contact-msg" class="field-label">متن پیام</label>
              <textarea
                id="contact-msg"
                formControlName="message"
                class="field-textarea"
                [class.is-invalid]="submitted() && !!errors()['message']"
                placeholder="پیام خود را با جزئیات بنویسید..."
              ></textarea>
              @if (submitted() && errors()['message']; as err) {
                <span class="field-error">
                  <app-icon name="alert" [size]="14" />
                  <span>{{ err }}</span>
                </span>
              }
            </div>

            @if (sent()) {
              <div class="status-banner is-success" role="status">
                <app-icon name="check" [size]="18" />
                <span>پیام شما با موفقیت ثبت شد. همکاران ما در اسرع وقت پاسخ می‌دهند.</span>
              </div>
            }

            <button type="submit" class="btn btn-primary">ارسال پیام</button>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: `
    .static-page {
      padding-block: 3rem 2rem;
    }
    .static-narrow {
      max-inline-size: 720px;
    }
    .static-head {
      margin-block-end: 1.75rem;
    }
    .static-title {
      margin: 0;
      font-size: clamp(1.75rem, 3vw, 2.4rem);
      font-weight: 800;
    }
    .static-lead {
      margin: 0.5rem 0 0;
      color: var(--text-secondary);
    }
    .contact-card {
      padding: 1.75rem;
      border-block-start: 3px solid var(--accent);
    }
    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .two-cols {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    @media (min-width: 640px) {
      .two-cols {
        grid-template-columns: 1fr 1fr;
      }
    }
    .status-banner.is-success {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      background-color: var(--success-bg);
      color: var(--success-text);
      font-weight: 600;
      font-size: 0.9rem;
    }
  `,
})
export class ContactComponent {
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    subject: new FormControl('', { nonNullable: true }),
    message: new FormControl('', { nonNullable: true }),
  });

  protected readonly submitted = signal(false);
  protected readonly sent = signal(false);
  protected readonly errors = signal<Record<string, string>>({});

  protected submit(): void {
    this.submitted.set(true);
    this.sent.set(false);
    const val = this.form.getRawValue();
    const errs: Record<string, string> = {};

    if (val.name.trim().length < 2) {
      errs['name'] = 'لطفاً نام خود را وارد کنید.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.email.trim())) {
      errs['email'] = 'آدرس ایمیل معتبر وارد کنید.';
    }
    if (val.subject.trim().length < 3) {
      errs['subject'] = 'موضوع پیام حداقل باید ۳ کاراکتر باشد.';
    }
    if (val.message.trim().length < 10) {
      errs['message'] = 'متن پیام حداقل باید ۱۰ کاراکتر باشد.';
    }

    this.errors.set(errs);
    if (Object.keys(errs).length > 0) return;

    this.sent.set(true);
    this.submitted.set(false);
    this.form.reset({ name: '', email: '', subject: '', message: '' });
  }
}
