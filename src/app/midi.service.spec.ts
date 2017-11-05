import { TestBed, inject } from '@angular/core/testing';

import { MidiService } from './midi.service';

describe('MidiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MidiService]
    });
  });

  it('should be created', inject([MidiService], (service: MidiService) => {
    expect(service).toBeTruthy();
  }));
});
