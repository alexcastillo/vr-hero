import { RealtimeService } from './realtime.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { InstrumentsComponent } from './instruments/instruments.component';

@NgModule({
  declarations: [
    AppComponent,
    InstrumentsComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [RealtimeService],
  bootstrap: [AppComponent]
})
export class AppModule { }
