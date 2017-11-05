import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'fretboard',
  templateUrl: './fretboard.component.html',
  styleUrls: ['./fretboard.component.css']
})
export class FretboardComponent implements OnInit {

  constructor() { }

  strings = 6;
  frets = 6;
  grid = this.create();

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

  press (notes = []) {
    this.reset();
    this.grid.map((string, stringIndex) =>
      string.map((fret, fretIndex) => {
        notes.forEach(note => {
          if (note.string === stringIndex + 1
            && note.fret === fretIndex + 1) {
            fret.pressed = true;
          };
        });
        return fret;
      })
    );
  }

  ngOnInit () {
    this.press([
      { string: 1, fret: 3 },
      { string: 4, fret: 1 }
    ]);
  }

}
