import { Component, OnInit, Input } from '@angular/core';
import { IMidiEvent } from 'jamstik';

import { MidiService } from '../midi.service';

@Component({
  selector: 'fretboard',
  templateUrl: './fretboard.component.html',
  styleUrls: ['./fretboard.component.css']
})
export class FretboardComponent implements OnInit {

  @Input() notes;

  constructor(private midi: MidiService) {
  }

  strings = 6;
  frets = 6;
  grid = this.create();

  ngOnInit () {
    this.notes.subscribe(sample => {
      const note = this.midi.addMetadata(sample);
      console.log('note', note);
      if (this.midi.isInactiveNote(note)) {
        this.release(note);
      }
      if (this.midi.isActiveNote(note)) {
        this.press(note);
      }
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
    const fret = this.grid[note.stringId][note.fret]
    if (fret && !fret.pressed) {
      fret.pressed = stop ? false : true;
    }
  }

  press (note) {
    this.change(note);
  }

  release (note) {
    this.change(note, true);
  }

}
