import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StartEventPage } from './start-event';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    StartEventPage,
  ],
  imports: [
    IonicPageModule.forChild(StartEventPage), TranslateModule.forChild()
  ],
})
export class StartEventPageModule {}
