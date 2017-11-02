import { RealtimeService } from './realtime.service';
import { Component } from '@angular/core';
import Jamstik from 'jamstik';
import Soundfont from 'soundfont-player';

import track01 from '../assets/tracks/track-01';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  audioContext = new AudioContext();
  backingTrack = new Audio('./assets/backing-tracks/track-01.mp3');
  jamstik = new Jamstik();
  instrument = null;
  playing: {[key: number]: any} = {};
  recording = {
    startTime: null,
    data: []
  };
  demoRecording = track01;
  // Standard tunning
  firstFrets = [64, 59, 55, 50, 45, 40];

  constructor(private realtime: RealtimeService) {}

  async scan() {
    await this.jamstik.connect();
    this.onConnect();
  }

  onConnect () {
    this.jamstik.midi
      .subscribe(sample => {
        this.onMidi(this.addMetadata(sample));
      });
  }

  addMetadata (sample) {
    const { status, note, velocity } = sample;
    const stringId = status - 0x90;
    const fret = note - this.firstFrets[stringId];
    const playedAt = Date.now();
    return { ...sample, fret, stringId, playedAt };
  }

  databaseSync (sample) {
    this.realtime.addEvent(sample);
  }

  isActiveNote ({ status }) {
    return status >= 0x90 && status < 0xa0;
  }

  isInactiveNote ({ status }) {
    return status >= 0x80 && status < 0x90;
  }

  onMidi (sample) {
    const { status } = sample;
    if (this.isInactiveNote(sample)) {
      this.stopNote(sample);
    }
    if (this.isActiveNote(sample)) {
      this.playNote(sample);
      this.databaseSync(sample);
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

  startRecording () {
    this.recording.data.length = 0;
    this.recording.startTime = Date.now();
    this.backingTrack.play();

    this.jamstik.midi
      .subscribe(data => {
        const sample = this.addMetadata(data);
        if (this.isActiveNote(sample)) {
          this.recording.data.push(sample);
        }
      });
  }

  stopRecording () {
    this.backingTrack.pause();
    console.log('recording', JSON.stringify(this.recording, null, 2));
  }

  playRecording (recording) {
    this.backingTrack.play();
    recording.data
      .forEach(sample => {
        const playNoteAt =  sample.playedAt - recording.startTime;
        const timeout = setTimeout(() => {
          this.playNote(sample);
          clearTimeout(timeout);
        }, playNoteAt);
      });
  }

}
