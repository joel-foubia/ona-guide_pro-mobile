import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network';
import { Storage } from '@ionic/storage';
import { LaunchNavigator } from '@ionic-native/launch-navigator';
import { SocialSharing } from '@ionic-native/social-sharing';
import * as moment from 'moment';
import { Http } from '@angular/http';
import { LoadingController, Loading, AlertController, ActionSheetController, ModalController } from 'ionic-angular';
import { EmailComposer } from '@ionic-native/email-composer';
import { TranslateService } from '@ngx-translate/core';
import { PopoverController } from 'ionic-angular/components/popover/popover-controller';
import { Events } from 'ionic-angular/util/events';
// import { WpPersistenceProvider } from '../wp-persistence/wp-persistence';

@Injectable()
export class LoginProvider {
	private today;
	loginloader: Loading;
	private flag = '_ona_flag';
	ytApiKey = 'AIzaSyDxT6UrYT6uJ1dFDk-2N_pDoO69GpHBERE';

	constructor(
		public storage: Storage,
		public network: Network,
		public launchNavigator: LaunchNavigator,
		public socialSharing: SocialSharing,
		public alertCtrler: AlertController,
		public http: Http,
		public loadingCtrler: LoadingController,
		public emailComposer: EmailComposer,
		// public persistence: WpPersistenceProvider,
		public actionCtrl: ActionSheetController,
		public modalCtrl: ModalController,
		private translate: TranslateService,
		public popoverCtrl: PopoverController,
		public ev: Events
	) {
		this.today = moment().format('DD.MM.YYYY');
	}

	presentLoading(msge) {
		return (this.loginloader = this.loadingCtrler.create({
			content: msge
		}));
	}

	/**
   * Cette fontion retourne la date courante
   * @returns string
   */
	getCurrentDate() {
		return moment().format('YYYY-MM-DD');
	}

	/**
	 * Cette fonction permet de récupérer
	 * les paramètres de connexion de l'avocat
	 * struct {uid:"", username: "", name: "", password: ""}
	 *
	 * @return Objet <login>
	 **/
	getLogin() {
		return this.storage.get('login');
	}

	/**
	 * Cette fonction permet de stocker
	 * les paramètres de connexion de l'avocat
	 * struct {uid:"", username: "", password: ""}
	 *
	 * @param data Struct, les paramètres de connexion de l'utilisateur
	 **/

	saveLogin(data) {
		let newData = JSON.stringify(data);
		this.storage.set('login', newData);
	}

	/**
	 * Cette fonction permet de sauvegarder les 
	 * paramètres de l'utilisateur une fois que ce
	 * dernier est fournir 
	 * @param JSON data
	 *
	 **/
	saveSettingUser(data) {
		let newData = JSON.stringify(data);
		this.storage.set('setting', newData);
	}

	/**
	 * Cette fonction permet de recupérer les 
	 * paramètres de l'utilisateur 
	 *
	 * @return String
	 **/
	getSettingUser() {
		return this.storage.get('setting');
	}

	/**
	 * Cette fonction permet de sauvegarder
	 * les informations de l'abonné (numéro abonnement et numéro client)
	 *
	 * @return String
	 **/
	saveDataAbonne(abonneNumber, clientNumber) {
		let data = {
			abonne: abonneNumber,
			client: clientNumber
		};

		let newData = JSON.stringify(data);

		this.storage.set('abonne', newData);
	}

	/**
	 * Cette méthode permet d'attribuer un favoris
	 * à une annonce
	 * @author Landry Fongang
	 * @param item any, l'objet
	 * @param model string, le nom de la table
	 */
	likeInternalStorage(item, model) {
		this.isTable('_ona_' + model).then((data) => {
			if (data) {
				var tempArray = [];
				tempArray = JSON.parse(data);
				for (let k = 0; k < tempArray.length; k++) {
					if (item.id == tempArray[k].id) {
						tempArray[k] = item;
						this.setTable('_ona_' + model, tempArray);
					}
				}
			}
		});
	}

