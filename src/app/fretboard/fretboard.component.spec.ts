import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FretboardComponent } from './fretboard.component';

describe('FretboardComponent', () => {
  let component: FretboardComponent;
  let fixture: ComponentFixture<FretboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FretboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FretboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
