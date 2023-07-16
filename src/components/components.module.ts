import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AnnonceComponent } from './annonce/annonce';
import { IonicPageModule, IonicModule } from 'ionic-angular';
import { CacheImgModule } from '../global';
import { TranslateModule } from '@ngx-translate/core';
import { Ionic2RatingModule } from 'ionic2-rating';
import { RdvComponent } from './rdv/rdv';
import { MapannonceComponent } from './mapannonce/mapannonce';
import { EventTemplateComponent } from './event-template/event-template';
import { FeatTemplateComponent } from './feat-template/feat-template';
import { FeatEventComponent } from './feat-event/feat-event';
import { WizardComponent } from './wizard/wizard';
import { OnaSliderComponent } from './ona-slider/ona-slider';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { PubComponent } from './pub/pub';

@NgModule({
	declarations: [ AnnonceComponent,
    RdvComponent,
    MapannonceComponent,
    EventTemplateComponent,
    FeatTemplateComponent,
    FeatEventComponent,
    WizardComponent,
    OnaSliderComponent,
    PubComponent,
     ],
	imports: [ IonicModule, CacheImgModule, TranslateModule.forChild(), NgCircleProgressModule, Ionic2RatingModule ],
	exports: [ AnnonceComponent,
    RdvComponent,
    MapannonceComponent,
    EventTemplateComponent,
    FeatTemplateComponent,
    FeatEventComponent,
    WizardComponent,
    OnaSliderComponent,
    PubComponent,
     ],
	schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class ComponentsModule {}
