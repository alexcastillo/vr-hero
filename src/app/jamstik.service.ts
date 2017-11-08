import { Injectable, NgZone } from '@angular/core';
import Jamstik, { IMidiEvent, isOnFilter, isOffFilter } from 'jamstik';
import Soundfont from 'soundfont-player';

@Injectable()
export class JamstikService {

  constructor(private zone: NgZone) { }

  jamstik = new Jamstik();
  audioContext = new AudioContext();
  connected$ = this.jamstik.connectionStatus;
  instrument = Soundfont.instrument(this.audioContext, 'acoustic_guitar_nylon');;
  playing: { [ key: number ]: any } = {};
  isOnFilter = isOnFilter;
  isOffFilter = isOffFilter;

  async scan() {
    await this.jamstik.connect();
    this.addSound();
  }

  disconnect() {
    this.jamstik.disconnect();
  }

  get deviceName() {
    return this.jamstik.deviceName;
  }

  addSound () {
    this.jamstik.midi
      .subscribe(sample => this.handleSound(sample));
  }

  handleSound (sample: IMidiEvent) {
    if (isOnFilter(sample)) {
      this.playNote(sample);
      console.log(sample);
    }
    if (isOffFilter(sample)) {
      this.stopNote(sample);
    }
  }

  async playNote (sample: IMidiEvent) {
    const { note, velocity } = sample;
    if (!velocity) {
      return this.stopNote(sample);
    }
    const guitar = await this.instrument;
    this.playing[note] = guitar.play(note, null, {
      gain: velocity / 127.0
    });
  }

  stopNote(sample: IMidiEvent) {
    const { note } = sample;
    if (this.playing[note]) {
      this.playing[note].stop();
      this.playing[note] = null;
    }
  }

  changeInstrument (instrumentId: string) {
    this.zone.run(() => {
      this.instrument = Soundfont.instrument(this.audioContext, instrumentId);
    });
  }
}
