import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { IonicStorageModule } from '@ionic/storage';

import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { MyApp } from './app.component';
import { TabsPage } from '../pages/tabs/tabs';
import { HttpModule } from '@angular/http';
import { AuthProvider } from '../providers/auth/auth';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireOfflineModule } from 'angularfire2-offline';
import { WpPersistenceProvider } from '../providers/wp-persistence/wp-persistence';
import { Ionic2RatingModule } from 'ionic2-rating';
import { SocialSharing } from '@ionic-native/social-sharing';
import { CallNumber } from '@ionic-native/call-number';
// import { YoutubeVideoPlayer } from '@ionic-native/youtube-video-player';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Geolocation } from '@ionic-native/geolocation';
// import { SMS } from '@ionic-native/sms';
import { LaunchNavigator } from '@ionic-native/launch-navigator';
import { AppRate } from '@ionic-native/app-rate';
import { Keyboard } from '@ionic-native/keyboard';
import { File } from '@ionic-native/file';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { CacheImgModule } from '../global';
import {
	NativeGeocoder,
	NativeGeocoderReverseResult,
	NativeGeocoderForwardResult,
	NativeGeocoderOptions
} from '@ionic-native/native-geocoder';
// import { FCM } from '@ionic-native/fcm';
import { Push } from '@ionic-native/push';
// import { OneSignal } from '@ionic-native/onesignal';

// import { AppVersion } from '@ionic-native/app-version';
// import { ImageCacheDirective } from '../imagecache/imagecache';
// import {
// 	GoogleMaps,
// 	GoogleMap,
// 	GoogleMapsEvent,
// 	GoogleMapOptions,
// 	CameraPosition,
// 	MarkerOptions,
// 	Marker,
// 	Geocoder
// } from '@ionic-native/google-maps';

// import { PreloadImage } from '../components/preload-image/preload-image';
import { ImagePicker } from '@ionic-native/image-picker';
import { Camera } from '@ionic-native/camera';
import { FileTransfer } from '@ionic-native/file-transfer';
import { Network } from '@ionic-native/network';
import { Globalization } from '@ionic-native/globalization';
import { EmailComposer } from '@ionic-native/email-composer';
import { PayPal, PayPalPayment, PayPalConfiguration } from '@ionic-native/paypal';
import { NgCircleProgressModule } from 'ng-circle-progress';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { LoginProvider } from '../providers/login/login';
import { AfProvider } from '../providers/af/af';
// import { SwipeUpDirective } from '../directives/swipe-up/swipe-up';
import { ParallaxHeaderDirective } from '../directives/parallax-header/parallax-header';
import { DirectivesModule } from '../directives/directives.module';
import { ParallaxHeaderDirectiveModule } from '../directives/parallax-header/parallax-header.module';
// import { SwipeUpDirectiveModule } from '../directives/swipe-up/swipe-up.module';

import { ComponentsModule } from '../components/components.module';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { PaymentProvider } from '../providers/payment/payment';

import { AgmCoreModule } from '@agm/core';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
// import { LocalNotifications } from '@ionic-native/local-notifications';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Market } from '@ionic-native/market';
import { SMS } from '@ionic-native/sms';
import { Braintree, ApplePayOptions, PaymentUIOptions } from '@ionic-native/braintree';
import { BrainTreeProvider } from '../providers/brain-tree/brain-tree';

// import { Firebase } from '@ionic-native/firebase';

//Register fr language
registerLocaleData(localeFr);

export const firebaseConfig = {
	apiKey: 'AIzaSyAdsqmHRkv_hoHjbzLXp4y8dLZh3jT35VE',
	authDomain: 'guide-pro-cameroun.firebaseapp.com',
	databaseURL: 'https://guide-pro-cameroun.firebaseio.com',
	projectId: 'guide-pro-cameroun',
	storageBucket: 'guide-pro-cameroun.appspot.com',
	messagingSenderId: '489146933418'
};

export const progressConfig = {
	// set defaults here
	backgroundPadding: 7,
	radius: 17,
	space: -2,
	outerStrokeWidth: 2,
	outerStrokeColor: '#0288d1',
	innerStrokeColor: '#e7e8ea',
	innerStrokeWidth: 2,
	// title: [ 'Donnée', 'Dispo' ],
	titleFontSize: '10',
	subtitleFontSize: '20',
	animateTitle: false,
	animation: false,
	animationDuration: 1000,
	showSubtitle: false,
	showUnits: true,
	clockwise: false
};

@NgModule({
	declarations: [ MyApp, TabsPage ],
	imports: [
		BrowserModule,
		IonicModule.forRoot(MyApp),
		// SwipeUpDirectiveModule,
		ParallaxHeaderDirectiveModule,
		NgCircleProgressModule.forRoot(progressConfig),
		AgmCoreModule.forRoot({
			apiKey: 'AIzaSyB6xaISf7UKYbFgJUfxCH8MRbMaJw-mxvY',
			libraries: [ 'places' ]
		}),
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: setTranslateLoader,
				deps: [ HttpClient ]
			}
		}),
		HttpModule,
		HttpClientModule,
		Ionic2RatingModule,
		CacheImgModule.forRoot(),
		AngularFireModule.initializeApp(firebaseConfig),
		AngularFireDatabaseModule,
		AngularFireOfflineModule,
		IonicStorageModule.forRoot({
			name: '_ona_gc'
		})
	],
	bootstrap: [ IonicApp ],
	entryComponents: [ MyApp, TabsPage ],
	providers: [
		StatusBar,
		SocialSharing,
		CallNumber,
		ImagePicker,
		Camera,
		FileTransfer,
		Network,
		SMS,
		Geolocation,
		// AppUpdate,
		// GoogleMaps,
		// Geocoder,
		Diagnostic,
		LaunchNavigator,
		EmailComposer,
		// SMS,
		HttpClientModule,
		SplashScreen,
		AppRate,
		NativeGeocoder,
		Globalization,
		File,
		SpeechRecognition,
		// YoutubeVideoPlayer,
		Keyboard,
		InAppBrowser,
		// LocalNotifications,
		{ provide: ErrorHandler, useClass: IonicErrorHandler },
		LoginProvider,
		AfProvider,
		AuthProvider,
		LocationAccuracy,
		WpPersistenceProvider,
		PayPal,
		Market,
		BarcodeScanner,
		// Firebase,
		Braintree,
		// FCM,
		Push,
		// OneSignal,
		PaymentProvider,
	BrainTreeProvider,
	
		// NotifsProvider
	]
})
export class AppModule {}

export function setTranslateLoader(http: HttpClient) {
	return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
