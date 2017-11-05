import { Component } from '@angular/core';
import Jamstik, { IMidiEvent } from 'jamstik';
import Soundfont from 'soundfont-player';

import { MidiService } from './midi.service';
import { RealtimeService } from './realtime.service';

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
  connected$ = this.jamstik.connectionStatus;
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
    mismatchVelocity: 15,
    playbackRate: 0.7, // How slow the music runs
    timeAccuracy: 250, // In milliseconds, the less the more accurate
    timeBeforeNoteIsExpected: 2500, // In milliseconds, duration of notes from when they are added until they disappear
    score: 0
  };

  constructor(private realtime: RealtimeService, private midi: MidiService) {}

  async scan() {
    await this.jamstik.connect();
  }

  playNotes () {
    this.jamstik.midi
      .subscribe(sample => {
        this.onMidi(this.midi.addMetadata(sample));
      });
  }

  disconnect() {
    this.jamstik.disconnect();
  }

  get deviceName() {
    return this.jamstik.deviceName;
  }

  onMidi (sample: IMidiEvent) {
    const { status } = sample;
    if (this.midi.isInactiveNote(sample)) {
      this.stopNote(sample);
    }
    if (this.midi.isActiveNote(sample)) {
      this.playNote(sample);
      console.log(sample);
    }
  }

  async playNote (sample: IMidiEvent) {
    const { note, velocity } = sample;
    if (!velocity) {
      return this.stopNote(sample);
    }
    const guitar = await this.instrument;
    this.playing[note] = guitar.play(note, null, {gain: velocity / 127.0});
  }

  stopNote(sample: IMidiEvent) {
    const { note } = sample;
    if (this.playing[note]) {
      this.playing[note].stop();
      this.playing[note] = null;
    }
  }

  changeInstrument (instrumentId: string) {
    this.instrument = Soundfont.instrument(this.audioContext, instrumentId);
  }

  startRecording () {
    this.recording.data.length = 0;
    this.recording.startTime = Date.now();
    this.backingTrack.play();

    this.jamstik.midi
      .subscribe(data => {
        const sample = this.midi.addMetadata(data);
        const id = this.recording.data.length;
        if (this.midi.isActiveNote(sample)) {
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
    game.score = 0;
    this.pushExpectedGameNotesToFirebase(game);
    game.backingTrack.playbackRate = game.playbackRate;
    game.backingTrack.play();
    game.template.data = game.template.data
      .map(note => this.setGameRelativeTime(note, game));
    game.input$
      .subscribe(data => this.onGameReceiveInput(data, game));
  }

  pushExpectedGameNotesToFirebase (game) {
    game.template.data
      .forEach(note => {
        const playNoteAt = Math.max((note.playedAt - game.template.startTime) - game.timeBeforeNoteIsExpected, 0) / game.playbackRate;
        const timeout = setTimeout(() => {
          this.realtime.addEvent(note);
          console.log('NOTE');
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

  onGameReceiveInput (data: IMidiEvent, game) {
    const sample = this.midi.addMetadata(data);
    const matchingNote = this.getMatchingNote(game, sample);

    // Note matches!
    if (matchingNote) {
      this.onMidi(sample);
      matchingNote.match = true;
      this.realtime.addEvent(matchingNote);
      game.score++;
    } else {
      // Notes that don't match should have a lower volume
      this.onMidi({
        ...data,
        velocity: game.mismatchVelocity
      });
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

  getGameSuccessRate (game) {
    return Math.ceil((game.score * 100) / game.template.data.length);
  }

}