	/**
	 * @author Landry Fongang (mr_madcoder_fil)
	 * Method to like an item. save the item in the local storage as like
	 * @param item to like in question
	 * @param Model data model the item belongs to EX. Listng, pointfinderltypes, etc
	 */
	likeItem(item, model) {
		// this.storage.get('_ona_' + model + 'fav');
		this.likeInternalStorage(item, model);
		this.isTable('_ona_' + model + '_fav').then((data) => {
			var array = [];
			if (data) {
				array = JSON.parse(data);
				array.push(item);
				this.setTable('_ona_' + model + '_fav', array);
			} else {
				array.push(item);
				this.setTable('_ona_' + model + '_fav', array);
			}
		});
	}

	/**
	 * @author landry Fongang (mr_madcoder_fil)
	 * @param coords Array of coordinates [{lat,lng}]
	 */
	navigateToArticle(coords: Array<any>) {
		this.launchNavigator.navigate(coords).then(
			(succes) => {},
			(error) => {
				alert(error);
			}
		);
	}

	/**
	 * @author Landry Fongang (mr_madcoder_fil)
	 * Method to unlike an item. remove the item in the local storage as like
	 * @param item to like in question
	 * @param Model data model the item belongs to EX. Listng, pointfinderltypes, etc
	 */
	disLikeItem(item, model) {
		// this.storage.get('_ona_' + model + 'fav');
		this.ev.publish('fav:changed', item);
		this.likeInternalStorage(item, model);
		this.isTable('_ona_' + model + '_fav').then((data) => {
			var tempFavArray = [];
			if (data) {
				tempFavArray = JSON.parse(data);
				for (let i = 0; i < tempFavArray.length; i++) {
					if (tempFavArray[i].id == item.id) {
						tempFavArray.splice(i, 1);
						if (tempFavArray.length == 0) {
							this.storage.remove('_ona_' + model + '_fav');
						} else {
							this.setTableTo('_ona_' + model + '_fav', tempFavArray);
						}
					}
				}
			}
		});
	}

	/**
	 * Cette fonction permet de partarger une note
	 * ou autres document
	 *
	 **/
	doShare(message, subject, fichier, url) {
		this.socialSharing
			.share(message, subject, fichier, url)
			.then(() => {
				// Sharing via email is possible
			})
			.catch(() => {
				/*  if(type=='notes')
			this.showMsgWithButton(this.txtObjet.native.share_note,'bottom','toast-info'); */
			});
	}
	/**
	 * Method pour ouvrir une annonce l'orsqu'on click sur sa pub
	 * @param pub Publicite de l'annonce
	 */

	/* viewPubAnnonce(pub) {
		this.storage.get('_ona_place').then((places) => {
			let placesList = [];
			placesList = JSON.parse(places);
			for (let k = 0; k < placesList.length; k++) {
				if (pub.id_annonce == placesList[k].id) {
					this.nav.push('AnnonceDetailPage', { annonce: placesList[k] });
				}
			}
		});
	} */

