import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { UsersPage } from './users';
import { TranslateModule } from '@ngx-translate/core';
// import { ImgCacheModule } from 'ng-imgcache';
import { LazyLoadImageModule } from 'ng-lazyload-image';

@NgModule({
	declarations: [ UsersPage ],
	imports: [ IonicPageModule.forChild(UsersPage), TranslateModule.forChild(), LazyLoadImageModule ]
})
export class UsersPageModule {}
