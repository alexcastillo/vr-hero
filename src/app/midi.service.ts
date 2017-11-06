import { Injectable } from '@angular/core';
import { IMidiEvent } from 'jamstik';

@Injectable()
export class MidiService {

  constructor() { }

  // Standard tunning
  firstFrets = [64, 59, 55, 50, 45, 40];

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
