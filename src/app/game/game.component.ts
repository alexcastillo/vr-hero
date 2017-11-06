import { Component } from '@angular/core';
import { IMidiEvent } from 'jamstik';

import { JamstikService } from '../jamstik.service';
import { RealtimeService } from '../realtime.service';

import track01 from '../../assets/tracks/track-01';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent {

  constructor(private realtime: RealtimeService, private jamstikService: JamstikService) { }

  backingTrack = new Audio('./assets/backing-tracks/track-01.mp3');
  
  game = {
    template: track01,
    startTime: null,
    backingTrack: this.backingTrack,
    input$: this.jamstikService.jamstik.midi,
    mismatchVelocity: 15,
    playbackRate: 0.7, // How slow the music runs
    timeAccuracy: 250, // In milliseconds, the less the more accurate
    timeBeforeNoteIsExpected: 2500, // In milliseconds, duration of notes from when they are added until they disappear
    score: 0
  };

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
    const sample = this.jamstikService.addMetadata(data);
    const matchingNote = this.getMatchingNote(game, sample);

    // Note matches!
    if (matchingNote) {
      this.jamstikService.onMidi(sample);
      matchingNote.match = true;
      this.realtime.addEvent(matchingNote);
      game.score++;
    } else {
      // Notes that don't match should have a lower volume
      this.jamstikService.onMidi({
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