	/**
	 * @author Landry Fongang (mr_madcoder_fil)
	 * @param id L'id de la categorie ou du location a utiliser pour faire le tri (set to all to retrieve all announcement)
	 * @param type Le type du tri Ex; location, category
	 */
	loadAnnouncements(id, type, places, subacts?: Array<any>) {
		var categoryIdsArray = [];
		var locationIdsArray = [];
		var tagIdsArray = [];
		var list = [];
		list = places;
		var result = [];
		// console.log('Announcements =>', list);
		for (let i = 0; i < places.length; i++) {
			if (type == 'category') {
				if (places[i].place_category) {
					if (places[i].place_category.length > 0) {
						categoryIdsArray = places[i].place_category;
						if (categoryIdsArray.indexOf(id) > -1) {
							result.push(places[i]);
						}
						if (subacts.length > 0) {
							for (let l = 0; l < subacts.length; l++) {
								if (categoryIdsArray.indexOf(subacts[l].id) > -1) {
									result.push(places[i]);
								}
							}
						}
					}
				}
			} else if (type == 'location') {
				if (places[i].location) {
					if (places[i].location.length > 0) {
						locationIdsArray = places[i].location;
						if (locationIdsArray.indexOf(id) > -1) {
							result.push(places[i]);
						}
					}
				}
			} else if (type == 'tag') {
				if (places[i].place_tag) {
					if (places[i].place_tag)
						if (places[i].place_tag.length > 0) {
							tagIdsArray = places[i].place_tag;
							if (tagIdsArray.indexOf(id) > -1) {
								result.push(places[i]);
							}
						}
				}
			} else {
				result = places;
			}
		}
		return result;
	}

	/**
	 * Functionto retrive all images associated to an announcement
	 * @author Landry Fongang (mr_madcoder_fil)
	 * @param annonceid ID de L'annonce
	 */
	getImages(annonceid) {
		return new Promise((resolve, reject) => {
			this.isTable('_ona_media').then((media) => {
				var medias = [];
				var res_media = [];
				var annonceArray = [];
				annonceArray.push(annonceid);
				medias = JSON.parse(media);
				for (let k = 0; k < medias.length; k++) {
					if (annonceid == medias[k].post) {
						res_media.push(medias[k]);
					}
				}
				resolve(res_media);
			});
		});
	}

	/**
	 * Cette fonction permet de recupérer les 
	 * les informations de l'abonné (numéro abonnement et numéro client)
	 *
	 * @return String
	 **/
	getDataAbonne() {
		return this.storage.get('abonne');
	}

	/**
	 * Cette fonction recupere la valeur de l'objet type
	 * si la table (client, tribunal, ou contact existe)
	 *
	 * @return Objet <type>
	 **/
	isTable(type) {
		return this.storage.get(type);
	}

	/**
	 * Cette fonction définie la valeur true 
	 * lorsque les données sont présents dans la table (client, contact ou tribunal)
	 *
	 * @param type, nom de la table
	 * @param data Struct, 
	 **/

	setTable(type, data) {
		let newData = JSON.stringify(data);
		this.storage.set(type, newData);
	}

	setDataNoStringy(type, data) {
		this.storage.set(type, data);
	}

	remove(cle) {
		this.storage.remove(cle);
	}

	getToday() {
		return this.today;
	}

	/**
	 * Cette fonction permet d'enregistrer la date
	 * de la dernière synchronisation
	 * 
	 */
	setLastUpdate() {
		this.storage.set('_last_synchro', moment().format());
	}

	setSync(type) {
		this.storage.set(type, moment().format('YYYY-MM-DDTHH:mm:ss'));
	}

	/**
	 * cette fonction permet de dire si oui ou non
	 * la synchronisation est terminer
	 * @param value boolean, 
	 */
	fixSynchro(value: boolean) {
		this.storage.set('is_synchro', value);
	}

	/**
   * Function called in the constructor of any view to check internet status and last sync date
   * 
   */
	checkStatus(alias) {
		return new Promise((resolve, reject) => {
			this.storage.get(this.flag).then((flag) => {
				this.storage.get(alias + '_date').then((date) => {
					if (flag === false && !date) {
						resolve('i'); //No data save
						// console.log('Connect To internet to view content');
					} else if (flag === false && date) {
						resolve('s'); //read data from storage
						// console.log('Reading from storage');
					} else if (flag === true && date) {
						resolve('s');
						// console.log('Reading from Storage');
						/* if (date === moment().format('YYYY-MM-DDTHH:mm:ss')) {
							resolve('s');
							console.log('Reading from Storage');
						} else {
							resolve('w');
							console.log('Reading from Server and Synchronize with storage');
						} */
					} else if (flag === true && !date) {
						resolve('rw');
						// console.log('Reading from Server and save data to storage');
					}
				});
			});
		});
	}

