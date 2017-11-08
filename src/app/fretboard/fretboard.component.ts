import { Component, OnInit, Input, NgZone } from '@angular/core';

import { JamstikService } from '../jamstik.service';

@Component({
  selector: 'jamstik-fretboard',
  templateUrl: './fretboard.component.html',
  styleUrls: ['./fretboard.component.scss']
})
export class FretboardComponent implements OnInit {

  constructor(private jamstikService: JamstikService, private zone: NgZone) {
  }

  strings = 6;
  frets = 6;
  grid = this.create();

  ngOnInit () {
    this.jamstikService.jamstik.midi
      .subscribe(note => {
        this.zone.run(() => {
          if (this.jamstikService.isOffFilter(note)) {
            this.release(note);
          }
          if (this.jamstikService.isOnFilter(note)) {
            this.press(note);
          }
        });
      });
  }

  create (strings = this.strings, frets = this.frets) {
    return Array.from({ length: strings },
      () => Array.from({ length: frets }, () => ({
        pressed: false
      }))
    );
  }

  reset () {
    this.grid = this.create();
  }

  change (note, stop = false) {
    const fret = this.grid[note.stringId][note.fret];
    fret.pressed = !stop;
  }

  press (note) {
    this.change(note);
  }

  release (note) {
    this.change(note, true);
  }

}
