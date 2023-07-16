import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { WebtvPage } from './webtv';
import { ParallaxHeaderDirectiveModule } from '../../directives/parallax-header/parallax-header.module';
import { TranslateModule } from '@ngx-translate/core';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    WebtvPage,
  ],
  imports: [
    IonicPageModule.forChild(WebtvPage),
    ParallaxHeaderDirectiveModule,
    TranslateModule.forChild(),
    PipesModule
  ],
})
export class WebtvPageModule {}
