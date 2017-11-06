import { TestBed, inject } from '@angular/core/testing';

import { JamstikService } from './jamstik.service';

describe('JamstikService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JamstikService]
    });
  });

  it('should be created', inject([JamstikService], (service: JamstikService) => {
    expect(service).toBeTruthy();
  }));
});
