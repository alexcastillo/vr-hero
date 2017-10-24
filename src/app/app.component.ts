import { RealtimeService } from './realtime.service';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import Jamstik from 'jamstik';
import Soundfont from 'soundfont-player';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  audioContext = new AudioContext();
  jamstik = new Jamstik();
  instrument = null;
  playing: {[key: number]: any} = {};

  constructor(private realtime: RealtimeService) {}

  async scan() {
    await this.jamstik.connect();
    this.onConnect();
  }

  firstFrets = [52, 47, 43, 38, 33 , 28];

  // @TODO: Need to add startTime in milliseconds from the song start time
  demoSong = [
    { header: 189, timestamp: 228, status: 147, note: 40, velocity: 105 },
    { header: 135, timestamp: 147, status: 147, note: 40, velocity: 81 },
    { header: 140, timestamp: 193, status: 147, note: 43, velocity: 87 },
    { header: 146, timestamp: 179, status: 147, note: 40, velocity: 83 },
    { header: 155, timestamp: 241, status: 147, note: 38, velocity: 99 },
    { header: 163, timestamp: 245, status: 148, note: 36, velocity: 70 },
    { header: 183, timestamp: 129, status: 148, note: 35, velocity: 102 }
  ];

  onConnect () {
    this.jamstik.midi
      .subscribe(sample => {
        this.onMidi(sample);
      });
  }

  onMidi (sample) {
    const { status, note, velocity } = sample;
    const stringId = status - 0x90;
    const fret = note - this.firstFrets[stringId];

    if (status >= 0x80 && status < 0x90) {
      this.stopNote(sample);
    }
    if (status >= 0x90 && status < 0xa0) {
      this.playNote(sample);
      this.realtime.addEvent({
        note,
        fret,
        stringId
      });
      console.log(sample);
    }
  }

  async playNote (sample) {
    const { note, velocity } = sample;
    if (!velocity) {
      return this.stopNote(sample);
    }
    const guitar = await this.instrument;
    this.playing[note] = guitar.play(note, null, {gain: velocity / 127.0});
  }

  stopNote(sample) {
    const { note } = sample;
    if (this.playing[note]) {
      this.playing[note].stop();
      this.playing[note] = null;
    }
  }

  changeInstrument (instrumentId) {
    this.instrument = Soundfont.instrument(this.audioContext, instrumentId);
  }

}
