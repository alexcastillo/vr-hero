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
  game = {
    template: track01,
    startTime: null,
    backingTrack: this.backingTrack,
    input$: this.jamstik.midi,
    timeAccuracy: 100, // In milliseconds, the less the more accurate
    timeBeforeNoteIsExpected: 3500 // In milliseconds, duration of notes from when they are added until they disappear
  };
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
        const id = this.recording.data.length;
        if (this.isActiveNote(sample)) {
          this.recording.data.push({ ...sample, id });
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

  playGame (game) {
    game.startTime = Date.now();
    this.pushExpectedGameNotesToFirebase(game);
    game.backingTrack.play();
    game.template.data = game.template.data
      .map(note => this.setGameRelativeTime(note, game));
    game.input$
      .subscribe(data => this.onGameReceiveInput(data, game));
  }

  pushExpectedGameNotesToFirebase (game) {
    game.template.data
      .forEach(note => {
        const playNoteAt = Math.max((note.playedAt - game.startTime) - game.timeBeforeNoteIsExpected, 0);
        const timeout = setTimeout(() => {
          this.databaseSync(note);
          clearTimeout(timeout);
        }, playNoteAt);
      });
  }

  setGameRelativeTime (note, game) {
      // Set relative start and end time for easier time match comparison
      note.relativeStartTime = (note.playedAt - game.template.startTime) - game.timeAccuracy;
      note.relativeEndTime = (note.playedAt - game.template.startTime) + game.timeAccuracy;
      return note;
  }

  onGameReceiveInput (data, game) {
    const sample = this.addMetadata(data);
    const matchingNote = this.getMatchingNote(game, sample);

    // Note matches!
    if (matchingNote) {
      matchingNote.match = true;
    }
  }

  getMatchingNote (game, sample) {
    return game.template.data
      .filter(note => !note.match)
      .find(note => this.findMatchingNote(note, sample, game));
  }

  findMatchingNote (note, input, game) {
    const relativeInputPlayedAt =  input.playedAt - game.startTime;
    return note.note === input.note
      && note.stringId === input.stringId
      && note.fret === input.fret
      && note.relativeStartTime <= relativeInputPlayedAt
      && note.relativeEndTime >= relativeInputPlayedAt;
  }

}
