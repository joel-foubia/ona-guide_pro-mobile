import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TaxonomiesListPage } from './taxonomies-list';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    TaxonomiesListPage,
  ],
  imports: [
    IonicPageModule.forChild(TaxonomiesListPage),
    ComponentsModule,
    TranslateModule.forChild()
  ],
})
export class TaxonomiesListPageModule {}
