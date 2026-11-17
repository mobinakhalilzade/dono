import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppIcon } from '../../components/icon/icon';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AppIcon],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
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
