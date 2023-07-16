import { ToastController, AlertController } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireOfflineDatabase } from 'angularfire2-offline/database';
// import { LoginProvider } from '../login/login';
import { HttpClient } from '@angular/common/http';

import { Injectable, NgZone } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { google } from '@google/maps';
import { MapsAPILoader } from '@agm/core';

declare var google: any;

@Injectable()
export class AfProvider {
	_AutocompleteService: google.maps.places.AutocompleteService;
	_Geocoder: google.maps.Geocoder;

	// private items: any;
	// private userInfos: any;

	constructor(
		private afDB: AngularFireDatabase,
		public toastCtrl: ToastController,
		// private lgServ: LoginProvider,
		private offServ: AngularFireOfflineDatabase,
		public zone: NgZone,
		public mapsAPILoader: MapsAPILoader,
		public http: HttpClient,
		public alertCtrl: AlertController
	) {
		this.mapsAPILoader.load().then(() => {
			this._AutocompleteService = new google.maps.places.AutocompleteService();
			this._Geocoder = new google.maps.Geocoder();
		});
		//console.log('Hello AfProvider Provider');
	}

	/**
   * Cette fonction va vérifier que
   * cette utilisateur est bien enregistré
   * dans la BD
   *
   * @return callback
   *
   **/
	retrieveURL(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'url') {
					callback({ url: current.$value });
					break;
				}
			}
		});
	}
	retrievePerPage(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'per_page') {
					callback({ per_page: current.$value });
					break;
				}
			}
		});
	}

	retrieveLocalURL(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'localUrl') {
					callback({ url: current.$value });
					break;
				}
			}
		});
	}
	getWwApi(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'url_api_world_voice') {
					callback({ url: current.$value });
					break;
				}
			}
		});
	}
	getAdminEmail(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'email') {
					callback({ email: current.$value });
					break;
				}
			}
		});
	}
	
	getMomoNumber(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'mtnmomo') {
					callback({ number: current.$value });
					break;
				}
			}
		});
	}
	getEurVal(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'eur_val') {
					callback({ eur_val: current.$value });
					break;
				}
			}
		});
	}
	getPlaystorelink(callback) {
		return this.offServ.list('/about').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'playstore') {
					callback({ link: current.$value });
					break;
				}
			}
		});
	}
	
	getMonetBilKey(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'monetbil_service_key') {
					callback({ key: current.$value });
					break;
				}
			}
		});
	}
	
	
	getEUNumber(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'eumomo') {
					callback({ number: current.$value });
					break;
				}
			}
		});
	}

	getOMNumber(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'orangemoney_account') {
					callback({ number: current.$value });
					break;
				}
			}
		});
	}
	retrieveServerData(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			callback(_data);
		});
	}

	retrieveNumber(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'phoneNumber') {
					callback({ number: current.$value });
					break;
				}
			}
		});
	}

	/**
   * Cette fonction va vérifier que
   * cette utilisateur est bien enregistré
   * dans la BD
   *
   * @return callback
   *
   **/
	retrievepaypalCredits(callback) {
		// console.log('retrieving payPal');

		return this.afDB.list('/config').subscribe((_data) => {
			let result = {};
			// console.log(_data);
			for (var i in _data) {
				let current = _data[i];
				let key = current.$key;
				if (key != 'payconiq') result[key] = current.$value;
				else result[key] = current;
			}

			callback(result);
		});
	}

	retrieveEmail(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'email') {
					callback({ email: current.$value });
					break;
				}
			}
		});
	}

	retrieveCategories(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'url_categories') {
					callback({ url: current.$value });
					break;
				}
			}
		});
	}
	retrieveArticles(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'url_articles') {
					callback({ url: current.$value });
					break;
				}
			}
		});
	}

	/**
   * Function pour recuperer tout les donnees de l'app sur firebase
   */
	retrieveFireBaseData(callback) {
		return this.afDB.list('/').subscribe((_data) => {
			// console.log('Da => ', _data);
			// let result = {};
			let array = [];
			array = _data;

			for (let j = 0; j < _data.length; j++) {
				if (_data[j].$key == 'functions') {
					// console.log(_data[j].$value);
					array[j] = _data[j].$value;
				}
			}

			callback(array);
		});
	}

	/***
   * Cette fonction permet d'afficher
   * les informations A Propos de l'entreprise
   *
   **/
	getInfosAbout(callback) {
		return this.offServ.list('/about').subscribe((_data) => {
			let result = {};

			for (var i in _data) {
				let current = _data[i];
				let key = current.$key;

				if (key == 'map') {
					result['map'] = current;
				} else {
					result[key] = current.$value;
				}
			}
			callback(result);
		});
	}

	/**
   * Cette fonction permet de récupérer
   * le message de Bienvenue
   *
   **/
	getWelcomeMessage(callback) {
		return this.offServ.list('/welcome_message').subscribe((_data) => {
			callback(_data);
		});
	}

	/***
   * Cette fonction permet de récupérer
   * l'objet Image in background
   *
   **/
	getImgSplashScreen(callback) {
		return this.offServ.list('/start').subscribe((_data) => {
			callback(_data[0]);
		});
	}

	/***
   * Cette fonction permet de récupérer
   * les fonctionnalités principales de l'app mobile
   *
   **/
	getListFonctions(callback) {
		return this.offServ.list('/fonctions').subscribe((_data) => {
			//this.lgServ.setTable('fonctions_ona', _data);
			callback(_data);
		});
	}
	getTaxonomyPubs(callback) {
		return this.offServ.list('/pub_sliders/taxonomies/list').subscribe((_data) => {
			//this.lgServ.setTable('fonctions_ona', _data);
			callback(_data);
		});
	}
	getCatPubs(callback) {
		return this.offServ.list('/pub_sliders/categories/list').subscribe((_data) => {
			//this.lgServ.setTable('fonctions_ona', _data);
			callback(_data);
		});
	}
	getCompanyPubs(callback) {
		return this.offServ.list('/pub_sliders/espace_pro/list').subscribe((_data) => {
			//this.lgServ.setTable('fonctions_ona', _data);
			callback(_data);
		});
	}

	getPubs(callback) {
		return this.offServ.list('/pub_sliders').subscribe((_data) => {
			//this.lgServ.setTable('fonctions_ona', _data);
			callback(_data);
		});
	}

	/**
	 * Cette méthode permet de retourner 
	 * le pattern de la catégorie
	 * @param callback 
	 */
	retrievePost(callback) {
		return this.offServ.list('/server').subscribe((_data) => {
			for (var i in _data) {
				let current = _data[i];

				if (current.$key == 'postCategories') {
					callback({ post: current.$value });
					break;
				}
			}
		});
	}

	/***
   * Cette fonction permet de récupérer
   * la liste des catégories populaires
   *
   **/
	popularCat(callback) {
		return this.offServ.list('/popularCategories').subscribe((_data) => {
			var id = [];
			for (const i in _data) {
				if (_data.hasOwnProperty(i)) {
					var current = _data[i].$value;
					id.push(current);
				}
			}

			// console.log(id);
			callback(id);
		});
	}

	/**
   * Cette fonction permet de récupérer
   * la liste des Questions et Réponses
   *
   **/
	getFAQ() {
		return this.offServ.list('/Faq');
	}

	//Cette fonction permet d'obtenir le menu principal (les catégories populaire)
	getMainMenu() {
		return this.offServ.list('/mainmenu');
	}

	//Cette fonction permet d'obtenir le menu principal (les catégories populaire)
	getSlidersMenu() {
		return this.offServ.list('/sliders');
	}

	/***
   * Cette fonction permet de récupérer
   * les configurations Woocommerce de Vitrine Africaine
   *
   **/
	getConfigWC(callback) {
		return this.offServ.list('/woocommerce').subscribe((_data) => {
			let result = {};

			for (var i in _data) {
				let current = _data[i];
				let key = current.$key;

				result[key] = current.$value;
			}
			// console.log(result);
			callback(result);
		});
	}

	//Cette fonction permet d'afficher un message
	// en cas d'erreur ou de success
	showMessage(msg) {
		let toast = this.toastCtrl.create({
			message: msg,
			duration: 3000,
			cssClass: 'toastErr',
			position: 'top'
		});

		toast.present();
	}

	showMessageWithBtn(msg) {
		let toast = this.toastCtrl.create({
			message: msg,
			showCloseButton: true,
			cssClass: 'toastErr',
			closeButtonText: 'OK',
			position: 'top'
		});

		toast.present();
	}

	getPlacePredictions(query: string): Observable<Array<google.maps.places.AutocompletePrediction>> {
		return Observable.create((observer) => {
			this._AutocompleteService.getPlacePredictions({ input: query }, (places_predictions, status) => {
				if (status != google.maps.places.PlacesServiceStatus.OK) {
					this.zone.run(() => {
						observer.next([]);
						observer.complete();
					});
				} else {
					this.zone.run(() => {
						observer.next(places_predictions);
						observer.complete();
					});
				}
			});
		});
	}

	geocodePlace(placeId: string): Observable<google.maps.LatLng> {
		return Observable.create((observer) => {
			this._Geocoder.geocode({ placeId: placeId }, (results, status) => {
				if (status.toString() === 'OK') {
					if (results[0]) {
						this.zone.run(() => {
							observer.next(results[0].geometry.location);
							observer.complete();
						});
					} else {
						this.zone.run(() => {
							observer.error(new Error('no results'));
						});
					}
				} else {
					this.zone.run(() => {
						observer.error(new Error('error'));
					});
				}
			});
		});
	}

	secteurActivite(callback) {
		return this.offServ.list('/secteurActivite').subscribe((_data) => {
			var id = [];
			for (const i in _data) {
				if (_data.hasOwnProperty(i)) {
					var current = _data[i].$value;
					id.push(current);
				}
			}

			// console.log(id);
			callback(id);
		});
	}

	/**
	 * Cette méthode permet de récupérer la liste
	 * des bannières
	 * 
	 * @param callback Callback
	 */
	banner(callback) {
		return this.offServ.list('/bannieres').subscribe((_data) => {
			var id = [];
			for (const i in _data) {
				if (_data.hasOwnProperty(i)) {
					var current = _data[i].$value;
					id.push(current);
				}
			}

			// console.log(id);
			callback(id);
		});
	}

	/**
	 * Cette méthode permet de récupérer les formats
	 * des publicités
	 * @param callback 
	 */
	tailleAnnonce(callback) {
		return this.offServ.list('/tailleAnnonce').subscribe((_data) => {
			var id = [];
			for (const i in _data) {
				if (_data.hasOwnProperty(i)) {
					var current = _data[i].$value;
					id.push(current);
				}
			}

			// console.log(id);
			callback(id);
		});
	}

	showPhonePrompt(type, txtLang?: any) {
		return new Promise((resolve, reject) => {
			const prompt = this.alertCtrl.create({
				title: txtLang[type],
				message: txtLang.enter_phone,
				inputs: [
					{
						name: 'phone',
						placeholder: txtLang.phone_placeholder,
						type: 'number'
					}
				],
				buttons: [
					{
						text: txtLang.annuler,
						handler: (data) => {
							reject({ code: 0, message: txtLang.error_phone });
						}
					},
					{
						text: txtLang.validate,
						handler: (data) => {
							resolve({ code: 1, phone: data.phone });
						}
					}
				]
			});
			prompt.present();
		});
	}


	/**
	 * Cette méthode permet de récupérer la
	 * table nos Services
	 * @param callback 
	 */
	nos_services(callback) {
		return this.offServ.list('/nos_service').subscribe((_data) => {
			var id = [];
			for (const i in _data) {
				if (_data.hasOwnProperty(i)) {
					var current = _data[i].$value;
					id.push(current);
				}
			}

			// console.log(id);
			callback(id);
		});
	}

	readFaq() {
		return this.offServ.list('/faq');
	}
	readFirebase(){
		return new Promise((resolve, reject) => {
			this.afDB.list('/server').subscribe((_data) => {
				// formatage des donnees en {key : value}
				let result = {};
				for (var i in _data) {
					let current = _data[i];
					let key = current.$key;
					result[key] = current.$value;
				}
				resolve(result);
			},(err)=>{
				reject(err);
			});
		});
	}
	getAccessToken(type, request) {
		return new Promise((resolve, reject) => {
			this.readFirebase().then((_val : any) => {
				this.http.get(_val.paypal_url + '/' + type + '?request=' + request).subscribe((data : any)=>{
					resolve(data);
				});
			},(err)=>{
				reject(err);
			});
		});
	}

	getDataPaypal(type, request, nonce, amount, currency, description, payerId){
		// alert('Parametre requete => '+ type + '__' +request+ '__' +nonce+ '__' +amount+ '__' +currency + '__' +description )
		return new Promise((resolve, reject)=>{
			this.readFirebase().then((_data : any)=>{
				// alert('')
				var objectUrl = _data.paypal_url + '/' + type + '?request=' + request + '&' +
							'payment_method_nonce=' + nonce + '&' +
							'amount=' + amount + '&' + 
							'currency=' + currency + '&'+
							'orderId='+ payerId + '&' +
							'description=' + description;
					alert('getDataPaypal => '+JSON.stringify(objectUrl));		
				this.http.get(objectUrl).subscribe((content : any)=>{

					resolve(content);
				},(err)=>{
					reject(err);
				});
			});
		}).catch((err)=>{
			// alert('Error getDataPayPal => '+JSON.stringify(err));
		});
	}
}
