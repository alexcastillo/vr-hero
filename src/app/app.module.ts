import { RealtimeService } from './realtime.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { InstrumentsComponent } from './instruments/instruments.component';

@NgModule({
  declarations: [
    AppComponent,
    InstrumentsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [RealtimeService],
  bootstrap: [AppComponent]
})
export class AppModule { }
