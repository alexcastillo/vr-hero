import { Component } from '@angular/core';

import { JamstikService } from '../jamstik.service';

import track01 from '../../assets/tracks/track-01';

@Component({
  selector: 'app-recording',
  templateUrl: './recording.component.html',
  styleUrls: ['./recording.component.scss']
})
export class RecordingComponent {

  constructor(private jamstikService: JamstikService) { }

  recording = {
    startTime: null,
    data: []
  };

  demoRecording = track01;

  backingTrack = new Audio('./assets/backing-tracks/track-01.mp3');

  startRecording () {
    this.recording.data.length = 0;
    this.recording.startTime = Date.now();
    this.backingTrack.play();

    this.jamstikService.jamstik.midi
      .subscribe(data => {
        const sample = this.jamstikService.addMetadata(data);
        const id = this.recording.data.length;
        if (this.jamstikService.isActiveNote(sample)) {
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
          this.jamstikService.playNote(sample);
          clearTimeout(timeout);
        }, playNoteAt);
      });
  }

}
