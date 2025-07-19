import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-footer',
  template: `
    <footer class="site-footer">
      <p>&copy; {{ year }} Dentist Connect. All rights reserved.</p>
    </footer>
  `,
  styles: [`
    .site-footer {
      margin-top:auto;
      padding:1.25rem 1rem;
      background:#f5f7fa;
      border-top:1px solid #e3e8ee;
      text-align:center;
      font-size:.85rem;
      color:#5b6672;
    }
  `]
})
export class FooterComponent {
  year = new Date().getFullYear();
}