	/**
   * Function called in app.component.ts to check availability of internet connection and last 
   * sync date
   */
	checkstatus() {
		if (this.network.type === 'unknown' || this.network.type === 'none' || this.network.type === 'undefined') {
			this.storage.set(this.flag, false);
			localStorage.setItem('is_update', 'false');
		} else {
			localStorage.setItem('is_update', 'true');
			this.storage.get('is_sync').then((reponse) => {
				this.storage.set(this.flag, true);
				if (reponse != null && reponse == false) {
					this.storage.set(this.flag, false);
				}
			});
		}

		//On écoute les évènements disconnect et on connecte
		this.network.onConnect().subscribe(() => {
			setTimeout(() => {
				localStorage.setItem('is_update', 'true');
				this.storage.get('is_sync').then((reponse) => {
					this.storage.set(this.flag, true);
					if (reponse != null && reponse == false) {
						this.storage.set(this.flag, false);
					}
				});
			}, 5000);
		});

		this.network.onDisconnect().subscribe(() => {
			setTimeout(() => {
				this.storage.set(this.flag, false);
				localStorage.setItem('is_update', 'false');
			}, 5000);
		});
	}

	/**
   * Cette fonction permet d'activer la synchro
   * ou de désactiver la synchro
   * @param active boolean, active ou desactive la synchro auto
   */
	desactiveSync(active: boolean) {
		this.storage.set('auto_update', active).then(() => {
			this.ev.publish('sync:changed');
		});
		// this.storage.set(this.flag, active);
	}

	//Cette fonction renvoie la valeur courrante
	//de la synchro
	getCurrentValSync() {
		return this.storage.get('is_sync');
	}

	/**
	 * Function to sync executed after each minute (or 2 minutes)
	 */
	connChange(alias) {
		return new Promise((resolve, reject) => {
			// console.log('Time to Sync ' + alias);
			this.storage.get(this.flag).then((flag) => {
				this.storage.get(alias + '_date').then((date) => {
					//this.presentAlert('','Flag' + flag)
					if (flag === true) {
						//Make Synchronisation
						resolve(true);
					} else if (flag === false || date === moment().format('DD.MM.YYYY')) {
						// console.log('No Sync');
						resolve(false);
					}
				});
			});
		});
	}

	/**
	 * Cette fonction permet de sauvegarder une image depuis firebase
	 * @param cle string, il s'agit de l'url de la photo que l'on souhaite sauvegarder
	 * @param valeur string, image en base 64
	 */
	savePhoto(cle, valeur) {
		this.storage.set(cle, valeur);
	}

	/**
	 * Cette fonction récupère la base64 de l'image
	 * @param cle string, la clé permettant de récupérer la valeur
	 */
	findPhotoByURL(cle) {
		return new Promise((resolve, reject) => {
			this.storage.get(cle).then((res) => {
				if (res) {
					resolve(res);
				} else {
					reject({ err: 1, message: 'Image not found' });
				}
			});
		});
	}

	/**
	 * Cette fonction permet de vérifier que la date
	 * en paramètre est la meme
	 * @param current_date String date
	 * @returns boolean
	 */
	sameDate(current_date, strTime?: string) {
		let texte = '';
		if (strTime === undefined) texte = '';
		else texte = strTime;

		if (moment(moment().format('YYYY-MM-DD'), 'YYYY-MM-DD' + texte).isSame(moment(current_date, 'YYYY-MM-DD'))) {
			// console.log('trouve');
			return true;
		}

		return false;
	}

