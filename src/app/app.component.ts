import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import Soundfont from 'soundfont-player';

interface Sample {
  header: number,
  timestamp: number,
  status: number,
  note: number,
  velocity: number
};

const MIDI_SERVICE_ID = '03b80e5a-ede8-4b33-a751-6ce34ec4c700';
const MIDI_CHARACTERISTIC = '7772e5db-3868-4112-a1a9-f2669d106bf3';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  audioContext = new AudioContext();
  instrument = null;
  characteristic = null;
  notes$ = null;
  playing: {[key: number]: any} = {};
  noteFilters = [
    // Only notes between 30 and 79 are musical notes, the rest are artifacts and 
    // controller commands. Notes in the 80 range are created from pressing the 
    // controller buttons. Notes in the 100 range are an artifact created by pressing 
    // the fretboard without strumming the string.
    ({ note }) => note >= 30 && 79 >= note
  ];

  async observeNotes () {
    this.notes$ = Observable
      .fromEvent(this.characteristic, 'characteristicvaluechanged')
      .mergeMap(this.bufferToSamples)
      .filter(sample => this.filterMusicalNotes(sample))
      .do(sample => this.onMidi(sample))
      .subscribe(console.log);
  }

  bufferToSamples (event) {
    let samples = [];
    const buffer = new Uint8Array(event.target.value.buffer);
    const [ header, ...midi ] = Array.from(buffer);
    while (midi.length) {
      const [ timestamp, status, note, velocity ] = midi.splice(0, 4);
      samples.push({ header, timestamp, status, note, velocity }); 
    }
    return samples;
  }

  filterMusicalNotes (sample: Sample) {
    return this.noteFilters
      .every(filter => filter(sample))
  }

  onMidi (sample: Sample) {
    const { status, note, velocity } = sample;
    if (status >= 0x80 && status < 0x90) {
      this.stopNote(sample);
    }
    if (status >= 0x90 && status < 0xa0) {
      this.playNote(sample);
    }
  }

  async playNote (sample: Sample) {
    const { note, velocity } = sample;
    if (!velocity) {
      return this.stopNote(sample);
    }
    const guitar = await this.instrument;
    this.playing[note] = guitar.play(note, null, {gain: velocity / 127.0});
  }

  stopNote(sample: Sample) {
    const { note } = sample;
    if (this.playing[note]) {
      this.playing[note].stop();
      this.playing[note] = null;
    }
  }

  changeInstrument (instrumentId) {
    this.instrument = Soundfont.instrument(this.audioContext, instrumentId);
  }

  async scan() {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [MIDI_SERVICE_ID] }]
    });
    const gatt = await device.gatt.connect();
    const service = await gatt.getPrimaryService(MIDI_SERVICE_ID);
    this.characteristic = await service.getCharacteristic(MIDI_CHARACTERISTIC);
    this.characteristic.startNotifications();
    this.observeNotes();
  }
}
