import { JamstikService } from './jamstik.service';
import { RealtimeService } from './realtime.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { InstrumentsComponent } from './instruments/instruments.component';
import { FretboardComponent } from './fretboard/fretboard.component';
import { NavigationComponent } from './navigation/navigation.component';
import { RecordingComponent } from './recording/recording.component';
import { GameComponent } from './game/game.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'fretboard' },
  { path: 'fretboard', component: FretboardComponent },
  { path: 'recording', component: RecordingComponent },
  { path: 'game', component: GameComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    InstrumentsComponent,
    FretboardComponent,
    NavigationComponent,
    RecordingComponent,
    GameComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    JamstikService,
    RealtimeService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
