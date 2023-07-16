import { Component } from '@angular/core';
import { Platform, App, AlertController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { Storage } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Globalization } from '@ionic-native/globalization';

import { ImgCacheService } from '../global';
import { Events } from 'ionic-angular/util/events';
import { LoginProvider } from '../providers/login/login';
import { AfProvider } from '../providers/af/af';
import { Geolocation } from '@ionic-native/geolocation';

import { ApiConfig } from '../config';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { WpPersistenceProvider } from '../providers/wp-persistence/wp-persistence';
// import { FCM } from '@ionic-native/fcm';
import { Push, PushObject, PushOptions } from '@ionic-native/push';
import { PaymentProvider } from '../providers/payment/payment';

@Component({
	templateUrl: 'app.html'
})
export class MyApp {
	counter: number;
	language: string;
	syncedLast = [];
	interval: number;
	fireAbout;
	// rootPage = 'sidemenu';
	rootPage;

	constructor(
		public platform: Platform,
		statusBar: StatusBar,
		splashScreen: SplashScreen,
		public storage: Storage,
		public events: Events,
		public global: Globalization,
		private translate: TranslateService,
		private imgCache: ImgCacheService,
		private lgServ: LoginProvider,
		public geolocation: Geolocation,
		private afServ: AfProvider,
		public evT: Events,
		public locationAccuracy: LocationAccuracy,
		private persistence: WpPersistenceProvider,
		public alertCtrl: AlertController,
		private push: Push,
		public payment: PaymentProvider
	) {
		if (localStorage.getItem('first_gc') != null) {
			// console.log(localStorage.getItem('first_gc'));
			this.rootPage = 'sidemenu';
		} else {
			this.rootPage = 'PresentPage';
		}

		this.platform.ready().then(() => {
			this.storeUserPosition();
			this.storage.get('_ona_distance').then((dist) => {
				if (dist) {
				} else {
					this.storage.set('_ona_distance', 5);
				}
			});

			//On initialise la configuration des images en locales
			this.imgCache.initImgCache().subscribe(
				(v) => {},
				(err) => {
					// console.log('fail init ', err);
				}
			);

			//Handle notifications
			// this.handlePushNotification();
			this.initPushNotification();

			splashScreen.hide();
			statusBar.styleDefault();

			//On check le statut internet
			this.lgServ.checkstatus();

			// Here you can do any higher level native things you might need.
			this.afServ.retrieveFireBaseData((data) => {
				this.lgServ.setTable('_ona_fireData', data);
			});
		});

		this.initTranslate();
	}

	//On initie la traduction
	initTranslate() {
		// Set the default language for translation strings, and the current language.
		this.translate.setDefaultLang('en');
		if (localStorage.getItem('lang_set') == null) {
			this.evT.publish('lang:done', 'en');
		} else {
			this.translate.setDefaultLang(localStorage.getItem('lang_set'));
			this.evT.publish('lang:done', localStorage.getItem('lang_set'));
		}

		this.storage.get('preferedLangauge').then((lang) => {
			if (lang) {
				this.translate.use(lang);
				// this.translate.setDefaultLang(lang);
			} else {
				if (this.translate.getBrowserLang() !== undefined) {
					this.translate.use(this.translate.getBrowserLang());
					// this.translate.setDefaultLang(this.translate.getBrowserLang());
				} else {
					this.translate.use('fr'); // Set your language here
					// this.translate.setDefaultLang('fr');
				}
			}
		});
	}

	/**
	 * Cette fonctio permet de capturer la 
	 * position de l'utilisateur connecté
	 */
	storeUserPosition() {
		this.storage.get('gps_ask_activate').then((gps) => {
			if (gps != undefined) {
				if (gps == true) {
					this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
						() => {
							// alert('Enabling GPS');
							this.storage.set('gps_ask_activate', true);

							const subscription = this.geolocation
								.watchPosition()
								.filter((p) => p.coords !== undefined) //Filter Out Errors
								.subscribe((position) => {
									var coords = {
										latitude: position.coords.latitude,
										longitude: position.coords.longitude
									};
									this.lgServ.setTable('_ona_lastPosition', coords);
								});

							this.geolocation
								.getCurrentPosition({ timeout: 1000 })
								.then((position) => {
									// alert('Actual Position gps enabled=>' + position);
									var coords = {
										latitude: position.coords.latitude,
										longitude: position.coords.longitude
									};
									this.lgServ.setTable('_ona_lastPosition', coords);
								})
								.catch((error) => {
									// alert('Get position error' + error);
								});
						},
						(err) => {
							this.storage.set('gps_ask_activate', false);

							this.persistence.showMsgWithButton(
								'Activez GPS dans vos parametres pour une meilleur expérience',
								'top',
								'toast-info'
							);
						}
					);
				}
			} else {
				this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
					() => {
						// alert('Enabling GPS');
						this.storage.set('gps_ask_activate', true);

						const subscription = this.geolocation
							.watchPosition()
							.filter((p) => p.coords !== undefined) //Filter Out Errors
							.subscribe((position) => {
								var coords = {
									latitude: position.coords.latitude,
									longitude: position.coords.longitude
								};
								this.lgServ.setTable('_ona_lastPosition', coords);
							});

						this.geolocation
							.getCurrentPosition({ timeout: 1000 })
							.then((position) => {
								// alert('Actual Position gps enabled=>' + position);
								var coords = {
									latitude: position.coords.latitude,
									longitude: position.coords.longitude
								};
								this.lgServ.setTable('_ona_lastPosition', coords);
							})
							.catch((error) => {
								// alert('Get position error' + error);
							});
					},
					(err) => {
						this.storage.set('gps_ask_activate', false);

						this.persistence.showMsgWithButton(
							'Activez GPS dans vos parametres pour une meilleur expérience',
							'top',
							'toast-info'
						);
					}
				);
			}
		});
	}

	//Cette méthode est utilisé pour les Push notifications
	initPushNotification() {
		// to check if we have permission
		this.push
			.hasPermission()
			.then((res: any) => {
				if (res.isEnabled) {
					// console.log('We have permission to send push notifications');
				} else {
					// console.log('We do not have permission to send push notifications');
				}
			})
			.catch((err) => {
				// console.log('Push not perm err', err);
			});

		const options = {
			android: {
				sound: 'true',
				vibrate: true
			},
			ios: {
				alert: 'true',
				badge: true,
				sound: 'false'
			},
			browser: {
				pushServiceURL: 'http://push.api.phonegap.com/v1/push'
			}
		};

		const pushServ: PushObject = this.push.init(options);

		pushServ.on('notification').subscribe((notification: any) => {
			// console.log('Received a notification =>', notification);
			// alert(JSON.stringify(notification));
			this.persistence.saveNotification(notification);
		});

		// pushServ.on('registration').subscribe((registration: any) => console.log('Device registered', registration));

		pushServ.on('error').subscribe((error) => {
			// console.log('Error =>', error);
			// alert(JSON.stringify(error));
		});
	}

}
