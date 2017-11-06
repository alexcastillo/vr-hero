import { Component, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'jamstik-instruments',
  templateUrl: './instruments.component.html',
  styleUrls: ['./instruments.component.scss']
})
export class InstrumentsComponent implements OnInit {

  @Output()
  onChange = new EventEmitter();

  instruments = [
      { name: 'Acoustic Guitar - Nylon', id: 'acoustic_guitar_nylon' },
      { name: 'Acoustic Guitar - Steel', id: 'acoustic_guitar_steel' },
      { name: 'Electric Guitar - Overdrive', id: 'overdriven_guitar' },
      { name: 'Electric Guitar - Distortion', id: 'distortion_guitar' },
      { name: 'Electric Guitar - Clean', id: 'electric_guitar_clean' },
      { name: 'Electric Guitar - Jazz', id: 'electric_guitar_jazz' },
      { name: 'Electric Guitar - Muted', id: 'electric_guitar_muted' },
      { name: 'Guitar - Fret Noise', id: 'guitar_fret_noise' },
      { name: 'Guitar - Harmonics', id: 'guitar_harmonics' }
  ];

  constructor() { }

  changeInstrument(instrumentId) {
    this.onChange.emit(instrumentId);
  }

  ngOnInit() {
    this.onChange.emit(this.instruments[0].id);
  }

}
