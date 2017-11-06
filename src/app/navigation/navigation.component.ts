import { Component, Input } from '@angular/core';

import { JamstikService } from '../jamstik.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent {

  constructor(private jamstikService: JamstikService) {
    this.jamstikService = jamstikService;
  }

}
