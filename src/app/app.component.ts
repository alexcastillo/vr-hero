import { Component } from '@angular/core';
import Soundfont from 'soundfont-player';

const MIDI_SERVICE_ID = '03b80e5a-ede8-4b33-a751-6ce34ec4c700';
const MIDI_CHARACTERISTIC = '7772e5db-3868-4112-a1a9-f2669d106bf3';
const MIDI_GUITAR_INSTRUMENTS = [
  'acoustic_guitar_nylon',
  'acoustic_guitar_steel',
  'distortion_guitar',
  'electric_guitar_clean',
  'electric_guitar_jazz',
  'electric_guitar_muted',
  'guitar_fret_noise',
  'guitar_harmonics',
  'overdriven_guitar'
];
const MIDI_INSTRUMENT = MIDI_GUITAR_INSTRUMENTS[0];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  audioContext = new AudioContext();
  instrument = Soundfont.instrument(this.audioContext, MIDI_INSTRUMENT);
  playing: {[key: number]: any} = {};

  async playNote (note: number, velocity: number) {
    if (!velocity) {
      return this.stopNote(note);
    }
    const guitar = await this.instrument;
    this.playing[note] = guitar.play(note);
  }

  stopNote(note: number) {
    if (this.playing[note]) {
      this.playing[note].stop();
      this.playing[note] = null;
    }
  }

  async scan() {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [MIDI_SERVICE_ID] }]
    });
    const gatt = await device.gatt.connect();
    const service = await gatt.getPrimaryService(MIDI_SERVICE_ID);
    const characteristic = await service.getCharacteristic(MIDI_CHARACTERISTIC);

    characteristic.addEventListener('characteristicvaluechanged', () => {
      const buffer = new Uint8Array(characteristic.value.buffer);
      const [ header, timestamp, status, d1, d2 ] = Array.from(buffer);
      console.log('new data', buffer);
      if (status >= 0x80 && status < 0x90) {
        this.stopNote(d1);
      }
      if (status >= 0x90 && status < 0xa0) {
        this.playNote(d1, d2);
      }
    });

    characteristic.startNotifications();
    console.log('ready!');
  }
}
