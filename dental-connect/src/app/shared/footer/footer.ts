import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent {
  year = new Date().getFullYear();
}