	/**
 * Get Playlists for a particular channel
 * @author Landry Fongang (mr_madcoder_fil)
 * @param channel The channelId
 */
	getPlaylistsForChannel(channel) {
		return this.http
			.get(
				'https://www.googleapis.com/youtube/v3/playlists?key=' +
					this.ytApiKey +
					'&channelId=' +
					channel +
					'&part=snippet,id&maxResults=20'
			)
			.map((res) => {
				return res.json()['items'];
			});
	}
	/**
 * Get Playlists for a particular channel
 * @author Landry Fongang (mr_madcoder_fil)
 * @param channel The channelId
 */
	getMyPlaylists(playlistId) {
		return this.http
			.get(
				'https://www.googleapis.com/youtube/v3/playlists?key=' +
					this.ytApiKey +
					'&id=' +
					playlistId +
					'&part=snippet&maxResults=50'
			)
			.map((res) => {
				return res.json();
			});
	}

	/**
	 * Message to display http calls error messages
	 * @author Landry Fongang
	 * @param error Error Object
	 */
	showError(error) {
		let confirm = this.alertCtrler.create({
			title: 'Le Guide 237',
			message: error.error.message,
			buttons: [
				{
					text: 'OK',
					handler: () => {}
				}
			]
		});
		return confirm;
	}
	/**
	 * Message to display http calls error messages
	 * @author Landry Fongang
	 * @param error Error Object
	 */
	showErrorAlert(error) {
		let confirm = this.alertCtrler.create({
			title: 'Le Guide 237',
			message: error,
			buttons: [
				{
					text: 'OK',
					handler: () => {}
				}
			]
		});
		return confirm;
	}

	/**
 * Get videos for a particular playlist
 * @author Landry Fongang (mr_madcoder_fil)
 * @param listId The id of the playlist
 */
	getListVideos(listId) {
		return this.http
			.get(
				'https://www.googleapis.com/youtube/v3/playlistItems?key=' +
					this.ytApiKey +
					'&playlistId=' +
					listId +
					'&part=snippet,id&maxResults=50'
			)
			.map((res) => {
				return res.json()['items'];
			});
	}

	/**
	 * Cette fonction permet de vérifier que la date
	 * est correcte
	 * @param current_date String date
	 * @returns boolean
	 */
	valideDate(current_date) {
		var date = moment(current_date);
		date.add(1, 'M');

		if (
			moment(date.year().toString() + '-' + date.month().toString() + '-01', 'YYYY-MM-DD').isValid() &&
			moment(
				date.year().toString() + '-' + date.month().toString() + '-' + date.daysInMonth().toString(),
				'YYYY-MM-DD'
			).isValid()
		)
			return true;

		return false;
	}

	/**
	 * Cette fonction permet de vérifier que la date
	 * actuelle se trouve dans le mois courrant
	 * @param current_date String date
	 * @returns boolean
	 */
	dateBetween(current_date) {
		var theDate = new Date(current_date);
		var nowaday = new Date();

		//On récupère mois et l'année
		var yeartheDate = theDate.getFullYear(),
			moistheDate = theDate.getMonth();

		var yearNowaday = nowaday.getFullYear(),
			moisNowaday = nowaday.getMonth();

		if (yearNowaday == yeartheDate && moistheDate == moisNowaday) return true;

		return false;
	}

	/**
	 * Cette fonction permet de vérifier que la date
	 * actuelle se trouve dans le semaine courrante
	 * @param current_date String date
	 * @returns boolean
	 */
	weekBetween(current_date) {
		var date = moment(current_date);

		var startOfWeek = moment().startOf('isoWeek');
		var endOfWeek = moment().endOf('isoWeek');

		for (let day = startOfWeek; day <= endOfWeek; day = day.clone().add(1, 'd')) {
			if (date.toDate() == day.toDate()) return true;
		}

		return false;
	}

	/**
	 * Cette fontion permet de vérifier que la
	 * date courrante correspond à celle de l'attribut date
	 * de l'objet
	 * @param current_date string
	 */
	theSameDate(current_date) {
		return moment(moment().format('YYYY-MM-DD'), 'YYYY-MM-DD').isSame(moment(current_date, 'YYYY-MM-DD'));
	}

