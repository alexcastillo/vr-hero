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

  async scan() {
    await this.jamstik.connect();
    this.onConnect();
  }

  onConnect () {
    this.jamstik.midi
      .subscribe(sample => {
        this.onMidi(sample);
        console.log(sample);
      });
  }

  onMidi (sample) {
    const { status, note, velocity } = sample;
    if (status >= 0x80 && status < 0x90) {
      this.stopNote(sample);
    }
    if (status >= 0x90 && status < 0xa0) {
      this.playNote(sample);
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
