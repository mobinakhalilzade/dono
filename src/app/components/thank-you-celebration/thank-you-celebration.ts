import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThankYouAnimationId } from '../../models/dono.models';
import { formatToman } from '../../utils/formatters';
import { getAnimationPackById } from '../../utils/thank-you-animations';
import { AppIcon, IconName } from '../icon/icon';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  drag: number;
  rotation: number;
  vRot: number;
  kind: 'ribbon' | 'star' | 'heart' | 'spark' | 'ring';
  radius?: number;
  maxRadius?: number;
}

interface FireworkRocket {
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  exploded: boolean;
}

@Component({
  selector: 'app-thank-you-celebration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon],
  templateUrl: './thank-you-celebration.html',
  styleUrl: './thank-you-celebration.scss',
})
export class ThankYouCelebrationComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('fxCanvas');

  readonly open = input.required<boolean>();
  readonly animationId = input.required<ThankYouAnimationId>();
  readonly creatorName = input.required<string>();
  readonly creatorAvatarUrl = input.required<string>();
  readonly creatorVerified = input<boolean>(false);
  readonly supporterName = input<string>('حامی عزیز');
  readonly amount = input<number>(100_000);
  readonly postTitle = input<string | undefined>(undefined);
  readonly thankYouNote = input<string>('');
  readonly previewMode = input<boolean>(false);

  readonly closed = output<void>();

  protected readonly pulseKey = signal(0);
  protected readonly formatToman = formatToman;

  protected readonly pack = computed(() => getAnimationPackById(this.animationId()));

  protected readonly emblemIcon = computed<IconName>(() => {
    switch (this.animationId()) {
      case 'coral-hearts':
        return 'heart';
      case 'fireworks-gala':
        return 'flame';
      case 'golden-trophy':
        return 'trophy';
      case 'confetti-celebration':
        return 'sparkles';
      default:
        return 'check';
    }
  });

  protected readonly resolvedThankYouNote = computed(() => {
    const custom = this.thankYouNote().trim();
    if (custom) return custom;
    switch (this.animationId()) {
      case 'coral-hearts':
        return 'از صمیم قلب بابت این همراهی گرم و ارزشمند سپاسگزارم. حضور شما انگیزه ادامه راه است!';
      case 'fireworks-gala':
        return 'حمایت شما مانند چراغی در مسیر تولید محتوای مستقل درخشید. بی‌نهایت ممنونیم!';
      case 'golden-trophy':
        return 'شما یکی از حامیان طلایی و ویژه این صفحه هستید. قدردان اعتماد و سخاوت شما هستم!';
      case 'confetti-celebration':
        return 'هورا! حمایت شما با موفقیت ثبت شد و سهم بزرگی در خلق آثار تازه دارد. سپاس فراوان!';
      default:
        return 'حمایت شما با موفقیت ثبت شد. از همراهی و اعتماد شما سپاسگزاریم!';
    }
  });

  constructor() {
    effect((onCleanup) => {
      const isOpen = this.open();
      const anim = this.animationId();
      const _replay = this.pulseKey();
      const canvasEl = this.canvasRef()?.nativeElement;

      if (!isOpen || !isPlatformBrowser(this.platformId) || !canvasEl) {
        return;
      }

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        return;
      }

      const stop = this.runCanvasFx(canvasEl, anim);
      onCleanup(() => stop());
    });
  }

  protected replay(): void {
    this.pulseKey.update((k) => k + 1);
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  private runCanvasFx(canvas: HTMLCanvasElement, anim: ThankYouAnimationId): () => void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles: Particle[] = [];
    const rockets: FireworkRocket[] = [];

    const spawnConfettiBurst = () => {
      const palette = ['#5655CA', '#A5A6F6', '#EF6A4C', '#FF8A70', '#FBBF24', '#34D399'];
      for (let i = 0; i < 110; i++) {
        const fromLeft = i % 2 === 0;
        const angle = fromLeft
          ? -Math.PI / 3 + (Math.random() - 0.5) * 0.6
          : (-2 * Math.PI) / 3 + (Math.random() - 0.5) * 0.6;
        const speed = 9 + Math.random() * 11;
        particles.push({
          x: fromLeft ? width * 0.08 : width * 0.92,
          y: height * 0.85,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 7 + Math.random() * 7,
          color: palette[i % palette.length],
          alpha: 1,
          decay: 0.0055 + Math.random() * 0.004,
          gravity: 0.24,
          drag: 0.985,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.22,
          kind: i % 4 === 0 ? 'star' : 'ribbon',
        });
      }
    };

    const spawnHeartsWave = (count: number) => {
      const palette = ['#EF6A4C', '#FF8A70', '#FB7185', '#F472B6', '#A5A6F6'];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: width * (0.1 + Math.random() * 0.8),
          y: height + 20 + Math.random() * 120,
          vx: (Math.random() - 0.5) * 2.2,
          vy: -(3.2 + Math.random() * 4.2),
          size: 11 + Math.random() * 14,
          color: palette[i % palette.length],
          alpha: 0.95,
          decay: 0.0042 + Math.random() * 0.003,
          gravity: -0.012,
          drag: 0.995,
          rotation: (Math.random() - 0.5) * 0.5,
          vRot: (Math.random() - 0.5) * 0.03,
          kind: i % 3 === 0 ? 'spark' : 'heart',
        });
      }
    };

    const spawnFireworkBurst = (x: number, y: number, baseColor: string) => {
      const colors = [baseColor, '#A5A6F6', '#FF8A70', '#FBBF24', '#FFFFFF'];
      particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        size: 2,
        color: baseColor,
        alpha: 0.85,
        decay: 0.025,
        gravity: 0,
        drag: 1,
        rotation: 0,
        vRot: 0,
        kind: 'ring',
        radius: 6,
        maxRadius: 95,
      });
      for (let i = 0; i < 48; i++) {
        const angle = (Math.PI * 2 * i) / 48 + (Math.random() - 0.5) * 0.12;
        const speed = 2.2 + Math.random() * 6.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.5 + Math.random() * 3,
          color: colors[i % colors.length],
          alpha: 1,
          decay: 0.013 + Math.random() * 0.008,
          gravity: 0.08,
          drag: 0.96,
          rotation: 0,
          vRot: 0,
          kind: 'spark',
        });
      }
    };

    const spawnGoldenShower = () => {
      const goldPalette = ['#FBBF24', '#F59E0B', '#FDE68A', '#FFFBEB', '#FF8A70'];
      for (let i = 0; i < 95; i++) {
        particles.push({
          x: width * Math.random(),
          y: -20 - Math.random() * height * 0.4,
          vx: (Math.random() - 0.5) * 2.5,
          vy: 2.2 + Math.random() * 3.8,
          size: 5 + Math.random() * 8,
          color: goldPalette[i % goldPalette.length],
          alpha: 1,
          decay: 0.0048 + Math.random() * 0.003,
          gravity: 0.03,
          drag: 0.992,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.12,
          kind: i % 2 === 0 ? 'star' : 'spark',
        });
      }
    };

    if (anim === 'confetti-celebration') {
      spawnConfettiBurst();
    } else if (anim === 'coral-hearts') {
      spawnHeartsWave(64);
    } else if (anim === 'fireworks-gala') {
      const fireworkColors = ['#FF8A70', '#A5A6F6', '#FBBF24', '#34D399'];
      for (let i = 0; i < 5; i++) {
        rockets.push({
          x: width * (0.16 + i * 0.17),
          y: height + i * 35,
          targetY: height * (0.16 + (i % 3) * 0.12),
          vy: -(9 + Math.random() * 3),
          color: fireworkColors[i % fireworkColors.length],
          exploded: false,
        });
      }
    } else if (anim === 'golden-trophy') {
      spawnGoldenShower();
    } else {
      particles.push({
        x: width / 2,
        y: height / 2,
        vx: 0,
        vy: 0,
        size: 2,
        color: '#5655CA',
        alpha: 0.7,
        decay: 0.02,
        gravity: 0,
        drag: 1,
        rotation: 0,
        vRot: 0,
        kind: 'ring',
        radius: 16,
        maxRadius: 130,
      });
    }

    let frameId = 0;
    let frameCount = 0;

    const drawStar = (cx: number, cy: number, outerR: number) => {
      const innerR = outerR * 0.45;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / 4;
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    };

    const drawHeart = (cx: number, cy: number, s: number) => {
      ctx.beginPath();
      const topCurveHeight = s * 0.3;
      ctx.moveTo(cx, cy + topCurveHeight);
      ctx.bezierCurveTo(cx, cy, cx - s / 2, cy, cx - s / 2, cy + topCurveHeight);
      ctx.bezierCurveTo(
        cx - s / 2,
        cy + (s + topCurveHeight) / 2,
        cx,
        cy + (s + topCurveHeight) / 1.4,
        cx,
        cy + s,
      );
      ctx.bezierCurveTo(
        cx,
        cy + (s + topCurveHeight) / 1.4,
        cx + s / 2,
        cy + (s + topCurveHeight) / 2,
        cx + s / 2,
        cy + topCurveHeight,
      );
      ctx.bezierCurveTo(cx + s / 2, cy, cx, cy, cx, cy + topCurveHeight);
      ctx.closePath();
      ctx.fill();
    };

    const tick = () => {
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      if (anim === 'coral-hearts' && frameCount === 45) {
        spawnHeartsWave(36);
      }
      if (anim === 'golden-trophy' && frameCount === 55) {
        spawnGoldenShower();
      }
      if (anim === 'fireworks-gala' && frameCount === 70) {
        spawnFireworkBurst(width * 0.25, height * 0.25, '#FF8A70');
        spawnFireworkBurst(width * 0.75, height * 0.22, '#A5A6F6');
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        if (!r.exploded) {
          r.y += r.vy;
          ctx.save();
          ctx.fillStyle = r.color;
          ctx.beginPath();
          ctx.arc(r.x, r.y, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          if (r.y <= r.targetY) {
            r.exploded = true;
            spawnFireworkBurst(r.x, r.y, r.color);
            rockets.splice(i, 1);
          }
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.kind === 'ring') {
          p.radius = (p.radius ?? 4) + ((p.maxRadius ?? 100) - (p.radius ?? 4)) * 0.1;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          if (p.kind === 'ribbon') {
            ctx.fillRect(-p.size * 0.5, -p.size * 0.28, p.size, p.size * 0.56);
          } else if (p.kind === 'star') {
            drawStar(0, 0, p.size * 0.65);
          } else if (p.kind === 'heart') {
            drawHeart(0, -p.size * 0.45, p.size);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      if ((particles.length > 0 || rockets.length > 0) && frameCount < 420) {
        frameId = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      ctx.clearRect(0, 0, width, height);
    };
  }
}