	/**
	 * Cette fonction permet de récupérer la localisation
	 * de l'utilisateur connecté et de récupérer l'adresse correspondant
	 */
	getLocation() {}

	/**
	 * Cette fonction permet de récupérer les 
	 * informations de l'utilisateur connecté 
	 * @author Landry
	 */
	getCurrentPosition() {}

	//Cette fonction permet de supprimer la table (en mode synchrone)
	removeTo(cle) {
		return this.storage.remove(cle);
	}

	setTableTo(type, data) {
		let newData = JSON.stringify(data);
		return this.storage.set(type, newData);
	}

	/**
   * Cette fonction permet de retourner
   * la valeur d'une langue (en fonction de celle du user)
   * @param lang string
   * @returns string
   */
	setLangOfCalendar(lang) {
		if (lang == 'fr') return 'fr-FR';
		else if (lang == 'en') return 'en-US';
		else if (lang == 'de') return 'de-DE';
		else if (lang == 'es') return 'es-ES';
	}

	//Cette méthode permet à un utilisateur d'effectuer
	//une réservation

	// Method to check if user islogged in

	isLoggedIn() {
		return new Promise((resolve) => {
			this.isTable('wpIonicToken').then((user) => {
				if (user) {
					resolve(true);
				} else {
					resolve(false);
				}
			});
		});
	}

	/**
	 * Cette méthode permet de formater les
	 * données d'un événement du formulaire
	 * @param objEvent any
	 * @param user any, utilisateur connecté
	 */
	buildObjetEvent(objEvent, user) {
		// console.log('event to build and display ', objEvent)
		return new Promise((resolve, reject) => {
			this.listOfObjets(objEvent.myEvent.tags, objEvent.myEvent.categories).then((data: any) => {
				let objet = {
					all_day: objEvent.myEvent.all_day,
					author: user.user.ID,
					categories: data.cats,
					cost: objEvent.myEvent.ticket.cost + '&euro;',
					cost_details: {
						currency_symbol: 'FCFA',
						currency_position: 'prefix',
						values: [ objEvent.myEvent.ticket.cost ]
					},
					description: objEvent.myEvent.description,
					end_date: this.formatDate(objEvent.myEvent.end_date),
					featured: false,
					id: objEvent.myEvent.id !== undefined ? objEvent.myEvent.id : 0,
					image: {
						sizes: {
							shop_catalog: {
								url: objEvent.myEvent.image
							}
						}
					},
					organizer: objEvent.myEvent.organizer,
					start_date: this.formatDate(objEvent.myEvent.start_date),
					status: 'publish',
					sticky: false,
					tags: data.tags,
					ticketed: [ 'woo' ],
					title: objEvent.myEvent.title,
					venue: {
						address: objEvent.location.venue,
						author: user.user.ID,
						city: objEvent.location.venue,
						country: objEvent.location.country,
						id: 0,
						phone: objEvent.myEvent.organizer[0].phone,
						venue: objEvent.location.venue,
						website: objEvent.myEvent.website,
						zip: ''
					},

					website: objEvent.website
				};

				resolve(objet);
			});
		});
	}

	/**
	 * Cette méthode permet de construire un tableau d'objets
	 * @param lines Array<any>
	 */
	private listOfObjets(tags, cats) {
		return new Promise((resolve, reject) => {
			// let tabs = [];
			this.isTable('_ona_ev_tags').then((res) => {
				this.isTable('_ona_ev_categories').then((_res) => {
					this.isTable('_ona_organizers').then((data) => {
						let result_tags = [],
							result_cat = [];

						if (res) {
							let tabs_tags = JSON.parse(res);
							for (let index = 0; index < tabs_tags.length; index++) {
								if (tags.indexOf(tabs_tags[index].id) > -1)
									result_tags.push({ id: tabs_tags[index].id, name: tabs_tags[index].name });
							}
						} else if (_res) {
							let tab_cats = JSON.parse(_res);
							for (let index = 0; index < tab_cats.length; index++) {
								if (cats.indexOf(tab_cats[index].id) > -1)
									result_cat.push({ id: tab_cats[index].id, name: tab_cats[index].name });
							}
						}

						resolve({ cats: result_cat, tags: result_tags });
					});
				});
			});
		});
	}

