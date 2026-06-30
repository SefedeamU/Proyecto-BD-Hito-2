import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  template: `
    <div class="sk" aria-hidden="true">
      <div class="skeleton sk-cover"></div>
      <div class="skeleton sk-line"></div>
      <div class="skeleton sk-line sh"></div>
    </div>
  `,
  styles: [`.sk { width: 188px; max-width: 100%; }`],
})
export class SkeletonCard {}
