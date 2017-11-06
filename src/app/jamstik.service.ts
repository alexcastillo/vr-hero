import { Injectable, NgZone } from '@angular/core';
import Jamstik, { IMidiEvent } from 'jamstik';
import Soundfont from 'soundfont-player';

@Injectable()
export class JamstikService {

  constructor(private zone: NgZone) { }

  jamstik = new Jamstik();
  audioContext = new AudioContext();
  connected$ = this.jamstik.connectionStatus;
  instrument = Soundfont.instrument(this.audioContext, 'acoustic_guitar_nylon');;
  playing: { [ key: number ]: any } = {};
  firstFrets = [64, 59, 55, 50, 45, 40]; // Standard tunning

  async scan() {
    await this.jamstik.connect();
    this.playNotes();
  }

  disconnect() {
    this.jamstik.disconnect();
  }

  get deviceName() {
    return this.jamstik.deviceName;
  }

  onMidi (sample: IMidiEvent) {
    const { status } = sample;
    if (this.isInactiveNote(sample)) {
      this.stopNote(sample);
    }
    if (this.isActiveNote(sample)) {
      this.playNote(sample);
      console.log(sample);
    }
  }

  playNotes () {
    this.jamstik.midi
      .subscribe(sample => {
        this.onMidi(this.addMetadata(sample));
      });
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

  addMetadata (sample: IMidiEvent) {
    const { status, note, velocity } = sample;
    const stringId = this.isActiveNote(sample)
      ? status - 0x90
      : status - 0x80;
    const fret = note - this.firstFrets[stringId];
    const playedAt = Date.now();
    return { ...sample, fret, stringId, playedAt };
  }

  isActiveNote ({ status }: Partial<IMidiEvent>) {
    return status >= 0x90 && status < 0xa0;
  }

  isInactiveNote ({ status }: Partial<IMidiEvent>) {
    return status >= 0x80 && status < 0x90;
  }

}
