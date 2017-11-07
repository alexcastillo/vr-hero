import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { title } from 'change-case';

import * as instrumentList from '../../assets/instruments.json';

@Component({
  selector: 'jamstik-instruments',
  templateUrl: './instruments.component.html',
  styleUrls: ['./instruments.component.scss']
})
export class InstrumentsComponent implements OnInit {

  @Output()
  onChange = new EventEmitter();

  instruments = (<any>instrumentList)
    .map(id => ({ id, name: title(id) }));

  constructor() { }

  changeInstrument(instrumentId) {
    this.onChange.emit(instrumentId);
  }

  ngOnInit() {
    this.onChange.emit(this.instruments[0].id);
  }

}