	/**
	 * Cette méthode permet de formater les
	 * données d'un événement du formulaire pour l'envoyer
	 * au serveur
	 * @param objEvent any
	 * @param user any, utilisateur connecté
	 */
	buildEventToServer(objEvent, user): any {
		let objet = {
			id: objEvent.id !== undefined ? objEvent.id : 0,
			all_day: objEvent.all_day,
			author: user.user.data.ID,
			categories: objEvent.categories,
			description: objEvent.description,
			end_date: this.formatDate(objEvent.end_date),
			image: objEvent.image != '' ? objEvent.image : '5688',
			organizer: objEvent.organizer,
			start_date: this.formatDate(objEvent.start_date),
			tags: objEvent.tags,
			title: objEvent.title,
			status: 'pending',
			// status: 'publish',
			venue:
				typeof objEvent.venue === 'number'
					? objEvent.venue
					: {
							address: objEvent.venue.address,
							author: user.user.data.ID,
							city: objEvent.venue.city,
							country: objEvent.venue.country,
							phone: objEvent.venue.phone,
							venue: objEvent.venue.venue,
							website: objEvent.venue.website,
							zip: objEvent.venue.zip
						},

			website: objEvent.website
		};

		return objet;
	}

	/**
	 * Cette méthode permet de formater la date
	 * @param txt_date string, la date à formater
	 */
	private formatDate(txt_date): string {
		let result = '';

		result = txt_date.replace('T', ' ');

		return result;
	}

	unNotifyCat(item, model) {
		// this.storage.get('_ona_' + model + 'fav');
		this.likeInternalStorage(item, model);
		this.isTable('_ona_' + model + '_notif').then((data) => {
			var tempFavArray = [];
			if (data) {
				tempFavArray = JSON.parse(data);
				for (let i = 0; i < tempFavArray.length; i++) {
					if (tempFavArray[i].id == item.id) {
						tempFavArray.splice(i, 1);
						if (tempFavArray.length == 0) {
							this.storage.remove('_ona_' + model + '_notif');
						} else {
							this.setTable('_ona_' + model + '_notif', tempFavArray);
						}
					}
				}
			}
		});
	}

	notifyCat(item, model) {
		// this.storage.get('_ona_' + model + 'fav');
		this.likeInternalStorage(item, model);
		this.isTable('_ona_' + model + '_notif').then((data) => {
			var array = [];
			if (data) {
				array = JSON.parse(data);
				array.push(item);
				this.setTable('_ona_' + model + '_notif', array);
			} else {
				array.push(item);
				this.setTable('_ona_' + model + '_notif', array);
			}
		});
	}

	/**
	 * Method to show empty fields of an annonce
	 * @param annonce Annonce to show empty fields
	 */
	showEmptyFieldsPop(annonce) {
		let emptyPop = this.popoverCtrl.create(
			'descpopover',
			{ params: annonce, slug: 'empty' },
			{ cssClass: 'custom-popEmpty' }
		);
		emptyPop.present();
	}

	/**
	 * Cette méthode permet de créer un 
	 * tableau 
	 */
	buildHours(objet) {
		return new Promise((resolve, reject) => {
			let week = [],
				id = 1;

			this.translate.get('week').subscribe((res) => {
				if (Array.isArray(objet.serve_day)) {
					//Les jours sont définis

					if (objet.serve_day.length == 1) {
						//All day

						let valeur = objet.open_time + ' - ' + objet.close_time;
						week.push({ name: res.all, text: valeur });
					} else {
						//Week days

						id = 1;
						for (const key in res) {
							if (res.hasOwnProperty(key) && key != 'all') {
								let element, valeur;

								if (objet.serve_day[id - 1] == key) {
									element = res[key];
									valeur = objet.open_time + ' - ' + objet.close_time;
									week.push({ name: element, text: valeur });
								}
							}

							if (key != 'all') id++;
						}
					}
				} //End if of array serve_day

				// console.log(week);
				resolve(week);
			});
		});
	}

	/**
	 * THis method is used to check if an offer is
	 * opened or closed
	 * @param objet JSON object (Place_customFields)
	 * @returns boolean
	 */
	isOpen(objet): boolean {
		let trouve = false;
		let currentDate = new Date();
		let hours = currentDate.getHours();
		let minutes = currentDate.getMinutes();
		let theDay = currentDate.getDay();

		//Get Hours and minutes of open time
		let openTime = objet.open_time.toLowerCase().split(':');
		let closeTime = objet.close_time.toLowerCase().split(':');

		if (!Array.isArray(openTime)) {
			if (objet.open_time.toLowerCase().indexOf('h') > -1) {
				openTime = objet.open_time.toLowerCase().split('h');
			}
		} else {
			if (openTime[0].toLowerCase().indexOf('h') > -1) {
				openTime = openTime[0].toLowerCase().split('h');
			}
		}

		if (!Array.isArray(closeTime)) {
			if (objet.close_time.toLowerCase().indexOf('h') > -1) {
				closeTime = objet.close_time.toLowerCase().split('h');
			}
		} else {
			if (closeTime[0].toLowerCase().indexOf('h') > -1) {
				closeTime = closeTime[0].toLowerCase().split('h');
			}
		}

		/* console.log('Open time', openTime)
		console.log('Close time', closeTime) */

		if (Array.isArray(objet.serve_day)) {
			//Les jours sont définis

			if (objet.serve_day.length == 1) {
				//All day
				// console.log(openTime);
				// console.log(closeTime);
				if (openTime[0] <= hours && hours < closeTime[0]) {
					trouve = true;
				} else if (openTime[0] == hours && minutes <= openTime[1]) {
					trouve = true;
				} else if (closeTime[0] == hours && minutes <= closeTime[1]) {
					trouve = true;
				} else if (openTime[0] > closeTime[0] && (openTime[0] <= hours || hours <= closeTime[0])) {
					trouve = true;
				}
			} else {
				//Week days

				for (let i = 0; i < objet.serve_day.length; i++) {
					const element = objet.serve_day[i];
					if (theDay == parseInt(element)) {
						if (openTime[0] <= hours && hours < closeTime[0]) {
							trouve = true;
						} else if (openTime[0] == hours && minutes <= openTime[1]) {
							trouve = true;
						} else if (closeTime[0] == hours && minutes <= closeTime[1]) {
							trouve = true;
						} else if (openTime[0] > closeTime[0] && (openTime[0] <= hours || hours <= closeTime[0])) {
							trouve = true;
						}
					}
				}
			}
		} else {
			//End if of array serve_day
			if (openTime[0] <= hours && hours < closeTime[0]) {
				trouve = true;
			} else if (openTime[0] == hours && minutes <= openTime[1]) {
				trouve = true;
			} else if (closeTime[0] == hours && minutes <= closeTime[1]) {
				trouve = true;
			} else if (openTime[0] > closeTime[0] && (openTime[0] <= hours || hours <= closeTime[0])) {
				trouve = true;
			}
		}

		return trouve;
	}

	/**
	 * This method is used to perform correct username
	 * for WP. by transform special, spaces caracters
	 * 
	 * @author davart
	 * @param username string, username provided by user
	 * @returns string
	 */
	formatUsername(username: string): string {
		let result = '';

		result = username.replace(' ', '');

		return result;
	}
}
