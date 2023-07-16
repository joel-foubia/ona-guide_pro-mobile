// import { UserAgent } from '@ionic-native/user-agent';
import { Http, Response, Headers } from '@angular/http';
import { Storage } from '@ionic/storage';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import swal from 'sweetalert';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
// import geocoder from 'geocoder-geojson';
import { SocialSharing } from '@ionic-native/social-sharing';
import {
	AlertController,
	Platform,
	ToastController,
	LoadingController,
	ModalController,
	ActionSheetController,
	PopoverController,
	Loading
} from 'ionic-angular';
import { FileTransfer } from '@ionic-native/file-transfer';
// import { FilePath } from '@ionic-native/file-path';
import { File } from '@ionic-native/file';
import { Events } from 'ionic-angular/util/events';
import * as moment from 'moment';
import { CallNumber } from '@ionic-native/call-number';
import { EmailComposer } from '@ionic-native/email-composer';
import { InAppBrowser } from '@ionic-native/in-app-browser';
// import { SMS } from '@ionic-native/sms';
import { LoginProvider } from '../login/login';
import { Network } from '@ionic-native/network';
import { AppRate } from '@ionic-native/app-rate';

import { TranslateService } from '@ngx-translate/core';
import { AfProvider } from '../af/af';

import { ConfigModels, ApiConfig, ServicesConfig, ApiPaypal, SyncOptions } from '../../config';
import { Camera } from '@ionic-native/camera';
import { ImagePicker } from '@ionic-native/image-picker';
import { AuthProvider } from '../auth/auth';
import { catchError, map } from 'rxjs/operators';
import { Configuration } from './configuration';
import { CustomHttpUrlEncodingCodec } from './encoder';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Geolocation } from '@ionic-native/geolocation';
import { Diagnostic } from '@ionic-native/diagnostic';
import { isTab } from 'ionic-angular/navigation/nav-util';
import { NavController } from 'ionic-angular/navigation/nav-controller';
import { SMS, SmsOptions } from '@ionic-native/sms';
import { count } from 'rxjs/operator/count';

// import { AngularFireOfflineDatabase } from 'angularfire2-offline/database';

// declare var cordova: any;

@Injectable()
export class WpPersistenceProvider {
	urlServ: any;
	model: string;
	autoSync: number;
	bgSyncTimer: number;
	total: number;
	pagenum: number;
	tempUrl: any;

	lastImage: any;
	alloffers: any[];
	serverUrl;
	data: any;
	offers = [];
	txtObjet: any;
	err_network: any;
	presentHour: moment.Moment;
	presentDayNumber: number;
	modelUsers = 'users';
	maxLimit = 100;
	syncPackInt: number;
	syncReviews: number;
	presentDate: moment.Moment;
	data_server: any;
	loginloader: Loading;
	currentUser: any;
	// max_items: any;

	constructor(
		public http: HttpClient,
		public storage: Storage,
		public hp: Http,
		public alertCtrler: AlertController,
		// public ua: UserAgent,
		public share: SocialSharing,
		public filetransfer: FileTransfer,
		public platform: Platform,
		// public filePath: FilePath,
		// public connstatprov: ConnectionStatusProvider,
		public events: Events,
		public alertCtrl: AlertController,
		public toastCtrl: ToastController,
		private callNumber: CallNumber,
		private emailComposer: EmailComposer,
		private browser: InAppBrowser,
		public loading: LoadingController,
		public popover: PopoverController,
		// private navCtrl: NavController,
		private loadCtrl: LoadingController,
		public auth: AuthProvider,
		private modalCtrl: ModalController,
		private lgServ: LoginProvider,
		public network: Network,
		public socialSharing: SocialSharing,
		public translate: TranslateService,
		private appRate: AppRate,
		public camera: Camera,
		public imagePicker: ImagePicker,
		private afServ: AfProvider,
		public file: File,
		public actionCtrl: ActionSheetController,
		public locationAccuracy: LocationAccuracy,
		public geolocation: Geolocation,
		public inapp: InAppBrowser,
		public diagnostic: Diagnostic,
		public sms: SMS
	) {
		this.afServ.retrieveURL((url) => {
			this.urlServ = url;
			this.syncListObjets(false);

			lgServ.isTable('auto_update').then((sync) => {
				if (sync != undefined) {
					if (sync) {
						this.autoSyncPlaces();
						this.autoSyncDatabase();
					}
				}
			});

			this.network.onConnect().subscribe(() => {
				setTimeout(() => {
					lgServ.isTable('auto_update').then((sync) => {
						if (sync != undefined) {
							if (sync) {
								this.autoSyncPlaces();
								this.autoSyncDatabase();
							}
						}
					});
					this.lgServ.isTable('_ona_flag').then((flag) => {
						if (flag) {
							if (flag == true) {
								this.doCheckAndDeleteFromDB();
								this.launchAutoArchive();
							}
						}
					});
				}, 3000);
			});
		});
		this.afServ.retrievePerPage((data) => {
			this.maxLimit = data.per_page;
		});
		this.presentHour = moment();
		this.presentDate = moment();
		this.presentDayNumber = new Date().getDay();

		this.lgServ.isTable('_ona_flag').then((flag) => {
			if (flag) {
				if (flag == true) {
					this.doCheckAndDeleteFromDB();
					this.launchAutoArchive();
				}
			}
		});

		this.events.subscribe('sync:changed', () => {
			lgServ.isTable('auto_update').then((val) => {
				if (val) {
					this.autoSyncPlaces();
					this.autoSyncDatabase();
				} else {
					clearInterval(this.autoSync);
					clearInterval(this.bgSyncTimer);
				}
			});
		});

		this.syncComments('manual');

		this.lgServ.isTable('wpIonicToken').then((user) => {
			if (user) {
				this.currentUser = JSON.parse(user);
			}
		});
	}

	/**
   * Cette fonction permet de synchroniser à la fois
   * les ajouts et les mises à jours des tables dès lors de la connexion
   * Internet
   * 
   * Interval set to 2 minutes
   **/
	autoSyncDatabase() {
		this.autoSync = setInterval(() => this.syncInOutDatabase(), SyncOptions.syncInOutDBTimer);
	}

	getTotalCount() {
		this.getHeaderInfo('place', 'X-WP-Total').then((total) => {
			// console.log('Total ', total)
			this.lgServ.setTableTo('_ona_total_count', total).then(() => {
				this.events.publish('totalCount:ava', total);
			});
		});
	}

	autoSyncPlaces() {
		this.lgServ.isTable('_ona_flag').then((flag) => {
			if (flag) {
				if (flag == true) {
					this.bgSyncTimer = setInterval(() => {
						this.syncComments('manual');
						this.lgServ.isTable('_ona_place_date').then((data) => {
							if (data) {
								let tab = ConfigModels.sync_tab_models;
								this.bgSync(tab.length - 1);
								// this.getTotalCount();
							}
						});
					}, SyncOptions.syncTimer);
				} else {
					clearInterval(this.bgSyncTimer);
				}
			}
		});
	}

	syncOffOnline(index) {
		//uncomment below line code
	}

	/**
   * Cette fonction permet de synchroniser à la fois
   * les ajouts et les mises à jours des tables dès lors de la connexion
   * Internet
   *
   **/
	syncInOutDatabase() {
		this.lgServ.getCurrentValSync().then((sync) => {
			this.lgServ.isTable('_ona_flag').then((res) => {
				if (res || (sync == false && localStorage.getItem('is_update') == 'true')) {
					let tab = ConfigModels.tab_models;
					var namespace;
					setTimeout(() => {
						this.deleteCommentSync();
					}, 4000);
					setTimeout(() => {
						this.createCommentSync();
					}, 5000);
					setTimeout(() => {
						this.updateCommentSync();
					}, 7000);
					for (let i = 0; i < tab.length; i++) {
						//On attend 2 secondes avant de déclancher l'insert
						if (tab[i] == 'events') {
							namespace = 'tribe/events/v1';
						} else if (tab[i] == 'tickets') {
							namespace = 'tribe/tickets/v1';
						} else {
							namespace = 'wp/v2';
						}
						setTimeout(() => {
							this.createObjetSync(tab[i], namespace);
						}, 8000);

						//On attend 1s avant de déclancher le update
						setTimeout(() => {
							this.updateObjetSync(tab[i], namespace);
						}, 9000);
						setTimeout(() => {
							this.deleteObjetSync(tab[i], namespace);
						}, 10000);
					}
				} else {
					clearInterval(this.autoSync);
				}
			});
		});
	}
	presentLoading(msg) {
		this.loginloader = this.loading.create({
			content: msg
		});
		this.loginloader.present();
	}

	/**
	 * Method to check last Delete checkup between server and local DB and start the checkup
	 */

	doCheckAndDeleteFromDB() {
		this.lgServ.isTable('_ona_last_doDelete').then((last) => {
			var last_date = new Date(JSON.parse(last));
			var now = new Date();
			if (last) {
				if (new Date(last_date.setDate(last_date.getDate() + 2)) <= now) {
					this.lgServ.isTable('_ona_place').then((data) => {
						if (data) {
							var places = JSON.parse(data);
							this.checkAndDeleteInternalDB(places);
						}
					});
				}
			} else {
				this.lgServ.isTable('_ona_place').then((data) => {
					if (data) {
						var places = JSON.parse(data);
						this.checkAndDeleteInternalDB(places);
					}
				});
			}
		});
	}

	/**
	 * Method to check each entry of the list exist on the server else we delete it in the local DB 
	 * @param places The list of all announcements
	 */
	checkAndDeleteInternalDB(places: Array<any>) {
		if (places.length == 0) {
			this.lgServ.setTable('_ona_last_doDelete', moment().format('YYYY-MM-DD'));
			return;
		} else {
			this.checkAnnonceInServer(places[places.length - 1].id)
				.then((res) => {
					// Annonec still exist on server
					places.splice(places.length - 1, 1);
					this.checkAndDeleteInternalDB(places);
				})
				.catch((err: any) => {
					if (err.status) {
						if (err.status == 404) {
							//annonce no more on server
							this.deleteFromInternalDB('place', places[places.length - 1].id);
							this.deleteFromInternalDB('place_fav ', places[places.length - 1].id);
							this.deleteFromInternalDB('historic_annonce ', places[places.length - 1].id);
							places.splice(places.length - 1, 1);
							this.checkAndDeleteInternalDB(places);
						}
					}
				});
		}
	}

	/**
	 * Cette fonction permet de synchroniser la suppression d'un 
	 * enregistrement à la bd sur Server
	 * @param type string, le nom de l'objet (modèle)
	 *
	 **/
	deleteObjetSync(type, namespace) {
		//On récupère les les objets tampons à sync avec la bd
		this.lgServ.isTable('_ona_delete_' + type).then((data) => {
			if (data) {
				clearInterval(this.autoSync);
				clearInterval(this.bgSyncTimer);
				let list_objets = JSON.parse(data);
				//console.log('before delete : ' + list_objets.length);

				this.deleteOfflineData(list_objets, type, namespace);
			}
		});
	}

	/**
	 * Cette fonction permet d'ajouter un élément a supprimer
	 * dans la bd interne
	 * @param type string, le nom du modèle
	 * @param objet JSon, l'objet à insérer
	 *
	 **/
	copiedDelSync(type, objet) {
		let alert = this.alertCtrl.create({
			title: 'Archiver ' + objet.title.rendered + ' ?',
			message: "En archivant cette annonce vous l'archiver aussi sur la plateforme web",
			buttons: [
				{
					text: 'Annuler',
					role: 'cancel',
					handler: () => {
						// //console.log('Cancel clicked');
					}
				},
				{
					text: 'Archiver',
					handler: () => {
						this.applyDelete(type, objet);
					}
				}
			]
		});
		alert.present();
	}
	/**
	 * Method to delete an entry from an internal table
	 * @param model Table to delete from
	 * @param objet Objet to delete
	 */
	delFromInternal(type, objet) {
		this.lgServ.isTable('_ona_' + type).then((res) => {
			let reqs = [];
			if (res) {
				reqs = JSON.parse(res);

				for (let k = 0; k < reqs.length; k++) {
					if (reqs[k].id == objet.id) {
						reqs.splice(k, 1);
					}
				}
			}
			this.lgServ.setTableTo('_ona_' + type, reqs).then((_resp) => {
				if (_resp) {
					if (type == 'place') {
						this.events.publish('annonce:deleted', objet);
					}
				}
			});
		});
	}

	/**
	 * Method to reduce total count of offers after offer delete
	 */
	reduceTotalCount() {
		this.lgServ.isTable('_ona_total_count').then((count) => {
			if (count) {
				var num = JSON.parse(count);
				num--;
				this.lgServ.setTableTo('_ona_total_count', num).then((_resp) => {
					this.events.publish('totalCount:ava', num);
				});
			}
		});
	}

	/**
	 * Method to add total count of offers after offer add
	 */
	addTotalCount() {
		this.lgServ.isTable('_ona_total_count').then((count) => {
			if (count) {
				var num = JSON.parse(count);
				num++;
				this.lgServ.setTableTo('_ona_total_count', num).then((_resp) => {
					this.events.publish('totalCount:ava', num);
				});
			}
		});
	}

	copieDelSyncComms(objToDel) {
		if (parseInt(objToDel.comment_ID) != 0) {
			this.lgServ.isTable('_ona_delete_comments').then((res) => {
				let reqs = [];
				if (res) {
					reqs = JSON.parse(res);
				}

				reqs.push(objToDel);

				//uncomment below line of code
				this.lgServ.setTable('_ona_delete_comments', reqs);
			});
		}
	}
	copieEditSyncComms(objToDel) {
		this.lgServ.isTable('_ona_update_comments').then((res) => {
			let reqs = [];
			if (res) {
				reqs = JSON.parse(res);
			}

			reqs.push(objToDel);

			//uncomment below line of code
			this.lgServ.setTable('_ona_update_comments', reqs);
		});
	}
	copieAddSyncComms(objToDel) {
		this.lgServ.isTable('_ona_add_comments').then((res) => {
			let reqs = [];
			if (res) {
				reqs = JSON.parse(res);
			}

			reqs.push(objToDel);

			//uncomment below line of code
			this.lgServ.setTable('_ona_add_comments', reqs);
		});
	}

	applyDelete(type, objet) {
		if (objet.id != 0) {
			this.lgServ.isTable('_ona_delete_' + type).then((res) => {
				let reqs = [];
				if (res) {
					reqs = JSON.parse(res);
				}

				var objToDel = {
					id: objet.id,
					status: 'draft'
				};

				reqs.push(objToDel);

				//uncomment below line of code
				this.lgServ.setTable('_ona_delete_' + type, reqs);
			});
		}
		if (type == 'place') {
			this.delFromInternal('place', objet);
			this.delFromInternal('historic_annonce', objet);
			this.delFromInternal('place_fav', objet);

			this.reduceTotalCount();
		}
	}

	deleteOfflineData(list_objets, type, namespace) {
		if (list_objets.length == 0) {
			this.autoSyncDatabase();
			this.autoSyncPlaces();
			this.lgServ.removeTo('_ona_delete_' + type).then((reponse) => {});

			return;
		} else {
			let index = list_objets.length - 1;
			this.updateDataToServer(type, list_objets[index].id, list_objets[index], namespace)
				.then((_data: any) => {
					if (_data) {
						list_objets.splice(index, 1);
					}

					//console.log('after delete : ' + list_objets.length);

					this.lgServ.setTableTo('_ona_delete_' + type, list_objets).then((_reponse) => {
						this.deleteOfflineData(list_objets, type, namespace);
					});
				})
				.catch((error) => {
					this.deleteOfflineData(list_objets, type, namespace);
				});
		}
	}

	getConversionRate() {
		return this.http.get(
			ApiPaypal.converterUrl +
				'?q=XAF_' +
				ApiPaypal.currency +
				'&compact=ultra&apiKey=' +
				ApiPaypal.currencyconverterapi
		);
	}

	/**
	 * Method to save a notification in local DB
	 * @param data Notification data Object
	 */
	saveNotification(data) {
		this.lgServ.isTable('_ona_notifications').then((notif) => {
			var list = [];
			if (notif) {
				list = JSON.parse(notif);
			}
			list.push(data);
			this.lgServ.setTableTo('_ona_notifications', list).then(() => {
				this.events.publish('notif:ava', list);
			});
		});
	}

	/**
	 * Method to manually launch synchronisation of list of tables
	 */

	launchManualSync() {
		let tab = ConfigModels.tab_models;
		this.updateListObjetSync(tab.length - 1);
		this.syncComments('manual');
	}

	compareAndReplaceComments(serverList: Array<any>, localList: Array<any>) {
		var localIds = [];
		for (let k = 0; k < localList.length; k++) {
			localIds.push(parseInt(localList[k].content.comment_ID));
		}

		for (let j = 0; j < serverList.length; j++) {
			if (localIds.indexOf(parseInt(serverList[j].content.comment_ID)) > -1) {
				localList[localIds.indexOf(parseInt(serverList[j].content.comment_ID))] = serverList[j];
			} else {
				localList.push(serverList[j]);
			}
		}
		return localList;
	}

	/**
	 * 
	 * @param source Sync source
	 */
	syncComments(source) {
		if (source == 'manual') {
			this.lgServ.isTable('allcomments').then((comments) => {
				if (comments) {
					var list_comments = [];
					list_comments = JSON.parse(comments);

					// console.log('Local comments', list_comments);
					this.afServ.retrieveURL((objUrl) => {
						this.http.get(objUrl.url + '/wp-json/Comments/All/?List_comment=List').subscribe(
							(data: any) => {
								if (data) {
									var list = [];
									for (let i = 0; i < data.length; i++) {
										if (data[i].content.comment_approved == '1') {
											list.push(data[i]);
										}
									}
									// console.log()
									this.lgServ.setTable(
										'allcomments',
										this.compareAndReplaceComments(list, list_comments)
									);
								}
							},
							(err) => {
								//console.log('Error', err);
							}
						);
					});
				} else {
					this.afServ.retrieveURL((objUrl) => {
						this.http.get(objUrl.url + '/wp-json/Comments/All/?List_comment=List').subscribe(
							(data: any) => {
								if (data) {
									var list = [];
									// console.log('Server comments', data);

									for (let i = 0; i < data.length; i++) {
										if (data[i].content.comment_approved == '1') {
											list.push(data[i]);
										}
									}
									this.lgServ.setTable('allcomments', list);
								}
							},
							(err) => {}
						);
					});
				}
			});
		} else {
			this.lgServ.isTable('allcomments').then((comments) => {
				if (comments) {
					// this.syncComments('manual');
				} else {
					this.syncComments('manual');
				}
			});
		}
	}

	syncListObjets(isSynch: boolean, options?: any) {
		this.lgServ.isTable('_ona_date').then((res) => {
			if (res == null) {
				let tab = ConfigModels.tab_models;
				this.updateListObjetSync(tab.length - 1);
				// this.syncOffOnline(tab.length - 1);
			} else {
				this.syncOffOnline(ConfigModels.sync_tab_models.length - 1);
			}
		});
	}

	loadByPage(model, currentPage, totalPage) {
		if (model == 'products' || model == 'orders') {
			this.http
				.get(
					this.urlServ.url +
						'/wp-json/wc/v3/' +
						model +
						'/?consumer_key=' +
						ApiConfig.consumer_key +
						'&consumer_secret=' +
						ApiConfig.consumer_secret +
						'&page=' +
						currentPage +
						'&per_page=' +
						this.maxLimit
				)
				.subscribe(
					(result) => {
						// console.log('By page', result);
						this.lgServ.isTable('_ona_' + model).then((prods) => {
							if (prods) {
								let results = [];
								let total;
								results = JSON.parse(prods);
								total = results.concat(result);
								this.lgServ.setTableTo('_ona_' + model, total).then((_resp) => {
									if (currentPage < totalPage) {
										currentPage++;
										this.loadByPage(model, currentPage, totalPage);
									} else {
										this.lgServ.setSync('_ona_' + model + '_date');
										this.events.publish(model + '_sync:done');
									}
								});
							} else {
								this.lgServ.setTableTo('_ona_' + model, result).then((_res) => {
									this.events.publish(model + '_sync:done');
									if (currentPage < totalPage) {
										currentPage++;
										this.loadByPage(model, currentPage, totalPage);
									} else {
										this.lgServ.setSync('_ona_' + model + '_date');
									}
								});
							}
						});
					},
					(err) => {}
				);
		} else {
			this.http
				.get(
					this.urlServ.url + '/wp-json/wp/v2/' + model + '?page=' + currentPage + '&per_page=' + this.maxLimit
				)
				.subscribe(
					(res) => {
						this.lgServ.isTable('_ona_' + model).then((prods) => {
							if (prods) {
								let results = [];
								let total;
								results = JSON.parse(prods);
								total = results.concat(res);
								this.lgServ.setTableTo('_ona_' + model, total).then((_resp) => {
									if (currentPage < totalPage) {
										currentPage++;
										this.loadByPage(model, currentPage, totalPage);
									} else {
										this.lgServ.setSync('_ona_' + model + '_date');
										this.events.publish(model + '_sync:done');
									}
								});
							} else {
								this.lgServ.setTableTo('_ona_' + model, res).then((_res) => {
									this.events.publish(model + '_sync:done');
									if (currentPage < totalPage) {
										currentPage++;
										this.loadByPage(model, currentPage, totalPage);
									} else {
										this.lgServ.setSync('_ona_' + model + '_date');
									}
								});
							}
						});
					},
					(err) => {}
				);
		}
	}

	manualSyncModel(model) {
		if (model == 'products' || model == 'orders') {
			this.getHeaderInfo(model, 'X-WP-Total').then((count) => {
				this.getHeaderInfo(model, 'X-WP-TotalPages').then((pages) => {
					if (count > 0) {
						let currentpage = 1;
						this.loadByPage(model, currentpage, pages);
					} else {
						let res = [];
						this.lgServ.setTableTo('_ona_' + model, res).then(() => {
							this.events.publish(model + '_sync:done');
						});
						// this.lgServ.setSync('_ona_' + model + '_date');
					}
				});
			});
		} else {
			this.getHeaderInfo(model, 'X-WP-Total').then((count) => {
				this.getHeaderInfo(model, 'X-WP-TotalPages').then((pages) => {
					if (count > 0) {
						let currentpage = 1;
						this.loadByPage(model, currentpage, pages);
					} else {
						let res = [];
						this.lgServ.setTableTo('_ona_' + model, res).then(() => {
							this.events.publish(model + '_sync:done');
						});
						// this.lgServ.setSync('_ona_' + model + '_date');
					}
				});
			});
		}
	}

	/**
	 * @author Landry Fongang (mr_madcoder_fil)
	 * @param index Model of data to be sunced index's
	 */
	bgSync(index) {
		if (index == -1) {
			// this.lgServ.setLastUpdate();
			//console.log('is update');
			// this.events.publish('sync:done', true);
			this.lgServ.setSync('_ona_date');
			this.syncOffOnline(ConfigModels.sync_tab_models.length - 1);
			return;
		} else {
			let alias = ConfigModels.sync_tab_models[index];

			var lastSyncFound: boolean;
			var lastSyncFoundDate;
			this.lgServ.isTable('_ona_' + alias + '_date').then((last_sync_date) => {
				if (alias == 'place' || alias == 'location' || alias == 'place_category' || alias == 'place_tag') {
					if (last_sync_date) {
						lastSyncFound = true;
						lastSyncFoundDate = last_sync_date;
					} else {
						lastSyncFound = false;
						//console.log('last sync not found for ', alias);
					}
				} else {
					lastSyncFound = false;
				}

				this.getHeaderInfo(alias, 'X-WP-Total', lastSyncFound, lastSyncFoundDate).then((totalCount) => {
					this.getHeaderInfo(alias, 'X-WP-TotalPages', lastSyncFound, lastSyncFoundDate).then(
						(pages) => {
							var totalNulberOfplaces = 0;
							var pageNum = 0;
							var page;
							var num;
							page = pages;
							num = totalCount;
							totalNulberOfplaces = num;
							pageNum = page;

							if (alias == 'place' && totalCount) {
								this.lgServ.isTable('_ona_total_count').then((lastTotal) => {
									if (lastTotal == null) {
										this.lgServ.setTableTo('_ona_total_count', totalCount).then(() => {
											this.events.publish('totalCount:ava', totalCount);
										});
									}
								});
							}

							if (pageNum > 0) {
								let currentPage = 1;
								this.loadListingByPage(
									alias,
									index,
									currentPage,
									lastSyncFound,
									lastSyncFoundDate,
									pageNum,
									'bgsync'
								);
							} else {
								if (lastSyncFound == true) {
									index--;
									this.bgSync(index);
								} else {
									let results;
									results = [];
									this.lgServ.setTable('_ona_' + alias, results);
									this.events.publish(alias + '_sync:done');
									this.lgServ.setSync('_ona_' + alias + '_date');
									index--;
									this.bgSync(index);
								}
							}
						},
						(err) => {
							//console.log('Error heder', err);
						}
					);
				});
			});
		}
	}

	/**
	 * @author Landry Fongang (mr_madcoder_fil)
	 * @param array Data list from server to be used to browse internal BD and replace old occurencies
	 * @param alias Internal DB in question
	 */
	checkAndreplaceInLocal(dataArray, array, alias) {
		this.lgServ.isTable('_ona_' + alias).then((result) => {
			if (result) {
				var results = [];
				var dumpArray = [];
				results = JSON.parse(result);
				dumpArray = array;
				for (let k = 0; k < results.length; k++) {
					if (dumpArray.indexOf(results[k].id) > -1) {
						results[k] = dataArray[dumpArray.indexOf(results[k].id)];
						this.lgServ.setTable('_ona_' + alias, results);
					} else {
						this.lgServ.setTable('_ona_' + alias, results.concat(dataArray));
						// results.push(dataArray[dumpArray.indexOf(results[k].id)]);
					}
				}
			}
		});
	}

	retrieveCategories() {
		return new Promise((resolve, reject) => {
			this.afServ.retrieveURL((_url) => {
				let apiUrl = _url.url;
				this.http.get(apiUrl + '/wp-json/wp/v2/categories').subscribe((result) => {
					resolve(result);
				});
			}),
				(err) => {
					reject(err);
				};
		});
	}

	/**
	 * Cette méthode permet de récupérer
	 * la liste des articles liées à la catégorie
	 * Paroles aux Experts
	 */
	retrievePost() {
		return new Promise((resolve, reject) => {
			this.afServ.retrieveURL((_url) => {
				this.afServ.retrievePost((_post) => {
					let apiUrl = _url.url;
					let apiPost = _post.post;
					let Smobilpay = _url.localUrl;
					this.tempUrl = Smobilpay;
					//console.log('URL =>', apiUrl);
					this.http.get(apiUrl + apiPost).subscribe((result) => {
						resolve(result);
					});
				}),
					(err) => {
						reject(err);
					};
			});
		});
	}

	getCustomer(id) {
		let url =
			this.urlServ.url +
			ApiConfig.url_customer +
			'/' +
			id +
			'?consumer_key=' +
			ApiConfig.consumer_key +
			'&consumer_secret=' +
			ApiConfig.consumer_secret;

		return this.http.get(url);
	}

	retrieveArticles() {
		return new Promise((resolve, reject) => {
			this.afServ.retrieveURL((_url) => {
				let apiUrl = _url.url;
				this.http.get(apiUrl + '/wp-json/wp/v2/posts').subscribe((result) => {
					resolve(result);
				}),
					(err) => {
						reject(err);
					};
			});
		});
	}

	setCategory() {
		return new Promise((resolve, reject) => {
			this.afServ.retrieveCategories((val) => {
				var apiCategories = val.url;
				this.http.get(apiCategories).map((array) => array).subscribe((cont) => {
					resolve(cont);
				});
			});
		});
	}
	getCompanyPubs() {
		return new Promise((resolve, reject) => {
			this.afServ.getCompanyPubs((_val) => {
				// var image = _val.img;
				resolve(_val);
			}),
				(err) => {
					reject(err);
				};
		});
	}
	getCatPubs() {
		return new Promise((resolve, reject) => {
			this.afServ.getCatPubs((_val) => {
				// var image = _val.img;
				resolve(_val);
			}),
				(err) => {
					reject(err);
				};
		});
	}
	gettaxonomyPubs() {
		return new Promise((resolve, reject) => {
			this.afServ.getTaxonomyPubs((_val) => {
				// var image = _val.img;
				resolve(_val);
			}),
				(err) => {
					reject(err);
				};
		});
	}

	setArticle() {
		return new Promise((resolve, reject) => {
			this.afServ.retrieveArticles((_data) => {
				var urlArticle = _data.url;
				this.http.get(urlArticle).map((array) => array).subscribe((cont) => {
					resolve(cont);
				});
			});
		});
	}

	getDataAndSaveinLocal(alias) {
		return new Promise((resolve, reject) => {
			this.getHeaderInfo(alias, 'X-WP-Total').then((totalCount) => {
				this.getHeaderInfo(alias, 'X-WP-TotalPages').then(
					(pages) => {
						var totalNulberOfplaces = 0;
						var pageNum = 0;
						var page;
						var num;
						page = pages;
						num = totalCount;
						totalNulberOfplaces = num;
						pageNum = page;
						if (pageNum > 0) {
							for (let i = 1; i <= pageNum; i++) {
								this.getWpData(alias, this.maxLimit, i).then(
									(data) => {
										this.lgServ.isTable('_ona_' + alias).then((response) => {
											if (response) {
												var results = [];
												var total;
												results = JSON.parse(response);
												total = results.concat(data);
												this.lgServ.setTable('_ona_' + alias, total);
												if (i == pageNum) {
													this.lgServ.setSync('_ona_' + alias + '_date');
													resolve(true);
												}
											} else {
												this.lgServ.setTable('_ona_' + alias, data);
												if (i == pageNum) {
													this.lgServ.setSync('_ona_' + alias + '_date');
													resolve(true);
												}
											}
										});
									},
									(error) => {
										// this.updateListObjetSync(index);
										//console.log('Error data', error);
									}
								);
							}
						} else {
							let results;
							results = [];
							this.lgServ.setTable('_ona_' + alias, results);
							this.lgServ.setSync('_ona_' + alias + '_date');
							resolve(true);
						}
					},
					(err) => {
						// this.updateListObjetSync(index);
						//console.log('Error heder', err);
					}
				);
			});
		});
	}

	/**
    * Cette fonction permet de mettre à jour la liste
    * des modèles à jour dans la bd
    *
    **/
	updateListObjetSync(index) {
		if (index == -1) {
			this.lgServ.setLastUpdate();
			//console.log('is update');
			this.storage.get('_last_synchro').then((data) => {
				if (!data) {
					this.showMsgWithButton('Synchronisation terminer', 'top', 'toast-info');
				}
			});
			this.events.publish('sync:done', true);
			this.lgServ.setSync('_ona_date');
			this.syncOffOnline(ConfigModels.sync_tab_models.length - 1);
			return;
		} else {
			let alias = ConfigModels.tab_models[index];
			if (
				alias == 'events' ||
				alias == 'venues' ||
				alias == 'organizers' ||
				alias == 'categories' ||
				alias == 'ev_tags' ||
				alias == 'products' ||
				alias == 'orders' ||
				alias == 'customers' ||
				alias == 'tickets'
			) {
				this.getWpData(alias, this.maxLimit, 1).then(
					(res: any) => {
						if (alias == 'products' || alias == 'orders' || alias == 'customers') {
							this.lgServ.setTable('_ona_' + alias, res);
							this.lgServ.setSync('_ona_' + alias + '_date');
							index--;
							this.updateListObjetSync(index);
						} else {
							var eventRes;
							eventRes = res;

							if (eventRes.total_pages > 0) {
								for (let k = 1; k <= eventRes.total_pages; k++) {
									this.getWpData(alias, this.maxLimit, k).then(
										(events) => {
											let responseEv;
											responseEv = events;
											this.lgServ.isTable('_ona_' + alias).then((localEvents) => {
												if (localEvents) {
													let results = [];
													let total;
													results = JSON.parse(localEvents);
													if (alias == 'ev_tags') {
														total = results.concat(responseEv['tags']);
													} else {
														total = results.concat(responseEv[alias]);
													}
													this.lgServ.setTable('_ona_' + alias, total);
													if (k == eventRes.total_pages) {
														this.lgServ.setSync('_ona_' + alias + '_date');
														index--;
														this.updateListObjetSync(index);
													}
												} else {
													let all;
													if (alias == 'ev_tags') {
														all = responseEv.tags;
													} else {
														all = responseEv[alias];
													}
													this.lgServ.setTable('_ona_' + alias, all);
													if (k == eventRes.total_pages) {
														this.lgServ.setSync('_ona_' + alias + '_date');
														index--;
														this.updateListObjetSync(index);
													}
												}
											});
										},
										(error) => {
											//console.log('Error data', error);
										}
									);
								}
							} else {
								let results;
								results = [];
								this.lgServ.setTable('_ona_' + alias, results);
								this.lgServ.setSync('_ona_' + alias + '_date');
								index--;
								this.updateListObjetSync(index);
							}

							/* 	index--;
					this.updateListObjetSync(index); */
						}
					},
					(error) => {
						//console.log('Error data', error);
					}
				);
			} else {
				var lastSyncFound: boolean;
				var lastSyncFoundDate;
				this.lgServ.isTable('_ona_' + alias + '_date').then((last_sync_date) => {
					if (
						alias == 'pack' ||
						alias == 'place' ||
						alias == 'location' ||
						alias == 'place_category' ||
						alias == 'place_tag'
					) {
						if (last_sync_date) {
							lastSyncFound = true;
							lastSyncFoundDate = last_sync_date;

							//console.log(alias + ' found ', lastSyncFound + ' found date ', lastSyncFoundDate);
						} else {
							lastSyncFound = false;
							//console.log('last sync not found for ', alias);
						}
					} else {
						lastSyncFound = false;
					}

					this.getHeaderInfo(alias, 'X-WP-Total', lastSyncFound, lastSyncFoundDate).then((totalCount) => {
						this.getHeaderInfo(alias, 'X-WP-TotalPages', lastSyncFound, lastSyncFoundDate).then(
							(pages) => {
								var totalNulberOfplaces = 0;
								var pageNum = 0;
								var page;
								var num;
								page = pages;
								num = totalCount;
								totalNulberOfplaces = num;
								pageNum = page;

								if (alias == 'place' && totalCount) {
									this.lgServ.isTable('_ona_total_count').then((lastTotal) => {
										if (lastTotal == null) {
											this.lgServ.setTableTo('_ona_total_count', totalCount).then(() => {
												this.events.publish('totalCount:ava', totalCount);
											});
										}
									});
								}

								if (pageNum > 0) {
									let currentPage = 1;
									this.loadListingByPage(
										alias,
										index,
										currentPage,
										lastSyncFound,
										lastSyncFoundDate,
										pageNum
									);
								} else {
									if (lastSyncFound == true) {
										index--;
										this.updateListObjetSync(index);
									} else {
										let results;
										results = [];
										this.lgServ.setTable('_ona_' + alias, results);
										this.events.publish(alias + '_sync:done');
										this.lgServ.setSync('_ona_' + alias + '_date');
										index--;
										this.updateListObjetSync(index);
									}
								}
							},
							(err) => {
								//console.log('Error heder', err);
							}
						);
					});
				});
			}
		}
	}

	getCustomerOrders(cust_id) {
		let url =
			this.urlServ.url +
			ApiConfig.url_orders +
			'?consumer_key=' +
			ApiConfig.consumer_key +
			'&consumer_secret=' +
			ApiConfig.consumer_secret +
			'&customer=' +
			cust_id;

		return this.http.get(url);
	}

	/**
	 * method to compare 2 arrays and replace new elements of array from server with old ones in array in local
	 * @param serverList List from server
	 * @param localList list in local
	 */
	compareAndReplace(serverList: Array<any>, localList: Array<any>, state?) {
		// console.log('Local list', localList);
		/* if (state == 'bgsync') {
			for (let k = 0; k < serverList.length; k++) {
				this.addTotalCount();
			}
		} */
		var localIds = [];
		for (let k = 0; k < localList.length; k++) {
			localIds.push(localList[k].id);
		}

		for (let j = 0; j < serverList.length; j++) {
			if (localIds.indexOf(serverList[j].id) > -1) {
				//console.log('Existed already', localList[localIds.indexOf(serverList[j].id)]);
				localList[localIds.indexOf(serverList[j].id)] = serverList[j];
			} else {
				if (state == 'bgsync') {
					localList.unshift(serverList[j]);
					// this.addTotalCount();
				} else {
					localList.push(serverList[j]);
				}
			}
		}
		return localList;
	}

	/**
	 * Method to delete an announcement added offline after it has been online already
	 */
	deleteByIdx(server_places) {
		for (let k = 0; k < server_places.length; k++) {
			this.lgServ.isTable('_ona_idx_place').then((idxlist) => {
				this.lgServ.isTable('_ona_place').then((places) => {
					if (idxlist && places) {
						var list = [];
						var placesList = [];
						list = JSON.parse(idxlist);
						placesList = JSON.parse(places);

						if (server_places[k].author == this.currentUser.user.ID) {
							for (let i = 0; i < placesList.length; i++) {
								if (placesList[i].idx != undefined) {
									if (list.indexOf(placesList[i].idx) > -1) {
										placesList.splice(placesList[i], 1);
										list.splice(list.indexOf(placesList[i].idx), 1);

										this.lgServ.setTable('_ona_idx_place', list);
										this.lgServ.setTable('_ona_place', placesList);
									}
								}
							}
						}
					}
				});
			});
		}
	}

	loadListingByPage(alias, index, currentPage, lastSyncFound, lastSyncFoundDate, totalPage, state?) {
		// console.log('page =>', currentPage);
		this.getWpData(alias, this.maxLimit, currentPage, lastSyncFound, lastSyncFoundDate).then(
			(data: any) => {
				if (alias == 'place') {
					// console.log('Data =>', data);
				}
				this.lgServ.isTable('_ona_place_date').then((date) => {
					if (date && alias == 'place') {
						this.deleteByIdx(data);
						// this.showMsgWithButton(data.length + ' nouvelle(s) annonce(s) ajoutée(s)', 'top', 'toast-info');
					}
				});
				this.lgServ.isTable('_ona_' + alias).then((response) => {
					if (response) {
						var results = [];
						var total;
						results = JSON.parse(response);

						if (alias == 'pack' || alias == 'place' || alias == 'location' || alias == 'place_category') {
							total = this.compareAndReplace(data, results, state);
						} else {
							total = results.concat(data);
						}

						this.lgServ.setTableTo('_ona_' + alias, total).then((_rep) => {
							if (currentPage < totalPage) {
								currentPage++;
								this.loadListingByPage(
									alias,
									index,
									currentPage,
									lastSyncFound,
									lastSyncFoundDate,
									totalPage,
									state
								);
							} else {
								this.lgServ.setSync('_ona_' + alias + '_date');
								this.events.publish(alias + '_sync:done');
								index--;
								this.updateListObjetSync(index);
							}
						});
					} else {
						// this.lgServ.setTable('_ona_' + alias, data);
						this.lgServ.setTableTo('_ona_' + alias, data).then((_rep) => {
							this.events.publish(alias + '_sync:done');
							if (currentPage < totalPage) {
								currentPage++;
								this.loadListingByPage(
									alias,
									index,
									currentPage,
									lastSyncFound,
									lastSyncFoundDate,
									totalPage,
									state
								);
							} else {
								this.lgServ.setSync('_ona_' + alias + '_date');
								index--;
								this.updateListObjetSync(index);
							}
						});
					}
				});
			},
			(error) => {
				// console.log('Error data', error);
			}
		);
	}

	getAllArticles() {
		return new Promise((resolve, reject) => {
			this.getHeaderInfo('place').then(
				(num) => {
					this.getWpData('place', num).then(
						(data) => {
							resolve(data);
						},
						(err) => {
							reject(err);
						}
					);
				},
				(error) => {
					//console.log('Error retrieving header info ', error);
				}
			);
		});
	}

	getUserData(user, url) {
		const api_url = url.url + '/wp-json/wp/v2/users/';
		return this.http.get(api_url + user.user.ID);
	}

	/** Function to retrieve all data about a certain model(place: articles, pointfinderltypes: Categories)
	 * @author Landry Fongang (mr_madcoder_fil)
	 * @param model The type of data to retrieve from wordpress (type: string). See config.ts
	 * @param count The number of elements to retrieve (type : number)
	 * @param embed Decide whether to send embedded variable or nor in JSON response
	 * @param start_date Date from when to retrieve events (format EX. 2018-11-07 00:00:00). Default 2018-01-01 00:00:00
	 */
	getWpData(model, count?: any, page?: any, lastsyncfound?: boolean, lastSyncdate?: any, embed?: any) {
		return new Promise((resolve, reject) => {
			this.afServ.retrieveURL((objurl) => {
				if (model == 'place' || model == 'location' || model == 'place_category') {
					//On définit le User Agent
					let objHeaders = new HttpHeaders();
					// let defaultHeaders = new HttpHeaders({
					// 	'User-Agent':'Mozilla/5.0',
					// });

					objHeaders.set('User-Agent', 'Mozilla/5.0');

					let headers = objHeaders;

					if (lastsyncfound == true) {
						this.http
							.get(
								objurl.url +
									'/wp-json/wp/v2/' +
									model +
									'?per_page=' +
									count +
									'&page=' +
									page +
									'&_embed' +
									'&after=' +
									lastSyncdate +
									'&date_query_column=modified',
								{ headers: headers }
							)
							.subscribe(
								(result) => {
									resolve(result);
								},
								(err) => {
									reject(err);
								}
							);
					} else {
						this.http
							.get(
								objurl.url +
									'/wp-json/wp/v2/' +
									model +
									'?per_page=' +
									count +
									'&page=' +
									page +
									'&_embed'
							)
							.subscribe(
								(result) => {
									resolve(result);
								},
								(err) => {
									reject(err);
								}
							);
					}
				} else if (model == 'categorie_actu') {
					// view categories
					this.http
						.get(
							objurl.url +
								'/wp-json/wp/v2/categories' +
								'?per_page=' +
								count +
								'&page=' +
								page +
								'&_embed'
						)
						.subscribe(
							(result) => {
								resolve(result);
							},
							(err) => {
								reject(err);
							}
						);
				} else if (model == 'actualite') {
					// view actualite
					this.http
						.get(objurl.url + '/wp-json/wp/v2/posts' + '?per_page=' + count + '&page=' + page + '&_embed')
						.subscribe(
							(result) => {
								resolve(result);
							},
							(err) => {
								reject(err);
							}
						);
				} else if (
					model == 'events' ||
					model == 'venues' ||
					model == 'organizers' ||
					model == 'ev_categories' ||
					model == 'ev_tags'
				) {
					// retrieve events list
					if (model == 'ev_tags') {
						this.http
							.get(objurl.url + '/wp-json/tribe/events/v1/tags' + '?per_page=' + count + '&page=' + page)
							.subscribe(
								(result) => {
									resolve(result);
								},
								(err) => {
									reject(err);
								}
							);
					} else if (model == 'ev_categories') {
						this.http
							.get(
								objurl.url +
									'/wp-json/tribe/events/v1/categories' +
									'?per_page=' +
									count +
									'&page=' +
									page
							)
							.subscribe(
								(result) => {
									resolve(result);
								},
								(err) => {
									reject(err);
								}
							);
					} else if (model == 'events') {
						this.http
							.get(
								objurl.url +
									'/wp-json/tribe/events/v1/' +
									model +
									'?per_page=' +
									count +
									'&page=' +
									page
							)
							.subscribe(
								(result) => {
									resolve(result);
								},
								(err) => {
									reject(err);
								}
							);
					} else {
						this.http
							.get(
								objurl.url +
									'/wp-json/tribe/events/v1/' +
									model +
									'?per_page=' +
									count +
									'&page=' +
									page
							)
							.subscribe(
								(result) => {
									resolve(result);
								},
								(err) => {
									reject(err);
								}
							);
					}
				} else if (model == 'tickets') {
					this.http
						.get(objurl.url + '/wp-json/tribe/tickets/v1/' + model + '?per_page=' + count + '&page=' + page)
						.subscribe(
							(result) => {
								resolve(result);
							},
							(err) => {
								reject(err);
							}
						);
				} else if (model == 'pointfinderltypes') {
					this.http.get(objurl.url + '/wp-json/GuideAfricain/Category/').subscribe(
						(result) => {
							resolve(result);
						},
						(err) => {
							reject(err);
						}
					);
				} else if (model == 'products' || model == 'orders' || model == 'customers') {
					// console.log('Synchronising ', model);
					this.http
						.get(
							objurl.url +
								'/wp-json/wc/v3/' +
								model +
								'/?consumer_key=' +
								ApiConfig.consumer_key +
								'&consumer_secret=' +
								ApiConfig.consumer_secret
						)
						.subscribe(
							(result) => {
								resolve(result);
							},
							(err) => {
								reject(err);
							}
						);
				} else {
					this.http
						.get(objurl.url + '/wp-json/wp/v2/' + model + '?per_page=' + count + '&page=' + page)
						.subscribe(
							(result) => {
								resolve(result);
							},
							(err) => {
								reject(err);
							}
						);
				}
			});
		});
	}
	/** Function to retrieve all data about a certain model(place: articles, pointfinderltypes: Categories)
	 * @author Landry Fongang (mr_madcoder_fil)
	 * @param model The type of data to retrieve from wordpress (type: string). See config.ts
	 * @param count The number of elements to retrieve (type : number)
	 * @param date The date after which to retrieve post
	 * @param embed The date after which to retrieve post
	 */
	getLastMod(model, count?: any, page?: any, date?: any, embed?: any) {
		return new Promise((resolve, reject) => {
			this.afServ.retrieveURL((objurl) => {
				if (model == 'place') {
					// let options = {};
					this.http
						.get(
							objurl.url +
								'/wp-json/wp/v2/' +
								model +
								'?after=' +
								date +
								'&date_query_column=modified' +
								'&per_page=' +
								count +
								'&page=' +
								page +
								'&_embed'
						)
						.subscribe(
							(result) => {
								resolve(result);
							},
							(err) => {
								reject(err);
							}
						);
				} else {
					this.http
						.get(
							objurl.url +
								'/wp-json/wp/v2/' +
								model +
								'?after=' +
								date +
								'&date_query_column=modified' +
								'&per_page=' +
								count +
								'&page=' +
								page
						)
						.subscribe(
							(result) => {
								resolve(result);
							},
							(err) => {
								reject(err);
							}
						);
				}
			});
		});
	}

	getInfosAbout(callback) {
		return this.storage.get('fireAbout').then((_data) => {
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

			// this.lgServ.setTable('_ona_about', result);
			callback(result);
		});
	}

	getAllUsers(num) {
		return new Promise((resolve) => {
			this.storage.get('fireUrl').then((url) => {
				this.http.get(url + '/wp-json/wp/v2/users/?per_page=' + num).subscribe((result) => {
					resolve(result);
				});
			});
		});
	}

	/** @author Landry Fongang
	 * Method to sync data in BG of models of namespace different
	 * from TRIBE
	 * @param model Data model to sync in background
	 */
	pageBgSyncOthers(model) {
		//console.log('Syncing others');
		var tempTable = [];
		this.getHeaderInfo(model, 'X-WP-Total').then((totalCount) => {
			this.getHeaderInfo(model, 'X-WP-TotalPages').then((pages) => {
				for (let k = 1; k <= pages; k++) {
					this.getWpData(model, this.maxLimit, k).then((posts: any) => {
						if (posts.length == totalCount) {
							// console.log('Length equal to 100 so OK');
							this.lgServ.setTable('_ona_' + model, posts);
						} else {
							tempTable = tempTable.concat(posts);

							if (k == pages) {
								this.lgServ.setTable('_ona_' + model, tempTable);
								this.lgServ.setSync('_ona_' + model + '_date');
							}
						}
					});
				}
			});
		});
	}

	/** @author Landry Fongang
	 * Method to sync data in BG of models of the name space TRIBE
	 * @param model Data model to sync in background
	 */
	/** @author Landry Fongang
	 * Method to sync data in BG of models of the name space TRIBE
	 * @param model Data model to sync in background
	 */
	pageBgSyncTribe(model) {
		return new Promise((resolve, reject) => {
			var tempTable = [];
			this.total = 0;
			this.pagenum = 0;
			this.getWpData(model, this.maxLimit, 1)
				.then((res: any) => {
					this.pagenum = res.total_pages;
					this.total = res.total;

					for (let k = 1; k <= this.pagenum; k++) {
						this.getWpData(model, this.maxLimit, k).then((result: any) => {
							let myResult;

							if (model == 'ev_categories') myResult = result['categories'];
							else myResult = result[model];

							if (myResult.length == this.total) {
								// console.log('Length equal to 100 so OK');
								resolve(myResult);
								this.lgServ.setTable('_ona_' + model, myResult);
							} else {
								tempTable = tempTable.concat(myResult);

								if (k == this.pagenum) {
									// console.log('Concatenated to =>', tempTable);
									resolve(tempTable);
									this.lgServ.setTable('_ona_' + model, tempTable);
									this.lgServ.setSync('_ona_' + model + '_date');
								}
							}
						});
					}
				})
				.catch((err) => {
					// console.log(err);
				});
		});
	}

	verifyOffer(form) {
		return new Promise((resolve) => {
			this.storage.get('fireUrl').then((url) => {
				this.http.get(url + '/wp-content/API/verifyPost.php?Verify_value=1' + '&Post_ID=' + form.id).subscribe(
					(result) => {
						// alert('Attach Image Result ' + result);
						resolve(result);
					},
					(error) => {
						// alert('Error ' + JSON.stringify(error));
					}
				);
			});
		});
	}

	/**
	 * @author Landry Fongang (mr_madcoder_fil)
	 * Method to get informations about a header on a particular model of data
	 * @param type info header to retrieve ex: 'X-WP-TotalPages', 'X-WP-Total'
	 */
	getHeaderInfo(model, type?: any, lastsyncfound?: boolean, lastSyncFoundDate?: any) {
		return new Promise((resolve) => {
			this.afServ.retrieveURL((objUrl) => {
				var xhr = new XMLHttpRequest();
				xhr.addEventListener('readystatechange', function() {
					if (this.readyState === 4) {
						resolve(xhr.getResponseHeader(type));
						console.log('xhr.getResponseHeader()', xhr.getResponseHeader(type));
					} /* else {
						reject('Error');
					} */
				});

				if (model == 'event') {
					//console.log('Event loading...');
					xhr.open('HEAD', objUrl.url + '/wp-json/tribe/events/v1/events?per_page=' + this.maxLimit);
				} else {
					if (model == 'pack' || model == 'place' || model == 'location' || model == 'place_category') {
						if (lastsyncfound == true) {
							xhr.open(
								'HEAD',
								objUrl.url +
									'/wp-json/wp/v2/' +
									model +
									'/?' +
									'after=' +
									lastSyncFoundDate +
									'&date_query_column=modified' +
									'&per_page=' +
									this.maxLimit
							);
						} else {
							xhr.open('HEAD', objUrl.url + '/wp-json/wp/v2/' + model + '/?per_page=' + this.maxLimit);
						}
					} else {
						if (model == 'products' || model == 'orders') {
							xhr.open(
								'HEAD',
								objUrl.url +
									'/wp-json/wc/v3/' +
									model +
									'/?consumer_key=' +
									ApiConfig.consumer_key +
									'&consumer_secret=' +
									ApiConfig.consumer_secret +
									'&per_page=' +
									this.maxLimit
							);
						} else {
							xhr.open('HEAD', objUrl.url + '/wp-json/wp/v2/' + model + '/?per_page=' + this.maxLimit);
						}
					}
				}
				xhr.send(null);
			});
		});
	}
	/**
	 * @author Landry Fongang (mr_madcoder_fil)
	 * Method to get informations about a header on a particular model of data during bgSync method
	 * @param type info header to retrieve ex: 'X-WP-TotalPages', 'X-WP-Total'
	 */
	getSyncHeaderInfo(model, type?: any, date?: any) {
		return new Promise((resolve) => {
			this.afServ.retrieveURL((objUrl) => {
				var xhr = new XMLHttpRequest();
				xhr.addEventListener('readystatechange', function() {
					if (this.readyState === 4) {
						resolve(xhr.getResponseHeader(type));
					}
				});

				xhr.open(
					'HEAD',
					objUrl.url +
						'/wp-json/wp/v2/' +
						model +
						'?per_page=' +
						this.maxLimit +
						'&after=' +
						date +
						'&date_query_column=modified'
				);
				xhr.send(null);
			});
		});
	}

	geocode(address) {
		return new Promise((resolve) => {
			this.http
				.get(
					'https://maps.googleapis.com/maps/api/geocode/json?address=' +
						address +
						'&key=AIzaSyB6xaISf7UKYbFgJUfxCH8MRbMaJw-mxvY'
				)
				.subscribe((result) => {
					resolve(result);
				});
		});
	}

	geolocate() {
		return new Promise((resolve) => {
			this.http
				.get('https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyB6xaISf7UKYbFgJUfxCH8MRbMaJw-mxvY')
				.subscribe((result) => {
					resolve(result);
				});
		});
	}

	reverseGeocoding(lat, lng) {
		return new Promise((resolve) => {
			this.http
				.get(
					'https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
						lat +
						',' +
						lng +
						'&key=AIzaSyB6xaISf7UKYbFgJUfxCH8MRbMaJw-mxvY'
				)
				.subscribe((result) => {
					resolve(result);
				});
		});
	}

	presentAlert(title, msg) {
		let alert = this.alertCtrler.create({
			title: title,
			subTitle: msg,
			buttons: [ 'Dismiss' ]
		});
		alert.present();
	}

	getCities(name) {
		return new Promise((resolve) => {
			this.http
				.get(
					'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=' +
						name +
						'&types=(cities)&language=en&key=AIzaSyB6xaISf7UKYbFgJUfxCH8MRbMaJw-mxvY'
				)
				.subscribe((result) => {
					resolve(result);
				});
		});
	}

	/**
	 * Method to set total number of post pages in local storage
	 * @author Landry Fongang (mr_madcoder_fil)
	 * @param url Url to retrieve post number
	 */
	getPostPages(url) {
		this.http.get(url).subscribe(
			(result) => {
				var response;
				response = result;
				this.storage.set('post_pages_count', response.pages);
			},
			(error) => {
				// console.log('Error => ', error);
			}
		);
	}
	/**
	 * Method to set total post count
	 * in local storage
	 * @author Landry Fongang (mr_madcoder_fil)
	 * @param url Url to retrieve post number
	 */
	getPostCount(url) {
		this.http.get(url).do((res) => console.log()).subscribe(
			(result) => {
				var response;
				response = result;
				this.storage.set('post_count', response.count_total).then(() => {
					this.events.publish('alloffsnumLoaded');
				});
			},
			(error) => {
				// console.log('Error => ', error);
			}
		);
	}

	/**
	 * @author Landry Fongang (mr_madcoder_fil)
	 * Method to locally load posts 10 by 10 and save in local storage 
	 * @param url Address to retrieve data
	 * @param pages total number of post pages
	 * @param local_post_count Number of post locally loaded already
	 * @param total_count Total Post Count
	 */
	lazyLoadPosts(url, total_count, page) {
		this.storage.set('syncStarted', true);

		return new Promise((resolve, reject) => {
			this.http.get(url + '&page=' + page).subscribe(
				(result) => {
					var response;
					response = result;

					this.storage.get('temp_posts').then((temp_post) => {
						this.storage.get('post_pages_count').then((pages_count) => {
							if (temp_post) {
								var array = [];
								array = temp_post;

								if (page && pages_count) {
									if (page > pages_count) {
										this.storage.set('all_offers', array).then(() => {
											this.storage
												.set('LastSyncDate', moment().format('MMM Do YY, h:mm:ss a'))
												.then(() => {
													this.events.publish('syncDate:Available');
												});
											// this.connstatprov.startSyncTimer();
											this.storage.set('syncStarted', false);
											this.events.publish('autosync:changed', 'empty');
										});
										var local_count = 1;
										this.storage.remove('temp_posts');
										this.storage.set('local_page_count', local_count);
									} else {
										this.storage.set('temp_posts', array.concat(response.posts));
									}
								}
							} else {
								this.storage.set('temp_posts', response.posts);
							}
						});
					});
					resolve(true);
				},
				(error) => {
					//console.log('Error => ', error);
					reject(false);
				}
			);
		});
	}

	/**==========================================================================
	 *	LOAD IMAGE AND UPLOAD TO SERVER
	 * ========================================================================== 
	 */

	/**
	 * Cette fonction permet à un utilisateur 
	 * de prendre une photo à partir de la caméra de l'appareil
	 *
	 **/
	takeOnePicture() {
		return new Promise((resolve, reject) => {
			let options = {
				destinationType: 0,
				sourceType: 0,
				targetWidth: 800,
				targetHeight: 800,
				allowEdit: true,
				correctOrientation: true
			};

			this.camera.getPicture(options).then(
				(data) => {
					resolve(data);
				},
				(error) => {
					//console.log(error);
					reject(error);
				}
			);
		});
	}
	//FIn take only one picture

	/**
	 * This function is used to select more than one pictures
	 * on Device
	 * @author davart
	 * @returns Promise (Array<string> la liste des URIs)
	 */
	openImagePicker() {
		return new Promise((resolve, reject) => {
			this.imagePicker.hasReadPermission().then((result) => {
				if (result == false) {
					// no callbacks required as this opens a popup which returns async
					this.imagePicker.requestReadPermission();
				} else if (result == true) {
					let options = {
						maximumImagesCount: 3,
						quality: 75,
						outputType: 1
					};

					this.imagePicker.getPictures(options).then(
						(results) => {
							resolve(results);
						},
						(err) => {
							reject(err);
						}
					);
				}
			});
		});
	}

	/**
	 * Method to upload an image to wordpress
	 * @author Landry Fongang
	 */
	uploadImageToWordpress(imageString, token) {
		return new Promise((resolve, reject) => {
			this.afServ.retrieveURL((url) => {
				let randomName = 'image_' + Math.random().toString(36).substring(7);

				this.filetransfer
					.create()
					.upload(imageString, url.url + '/wp-json/wp/v2/media', {
						headers: {
							Authorization: 'Bearer ' + token,
							'content-disposition': "attachement; filename='" + randomName + ".png'"
						}
					})
					.then((res) => {
						// console.log('Resolving');
						resolve(res);
					})
					.catch((err) => {
						// console.log('Rejecting');
						reject(err);
					});
			});
		});
	}

	/**===========================================================================
	 * Usefull methods
	 * ===========================================================================
	 */

	/**
	 * @author Foubs
	 * @description Cette methode renvoie la liste de toute les pays du monde
	 */
	getCountries(): Observable<string[]> {
		let url = 'assets/countries.json';
		return this.http.get(url).pipe(map(this.extractData), catchError(this.handleError));
	}

	private extractData(res: Response) {
		let body = res;
		return body || {};
	}

	private handleError(error: Response | any) {
		let errMsg: string;
		if (error instanceof Response) {
			const err = error || '';
			errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
		} else {
			errMsg = error.message ? error.message : error.toString();
		}

		console.error(errMsg);
		return Observable.throw(errMsg);
	}

	/**
   * Cette fonction permet d'effectuer un appel
   * @param phonenumber int
   * (A Executer sur un Smartphone)
   **/
	doCall(phonenumber, txtMessage) {
		if (phonenumber != '') {
			this.callNumber.callNumber(phonenumber, true).then().catch();
		} else {
			this.showMsgWithButton(txtMessage, 'top', 'toast-error');
		}
	}

	/**
 * Cette fonction permet d'envoyer un mail
 * @param adrEmail string
 * @param txtMessage string
 * (A Executer sur un Smartphone)
 **/
	doEmail(adrEmail, txtMessage, sujet?: string, body?: string) {
		if (adrEmail) {
			// add alias
			this.emailComposer.addAlias('gmail', 'com.google.android.gm');

			//Now we know we can send
			let email = {
				app: 'gmail',
				to: adrEmail,
				subject: sujet,
				body: body,
				isHtml: true
			};

			this.emailComposer.open(email).then(() => {
				this.showMsgWithButton(txtMessage, 'top', 'toast-success');
			});
		} else {
			this.showMsgWithButton(txtMessage, 'top', 'toast-error');
		}
	}

	/**
 * Cette fonction permet d'ouvrir un site web
 * @param adrWeb string
 * @param txtMessage string
 * (A Executer sur un Smartphone)
 **/
	doWebsite(adrWeb, txtMessage) {
		if (adrWeb) {
			this.browser.create(adrWeb);
		} else {
			this.showMsgWithButton(txtMessage, 'top', 'toast-error');
		}
	}

	/**
	 * Cette fonction permet d'envoyer
	 * des SMS
	 * @param phonenumber int, le numéro de téléphone du destinataire
	 * @param options any
	 **/
	/* doSMS(phonenumber, options?: any) {
		return new Promise((resolve, reject) => {
			if (!phonenumber) {
			}

			let addModal = this.modalCtrl.create('SmsPage');
			this.loading.create({ content: options.sms_sending });

			//callback when modal is dismissed (recieve data from View)
			addModal.onDidDismiss((data) => {
				if (data) {
					let confirm = this.alertCtrl.create({
						title: '237 Guide Pro',
						message: options.cost_sms,
						buttons: [
							{
								text: options.no,
								handler: () => {
									//console.log('Disagree clicked');
									reject(false);
								}
							},
							{
								text: options.yes,
								handler: () => {
									let message = options.sms_sent;
									this.sms
										.send(phonenumber, data)
										.then((res) => {
											//msgLoading.dismiss();
											this.showMsgWithButton(message, 'top', 'toast-success');
											resolve(true);
										})
										.catch((err) => {
											reject(false);
										});
								}
							}
						]
					});

					confirm.present();
				}
			});

			addModal.present();
		});
	} */

	/**
 * Cette fonction permet de partarger une note
 * ou autres document
 *
 **/
	doShare(message, subject, fichier, url, type) {
		this.socialSharing
			.share(message, subject, fichier, url)
			.then(() => {
				// Sharing via email is possible
			})
			.catch(() => {
				if (type == 'notes') this.showMsgWithButton(this.txtObjet.native.share_note, 'bottom', 'toast-info');
			});
	}

	/**
 * Cette fonction permet de partarger les informations
 * d'un client via the social Networkd
 *
 **/
	doSharePartner(item, type) {
		let message = '',
			subject = type + ': ' + item.name,
			url = '';

		for (var index in item) {
			message += index + ': ' + item[index] + '/n';
		}

		this.socialSharing
			.share(message, subject, null, url)
			.then(() => {
				// Sharing via email is possible
			})
			.catch(() => {
				this.showMsgWithButton(this.txtObjet.native.share_partner, 'bottom');
			});
	}

	/**
 * Cette fonction ouvre la boite de dialogue
 * afin que l'utilisateur puisse évaluer l'application
 * @param android string, le lien vers le Play Store
 * @param ios string, le lien vers l'App Store
 * @param objEvaluate any, l'objet JSON
 */
	doEvaluate(android, objEvaluate, ios?: any) {
		this.appRate.preferences = {
			usesUntilPrompt: 3,
			useLanguage: this.translate.getDefaultLang(),
			displayAppName: '237 Guide Pro',
			storeAppURL: {
				ios: '<app_id>',
				android: 'market://details?id=' + android
			}
		};

		this.appRate.promptForRating(true);
	}

	/***
 * Cette fonction permet d'afficher une alerte
 * en cas de succès d'une action
 * @return AlertController
 *
 **/
	alertSuccess(txtMessage) {
		let msgBox = this.alertCtrl.create({
			title: '237 Guide Pro',
			subTitle: txtMessage,
			cssClass: 'boxAlert-success',
			buttons: [ 'OK' ]
		});

		return msgBox;
	}

	/***
 * Cette fonction permet d'afficher une alerte
 * en cas d'erreur d'une action
 * @return AlertController
 *
 **/
	alertError() {
		let msgBox = this.alertCtrl.create({
			title: 'ONA SMART SALES',
			subTitle: this.txtObjet.native.err_update,
			cssClass: 'boxAlert-danger',
			buttons: [ 'OK' ]
		});

		return msgBox;
	}

	/**
 * Cette fonction permet d'afficher une alerte
 * en personnaliser le texte
 *
 **/
	alertCustomError(message) {
		let msgBox = this.alertCtrl.create({
			title: '237 Guide Pro',
			subTitle: message,
			cssClass: 'boxAlert-danger',
			buttons: [ 'COMPRIS' ]
		});

		return msgBox;
	}

	/***
 * Cette fonction permet d'afficher une alerte
 * en cas d'erreur Internet
 * @return AlertController
 *
 **/
	alertNoInternet() {
		let msgBox = this.alertCtrl.create({
			title: '237 Guide Pro',
			subTitle: this.err_network,
			buttons: [ 'OK' ]
		});

		return msgBox;
	}

	/**
  * Cette fonction permet de 
  * vérifier de faire patienter
  * l'utilisateur lorsqu'il accède à un contenu distant
  **/
	makeUserPatient() {
		let loadBox = this.loading.create({ content: this.txtObjet.login.checking });

		return loadBox;
	}

	/**
  * Cette fonction affiche un message
  * d'erreur d'authentification
  *
  **/
	displayErrorAuth() {
		this.showMsgWithButton(this.txtObjet.login.credentials, 'top', 'toast-error');
	}

	/**
  * Cette fonction affiche un message
  * personnalisé
  *
  **/
	displayCustomMessage(txtMessage) {
		let toast = this.toastCtrl.create({
			message: txtMessage,
			duration: 3000,
			position: 'top'
		});

		toast.present();
	}

	/**
  * Cette fonction affiche un message
  * personnalisé avec button ok
  *
  **/
	showMsgWithButton(txtMessage, position, options?: any) {
		let toast = this.toastCtrl.create({
			message: txtMessage,
			showCloseButton: true,
			closeButtonText: 'OK',
			cssClass: options !== undefined ? options : '',
			duration: 4000,
			position: position
		});
		toast.present();
	}

	//Cette fonction permet de formatter la
	//date au format UTC
	formatUTF(toConvert) {
		var objDate,
			strDate = '',
			mois,
			minutes,
			jour;
		if (toConvert == '') objDate = new Date();
		else objDate = new Date(toConvert);

		if (objDate.getMonth() < 9) mois = '0' + (objDate.getMonth() + 1);
		else mois = objDate.getMonth() + 1;

		if (objDate.getMinutes() < 10) minutes = '0' + objDate.getMinutes();
		else minutes = objDate.getMinutes();

		if (objDate.getDate() < 10) jour = '0' + objDate.getDate();
		else jour = objDate.getDate();

		strDate = objDate.getFullYear() + '-' + mois + '-' + jour + ' ' + objDate.getHours() + ':' + minutes + ':00';

		return strDate;
	}

	/**================================================================================
	 * CREATION / MODIFICATION D UN OBJET WORDPRESS
	 * 
	 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	 */
	//////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////

	/**
	 * Cette fonction permet d'insérer les objets 
	 * dans la bd
	 * @param objet JSONObject, objet à insérer
	 * @param list_objets Array<any>, le tableau d'objet
	 * @param type string
	 */
	insertOfflineData(list_objets, type, namespace) {
		if (list_objets.length == 0) {
			this.autoSyncDatabase();
			this.autoSyncPlaces();
			this.lgServ.removeTo('_ona_add_' + type).then((reponse) => {});
			return;
		} else {
			let index = list_objets.length - 1;
			this.createDataToServer(type, list_objets[index], namespace)
				.then((_data) => {
					if (_data) {
						list_objets.splice(index, 1);
					}

					// alert('after add : ' + list_objets.length);

					this.lgServ.setTableTo('_ona_add_' + type, list_objets).then((_reponse) => {
						this.insertOfflineData(list_objets, type, namespace);
					});
				})
				.catch((error) => {
					this.insertOfflineData(list_objets, type, namespace);
				});
		}
	}
	insertOfflineComments(list_objets) {
		if (list_objets.length == 0) {
			this.lgServ.removeTo('_ona_add_comments').then((reponse) => {});
			return;
		} else {
			let index = list_objets.length - 1;
			this.createCommentToServer(list_objets[index])
				.then((_data: any) => {
					// console.log('Add comment response ', _data);
					if (_data) {
						list_objets.splice(index, 1);
					}
					this.lgServ.setTableTo('_ona_add_comments', list_objets).then((_reponse) => {
						this.insertOfflineComments(list_objets);
					});
				})
				.catch((error) => {
					this.insertOfflineComments(list_objets);
				});
		}
	}
	deleteOfflineComments(list_objets) {
		if (list_objets.length == 0) {
			this.lgServ.removeTo('_ona_delete_comments').then((reponse) => {});
			return;
		} else {
			let index = list_objets.length - 1;
			this.deleteCommentFromServer(list_objets[index])
				.then((_data) => {
					list_objets.splice(index, 1);
					if (_data) {
					}
					this.lgServ.setTableTo('_ona_delete_comments', list_objets).then((_reponse) => {
						this.deleteOfflineComments(list_objets);
					});
				})
				.catch((error) => {
					this.deleteOfflineComments(list_objets);
				});
		}
	}
	updateOfflineComments(list_objets) {
		if (list_objets.length == 0) {
			this.lgServ.removeTo('_ona_update_comments').then((reponse) => {});
			return;
		} else {
			let index = list_objets.length - 1;
			this.updateCommentToServer(list_objets[index])
				.then((_data) => {
					list_objets.splice(index, 1);
					if (_data) {
					}
					this.lgServ.setTableTo('_ona_update_comments', list_objets).then((_reponse) => {
						this.updateOfflineComments(list_objets);
					});
				})
				.catch((error) => {
					this.updateOfflineComments(list_objets);
				});
		}
	}

	/**
	 * Cette fonction permet de mettre à jour les objets 
	 * dans la bd (Serveur)
	 * @param list_objets Array<any>, le tableau d'objet
	 * @param type string
	 */
	updateOfflineData(list_objets, type, namespace) {
		if (list_objets.length == 0) {
			this.autoSyncDatabase();
			this.autoSyncPlaces();
			this.lgServ.removeTo('_ona_update_' + type).then((reponse) => {});
			return;
		} else {
			let index = list_objets.length - 1,
				idObj;
			idObj = list_objets[index].id;
			if (idObj != 0) {
				// console.log('Update data=>', type, idObj, list_objets[index], namespace);
				this.lgServ.isTable('_ona_images_to_add').then((data) => {
					if (data) {
						let imgsList = JSON.parse(data);
						//On effectue la synchronisation de la mise à jour
						this.updateDataToServer(type, idObj, list_objets[index], namespace, imgsList)
							.then((_data) => {
								if (_data) {
									list_objets.splice(index, 1);
								}

								this.lgServ.setTableTo('_ona_update_' + type, list_objets).then((_reponse) => {
									this.updateOfflineData(list_objets, type, namespace);
								});

								//console.log('after update : ' + list_objets.length);
							})
							.catch((error) => {
								this.updateOfflineData(list_objets, type, namespace);
							});
					} else {
						this.updateDataToServer(type, idObj, list_objets[index], namespace)
							.then((_data) => {
								if (_data) {
									list_objets.splice(index, 1);
								}

								this.lgServ.setTableTo('_ona_update_' + type, list_objets).then((_reponse) => {
									this.updateOfflineData(list_objets, type, namespace);
								});

								//console.log('after update : ' + list_objets.length);
							})
							.catch((error) => {
								this.updateOfflineData(list_objets, type, namespace);
							});
					}
				});
			}
		}
	}

	/**
	 * Cette fonction permet de synchroniser l'ajout d'un 
	 * enregistrement à la bd sur Server
	 * @param type string, le nom de l'objet (modèle)
	 *
	 **/
	createObjetSync(type, namespace) {
		//On récupère les les objets tampons à sync avec la bd
		this.lgServ.isTable('_ona_add_' + type).then((data) => {
			if (data) {
				clearInterval(this.autoSync);
				clearInterval(this.bgSyncTimer);
				let list_objets = JSON.parse(data);
				//console.log('before add : ' + list_objets.length);

				this.insertOfflineData(list_objets, type, namespace);
			}
		});
	}
	/**
	 * Cette fonction permet de synchroniser l'ajout d'un 
	 * enregistrement à la bd sur Server
	 * @param type string, le nom de l'objet (modèle)
	 *
	 **/
	createCommentSync() {
		//On récupère les les objets tampons à sync avec la bd
		this.lgServ.isTable('_ona_add_comments').then((data) => {
			if (data) {
				let list_objets = JSON.parse(data);

				this.insertOfflineComments(list_objets);
			}
		});
	}
	deleteCommentSync() {
		//On récupère les les objets tampons à sync avec la bd
		this.lgServ.isTable('_ona_delete_comments').then((data) => {
			if (data) {
				let list_objets = JSON.parse(data);
				//console.log('before add : ' + list_objets.length);

				this.deleteOfflineComments(list_objets);
			}
		});
	}
	/**
	 * Cette fonction permet de synchroniser l'ajout d'un 
	 * enregistrement à la bd sur Server
	 * @param type string, le nom de l'objet (modèle)
	 *
	 **/
	updateCommentSync() {
		//On récupère les les objets tampons à sync avec la bd
		this.lgServ.isTable('_ona_update_comments').then((data) => {
			if (data) {
				let list_objets = JSON.parse(data);
				//console.log('before add : ' + list_objets.length);

				this.updateOfflineComments(list_objets);
			}
		});
	}

	/**
	 * Cette fonction permet de synchroniser la mise à jour d'un 
	 * enregistrement à la bd sur Server
	 * @param type string, le nom de l'objet (modèle)
	 *
	 **/
	updateObjetSync(type, namespace) {
		//On récupère les les objets tampons à sync avec la bd
		this.lgServ.isTable('_ona_update_' + type).then((data) => {
			if (data) {
				clearInterval(this.autoSync);
				clearInterval(this.bgSyncTimer);
				let list_objets = JSON.parse(data),
					idObj;
				//console.log('before update ' + list_objets.length);

				this.updateOfflineData(list_objets, type, namespace);
			}
		});
	}

	/**
	 * Cette fonction permet de vérifier qu'un objet n'est pas
	 * encore synchroniser et il a été modifié, alors on le met
	 * à jour dans la bd
	 *
	 **/
	updateNoSyncObjet(type, data, objet) {
		this.lgServ.isTable('_ona_add_' + type).then((res) => {
			if (res) {
				let liste = JSON.parse(res);
				for (let i = 0; i < liste.length; i++) {
					if (liste[i].idx == objet.idx) {
						liste[i] = data;
						break;
					}
				}
				//On met à jour la table des ajouts
				this.lgServ.setTable('_ona_add_' + type, liste);
			}
		});
	}

	/**
	 * Method to retrieve the different locations of the list of announcements
	 * @param list List of announcements
	 */
	retrieveLocations(list: Array<any>) {
		var ids = [];
		var listLocations = [];
		for (let k = 0; k < list.length; k++) {
			if (list[k]._embedded['wp:term']) {
				for (let j = 0; j < list[k]._embedded['wp:term'][1].length; j++) {
					if (list[k]._embedded['wp:term'][1]) {
						if (listLocations.indexOf(list[k]._embedded['wp:term'][1][j].id) < 0) {
							listLocations.push(list[k]._embedded['wp:term'][1][j].id);
						}
					}
				}
			}
		}

		//console.log('Locations list=>', listLocations);
		return listLocations;
	}
	/**
	 * Method to retrieve the different categories of the list of announcements
	 * @param list List of announcements
	 */
	getCategories(list: Array<any>) {
		// var ids = [];
		var listCategories = [];
		for (let k = 0; k < list.length; k++) {
			if (list[k]._embedded['wp:term']) {
				for (let j = 0; j < list[k]._embedded['wp:term'][0].length; j++) {
					if (list[k]._embedded['wp:term'][0]) {
						if (listCategories.indexOf(list[k]._embedded['wp:term'][0][j].id) < 0) {
							listCategories.push(list[k]._embedded['wp:term'][0][j].id);
						}
					}
				}
			}
		}

		//console.log('Locations list=>', listCategories);
		return listCategories;
	}
	/**
	 * Method to retrieve the different tags of the list of announcements
	 * @param list List of announcements
	 */
	retrieveTags(list: Array<any>) {
		var listTags = [];
		for (let k = 0; k < list.length; k++) {
			if (list[k]._embedded['wp:term']) {
				for (let j = 0; j < list[k]._embedded['wp:term'][2].length; j++) {
					if (list[k]._embedded['wp:term'][2])
						if (list[k]._embedded['wp:term'][2][j]) {
							if (listTags.indexOf(list[k]._embedded['wp:term'][2][j].id) < 0) {
								listTags.push(list[k]._embedded['wp:term'][2][j].id);
							}
						}
				}
			}
		}

		return listTags;
	}

	getLocation(id) {
		return new Promise((resolve) => {
			this.lgServ.isTable('_ona_location').then((data) => {
				if (data) {
					for (let i = 0; i < JSON.parse(data).length; i++) {
						if (JSON.parse(data)[i].id == id) {
							resolve(JSON.parse(data)[i]);
						}
					}
				}
			});
		});
	}

	/**
	 * Method to check if an announcement has images to be uploaded to server
	 * @author mr_madcoder_fil
	 * @param annonceObj Annonce Object
	 * @param list List of images to be added to server during sync
	 */
	checkIfImagesToUpdate(annonceObj, list: Array<any>) {
		for (let i = 0; i < list.length; i++) {
			if ((annonceObj.idx = list[i].post_id)) {
				return list[i];
			} else {
			}
		}
	}

	buildToCreateMeta(annonceObj, pack?) {
		let meta = []; /* 
		for (let k = 0; k < packs.length; k++) {
			if(packs[k].title.rendered == annonceObj.pac)			
		} */
		meta.push({ key: 'et_payment_package', val: pack.line_items[0].name });
		if (annonceObj.Place_customFields.services_lists.length > 0) {
			meta.push({ key: 'Services', val: annonceObj.Place_customFields.services_lists });
		}
		if (annonceObj.Place_customFields.verify == '1') {
			meta.push({ key: 'verify', val: annonceObj.Place_customFields.verify });
		}
		if (annonceObj.Place_customFields.et_phone != '') {
			meta.push({ key: 'et_phone', val: annonceObj.Place_customFields.et_phone });
		}
		if (annonceObj.Place_customFields.et_url != '') {
			meta.push({ key: 'et_url', val: annonceObj.Place_customFields.et_url });
		}
		if (annonceObj.Place_customFields.et_fb_url != '') {
			meta.push({ key: 'et_fb_url', val: annonceObj.Place_customFields.et_fb_url });
		}
		if (annonceObj.Place_customFields.et_google_url != '') {
			meta.push({ key: 'et_google_url', val: annonceObj.Place_customFields.et_google_url });
		}
		if (annonceObj.Place_customFields.et_twitter_url != '') {
			meta.push({ key: 'et_twitter_url', val: annonceObj.Place_customFields.et_twitter_url });
		}
		if (annonceObj.Place_customFields.et_full_location != '') {
			meta.push({ key: 'et_full_location', val: annonceObj.Place_customFields.et_full_location });
		}
		if (annonceObj.Place_customFields.et_location_lat != '') {
			meta.push({ key: 'et_location_lat', val: annonceObj.Place_customFields.et_location_lat });
		}
		if (annonceObj.Place_customFields.et_location_lng != '') {
			meta.push({ key: 'et_location_lng', val: annonceObj.Place_customFields.et_location_lng });
		}
		if (annonceObj.Place_customFields.open_time != '') {
			meta.push({ key: 'open_time', val: annonceObj.Place_customFields.open_time });
		}
		if (annonceObj.Place_customFields.close_time != '') {
			meta.push({ key: 'close_time', val: annonceObj.Place_customFields.close_time });
		}
		if (annonceObj.Place_customFields.serve_day.length > 0) {
			meta.push({ key: 'serve_day', val: annonceObj.Place_customFields.serve_day });
		}
		if (annonceObj.Place_customFields.rating_score != '') {
			meta.push({ key: 'rating_score', val: annonceObj.Place_customFields.rating_score });
		}
		if (annonceObj.Place_customFields.et_claimable == 1) {
			meta.push({ key: 'et_claimable', val: annonceObj.Place_customFields.et_claimable });
		}
		if (annonceObj.Place_customFields.address != '') {
			meta.push({ key: 'address', val: annonceObj.Place_customFields.address });
		}
		if (annonceObj.Place_customFields.et_featured == 1) {
			meta.push({ key: 'et_featured', val: annonceObj.Place_customFields.et_featured });
		}
		if (annonceObj.Place_customFields.et_emailaddress != '') {
			meta.push({ key: 'et_emailaddress', val: annonceObj.Place_customFields.et_emailaddress });
		}

		return meta;
	}

	/**
	 * Cette fonction permet de mettre à jour les données
	 * sur le serveur distant
	 * @param type string, nom de la table
	 * @param idObj Number, numéro d'identifiant de l'objet à mettre à jour
	 * @param objet any, l'objet à mettre à jour
	 * @param namespcae any, le namespace
	 */
	updateDataToServer(type, idObj, objet, namespace, imgsList?: Array<any>) {
		// console.log('Send to server =>', objet);

		return new Promise((resolve, reject) => {
			//On effectue la synchronisation de la mise à jour

			this.lgServ.isTable('wpIonicToken').then((user) => {
				if (user) {
					let token = JSON.parse(user).token;

					/* if (imgsList != undefined) {
						var imgToupload = this.checkIfImagesToUpdate(objet, imgsList);

						if (imgToupload != undefined || imgToupload != null) {
							this.uploadImageToWordpress(imgToupload.imgUrl, token)
								.then(
									(res: any) => {
										// alert('upload success=> ' + JSON.stringify(res));
										resolve(res);
									},
									(er) => {
										// alert('Upload er=> ' + JSON.stringify(er));
										reject(er);
									}
								)
								.catch((imgerr) => {
									// alert('Upload err=> ' + JSON.stringify(imgerr));
									reject(imgerr);
								});
						}
					}
 */
					this.auth
						.validateAuthToken(token)
						.then((success: any) => {
							if (JSON.parse(success).data.status == 200) {
								if (objet.meta == undefined) {
									let headers = new HttpHeaders({
										'Content-Type': 'application/json',
										Authorization: `Bearer ${token}`
									});
									this.http
										.post(
											this.urlServ.url + '/wp-json/' + namespace + '/' + type + '/' + idObj,
											objet,
											{ headers: headers }
										)
										.subscribe(
											(res) => {
												resolve(res);
											},
											(err) => {
												reject(err);
											}
										);
								} else {
									let headers = new HttpHeaders({
										'Content-Type': 'application/json',
										Authorization: `Bearer ${token}`
									});
									this.http
										.post(
											this.urlServ.url + '/wp-json/' + namespace + '/' + type + '/' + idObj,
											objet,
											{ headers: headers }
										)
										.subscribe(
											(res) => {
												this.http
													.post(
														this.urlServ.url +
															'/wp-json/' +
															namespace +
															'/' +
															type +
															'/' +
															idObj +
															'/?ID=' +
															idObj,
														objet.meta,
														{ headers: headers }
													)
													.subscribe(
														(metaRes) => {
															if (metaRes && res) {
																// console.log('Meta res ', metaRes);
																resolve(metaRes);
															}
														},
														(metaErr) => {
															reject(metaErr);
														}
													);
											},
											(err) => {
												reject(err);
											}
										);
								}
							} else {
								// Inform user that token is no more valid and he must login again
							}
						})
						.catch((error) => {
							// alert('error' + error);
							// Inform user that token is no more valid and he must login again
						});
				} else {
					// Request user to login and then add to server
				}
			});

			//End of Update request
		});
	}

	uploadOfflineImageToServer(annonce, token) {
		return new Promise((resolve, reject) => {
			this.lgServ.isTable('_ona_images_to_add').then((data) => {
				if (data) {
					var tab = JSON.parse(data);

					for (let k = 0; k < tab.length; k++) {
						if (tab[k].idx == annonce.idx) {
							this.uploadImageToWordpress(tab[k].imgUrl, token)
								.then(
									(res: any) => {
										// imgloader.dismiss();
										// alert('upload success=> ' + JSON.stringify(res));
										resolve(res);
									},
									(er) => {
										// imgloader.dismiss();

										// alert('Upload er=> ' + JSON.stringify(er));
										reject(er);
									}
								)
								.catch((imgerr) => {
									// imgloader.dismiss();
									// alert('Upload err=> ' + JSON.stringify(imgerr));
									reject(imgerr);
								});
						}
					}
				}
			});
		});
	}

	/**
	 * Method pour check si l'annonce est sur le serveur et le retourner
	 * @param id Id de l'annonce
	 */
	checkAnnonceInServer(id) {
		// console.log('Checking on server');
		return new Promise((resolve, reject) => {
			this.afServ.retrieveURL((objUrl) => {
				this.http.get(objUrl.url + '/wp-json/wp/v2/place/' + id).subscribe(
					(res: any) => {
						//console.log('Found on server', res);
						resolve(res);
					},
					(err) => {
						//console.log('Not found on server');
						reject(err);
					}
				);
			});
		});
	}

	/**
	 * Method to delete an announcement from the internal DB
	 * @param id Annonec ID
	 */
	deleteFromInternalDB(model, id) {
		this.lgServ.isTable('_ona_' + model).then((res) => {
			if (res) {
				let reqs = [];
				reqs = JSON.parse(res);

				for (let j = 0; j < reqs.length; j++) {
					if (reqs[j].id == id) {
						reqs.splice(j, 1);
					}
				}
				if (reqs.length <= 0) {
					this.storage.remove('_ona_' + model);
				} else {
					this.lgServ.setTable('_ona_' + model, reqs);
				}
			}
		});
	}
	/**
	 * Method to delete an announcement from the internal DB
	 * @param id Annonec ID
	 */
	replaceInInternalDB(model, data) {
		this.lgServ.isTable('_ona_' + model).then((res) => {
			let reqs = [];
			reqs = JSON.parse(res);

			for (let j = 0; j < reqs.length; j++) {
				if (reqs[j].id == data.id) {
					reqs[j] = data;
				}
			}
			this.lgServ.setTable('_ona_' + model, reqs);
		});
	}

	createCommentToServer(objet) {
		// console.log('Objet comment ', objet);
		return new Promise((resolve, reject) => {
			if (objet.et_rate) {
				this.http
					.get(
						this.urlServ.url +
							'/wp-json/Comments/All/?comment_post_ID=' +
							objet.comment_post_ID +
							'&comment_author=' +
							objet.comment_author +
							'&comment_content=' +
							objet.comment_content +
							'&User_Id=' +
							objet.User_Id +
							'&et_rate=' +
							objet.et_rate +
							'&comment_author_email=' +
							objet.comment_author_email
					)
					.subscribe(
						(res) => {
							// console.log('res ', res);
							resolve(res);
						},
						(err) => {
							reject(err);
						}
					);
			} else {
				this.http
					.get(
						this.urlServ.url +
							'/wp-json/Comments/All/?comment_post_ID=' +
							objet.comment_post_ID +
							'&comment_author=' +
							objet.comment_author +
							'&comment_content=' +
							objet.comment_content +
							'&User_Id=' +
							objet.User_Id +
							'&comment_author_email=' +
							objet.comment_author_email
					)
					.subscribe(
						(res) => {
							// console.log('res no rate', res);
							resolve(res);
						},
						(err) => {
							reject(err);
						}
					);
			}
		});
	}
	updateCommentToServer(objet) {
		return new Promise((resolve, reject) => {
			this.http
				.get(
					this.urlServ.url +
						'/wp-json/Comments/All/?new_cid=' +
						objet.comment_id +
						'&new_comment=' +
						objet.content
				)
				.subscribe(
					(res) => {
						resolve(res);
					},
					(err) => {
						reject(err);
					}
				);
		});
	}
	deleteCommentFromServer(objet) {
		return new Promise((resolve, reject) => {
			this.http
				.get(this.urlServ.url + '/wp-json/Comments/All/?new_cid=' + objet.comment_id + '&approved=0')
				.subscribe(
					(res) => {
						resolve(res);
					},
					(err) => {
						reject(err);
					}
				);
		});
	}

	/**
	 * Cette fonction permet de créer un objet et le sauvegarder
	 * sur le serveur distant
	 * @param type string, nom de la table
	 * @param objet any, l'objet à mettre à jour
	 */
	createDataToServer(type, objet, namespace) {
		return new Promise((resolve, reject) => {
			//On effectue la synchronisation pour la sauvegarde des data serveur
			var admin_username = 'admin';
			var admin_password = 'MiXwiJ1CE7BEPVehq19Akwc3';

			this.auth.postLogin(admin_username, admin_password, this.urlServ).subscribe(
				(res: any) => {
					// alert('On login to create ' + JSON.stringify(res));
					// alert('image to create '+ objet.img);
					let token = res.token;
					if (type == 'place') {
						this.validateCommand(objet.pack)
							.then((resPack) => {
								// alert('Type is Place');
								this.uploadImageToWordpress(objet.img, token)
									.then((resImg: any) => {
										// alert('On add image success ' + JSON.stringify(resImg.response));
										// alert('image Id ' + JSON.parse(resImg.response).id);

										objet.featured_media = JSON.parse(resImg.response).id;

										this.sendToServer(token, objet, type, namespace).then(
											(result) => {
												// alert('On Create on server ' + JSON.stringify(result));
												resolve(result);
											},
											(err) => {
												// alert('On Error crete on server ' + JSON.stringify(err));
												reject(err);
											}
										);
									})
									.catch((errImg) => {
										// alert('On Error uploading img ' + JSON.stringify(errImg));

										reject(errImg);
									});
							})
							.catch((errPack) => {
								reject(errPack);
							});
					} else if (type != 'place') {
						//Events
						this.uploadImageToWordpress(objet.image, token)
							.then((res_img: any) => {
								// alert("MEDIA => "+res_img.response.id);
								objet.image = JSON.parse(res_img.response).id;
								this.sendToServer(token, objet, type, namespace).then(
									(result) => {
										resolve(result);
									},
									(err) => {
										reject(err);
									}
								);
							})
							.catch((err) => {
								// alert("ERROR => "+err.toString());
								//Aucune image a été associé, une image par défaut sera sélectionné
								this.sendToServer(token, objet, type, namespace).then(
									(result) => {
										resolve(result);
									},
									(err) => {
										reject(err);
									}
								);
							});
					}
				},
				(errConn) => {
					reject(errConn);

					//console.log('Connection error', err);
				}
			);
		});
		//End of Create request
	}

	validateCommand(order) {
		return new Promise((resolve, reject) => {
			var cmdObj = {
				status: 'completed',
				id: order.id
			};
			let headers = new HttpHeaders({
				'Content-Type': 'application/json'
			});

			this.http
				.post(
					this.urlServ.url +
						'/wp-json/wc/v3/orders/' +
						order.id +
						'/?consumer_key=' +
						ApiConfig.consumer_key +
						'&consumer_secret=' +
						ApiConfig.consumer_secret,
					cmdObj,
					{ headers: headers }
				)
				.subscribe(
					(res: any) => {
						resolve(res);
					},
					(err) => {
						reject(err);
					}
				);
		});
	}

	sendToServer(token, objet, type, namespace, imgObj?) {
		return new Promise((resolve, reject) => {
			this.auth
				.validateAuthToken(token)
				.then((success: any) => {
					if (JSON.parse(success).data.status == 200) {
						if (objet.meta != undefined) {
							let headers = new HttpHeaders({
								'Content-Type': 'application/json',
								Authorization: `Bearer ${token}`
							});
							this.http
								.post(this.urlServ.url + '/wp-json/' + namespace + '/' + type, objet, {
									headers: headers
								})
								.subscribe(
									(res: any) => {
										this.http
											.post(
												this.urlServ.url +
													'/wp-json/' +
													namespace +
													'/' +
													type +
													'/' +
													res.id +
													'/?ID=' +
													res.id,
												objet.meta,
												{ headers: headers }
											)
											.subscribe(
												(metaRes) => {
													if (metaRes && res) {
														// console.log('Meta res ', metaRes);
														resolve(metaRes);
													}
												},
												(metaErr) => {
													reject(metaErr);
												}
											);
									},
									(err) => {
										reject(err);
									}
								);
						} else {
							var data = JSON.stringify(objet);

							var xhr = new XMLHttpRequest();

							xhr.addEventListener('readystatechange', function() {
								if (this.readyState === 4) {
									// console.log('Response =>', JSON.parse(this.responseText));
									resolve(JSON.parse(this.responseText));
								}
							});

							let suffix = '';
							if (objet.id != 0) suffix = '/' + objet.id;

							xhr.open('POST', this.urlServ.url + '/wp-json/' + namespace + '/' + type + suffix);
							xhr.setRequestHeader('Content-Type', 'application/json');
							xhr.setRequestHeader('Authorization', 'Bearer ' + token);
							xhr.send(data);
						}
					} else {
						// Inform user that token is no more valid and he must login again
						reject({ error: 3, msg: 'token' });
					}
				})
				.catch((error) => {
					// alert('error' + error);
				});
		});
	}

	/** Cette fonction permet d'enregistrer les requetes d'insertion
	 *  pour chaque objet (modèles)
	 * @param type string, le nom de l'objet
	 *
	 **/
	syncCreateObjet(type, data) {
		this.lgServ.isTable('_ona_add_' + type).then((res) => {
			let reqs = [];
			if (res) {
				reqs = JSON.parse(res);
			}

			reqs.push(data);
			this.lgServ.setTable('_ona_add_' + type, reqs);
		});
	}
	/** Cette fonction permet d'enregistrer les requetes d'insertion
	 *  pour chaque objet (modèles)
	 * @param type string, le nom de l'objet
	 *
	 **/
	syncUpdateObjet(type, data) {
		if (data.id != 0) {
			this.lgServ.isTable('_ona_update_' + type).then((res) => {
				let reqs = [];
				if (res) {
					reqs = JSON.parse(res);
				}

				reqs.push(data);
				this.lgServ.setTable('_ona_update_' + type, reqs);
			});
		}
	}
	/** Cette fonction permet d'enregistrer les requetes d'insertion
	 *  pour chaque objet (modèles)
	 * @param type string, le nom de l'objet
	 *
	 **/
	addReview(type, data) {
		this.lgServ.isTable(type).then((res) => {
			let reqs = [];
			if (res) {
				reqs = JSON.parse(res);
			}

			reqs.push(data);
			this.lgServ.setTable(type, reqs);
		});
	}

	/**
	 * Cette function permmet de mettre a jour un element dans la BD interne
	 * 
	 * @param model Model de donnees a mettre a jour
	 * @param data Le nouvelle objet mise ajour a inserer dans le model de donnee
	 */
	localUpdate(model, data) {
		this.lgServ.isTable('_ona_' + model).then((res) => {
			if (res) {
				let reqs = [];
				reqs = JSON.parse(res);

				for (let j = 0; j < reqs.length; j++) {
					if (reqs[j].id == data.id) {
						reqs[j] = data;
					}
				}
				this.lgServ.setTable('_ona_' + model, reqs);
			}
		});
	}
	/**
	 * Cette function permmet de mettre a jour un element dans la BD interne
	 * 
	 * @param model Model de donnees a mettre a jour
	 * @param data Le nouvelle objet mise ajour a inserer dans le model de donnee
	 */
	localUpdateComments(model, data) {
		this.lgServ.isTable(model).then((res) => {
			let reqs = [];
			reqs = JSON.parse(res);

			for (let j = 0; j < reqs.length; j++) {
				if (reqs[j].content.comment_ID == data.content.comment_ID) {
					reqs[j] = data;
				}
			}
			this.lgServ.setTable(model, reqs);
		});
	}

	updateReview(model, data) {
		this.lgServ.isTable('_ona_' + model).then((res) => {
			let reqs = [];
			reqs = JSON.parse(res);

			for (let j = 0; j < reqs.length; j++) {
				if (reqs[j].object_Id == data.object_Id) {
					reqs[j] = data;
				}
			}
			this.lgServ.setTable('_ona_' + model, reqs);
		});
	}
	deleteReview(model, data) {
		this.lgServ.isTable(model).then((res) => {
			let reqs = [];
			reqs = JSON.parse(res);

			for (let j = 0; j < reqs.length; j++) {
				if (parseInt(data.content.comment_ID) != 0) {
					if (parseInt(reqs[j].content.comment_ID) == parseInt(data.content.comment_ID)) {
						reqs.splice(j, 1);
					}
				} else {
					if (reqs[j].content.idx != undefined) {
						if (parseInt(reqs[j].content.idx) == parseInt(data.content.idx)) {
							reqs.splice(j, 1);
						}
					}
				}
			}
			if (reqs.length <= 0) {
				this.storage.remove(model);
			} else {
				this.lgServ.setTable(model, reqs);
			}
		});
	}

	/**
	 * Cette fonction permet de synchroniser des requêtes spécifique
	 * sur un modèle 
	 * @param type string, le nom de l'objet
	 * @param params any, l'objet à modifier dans la bd interne
	 **/
	updateSyncRequest(type, params) {
		this.lgServ.isTable('_ona_update_' + type).then((res) => {
			let reqs = [];
			if (res) {
				reqs = JSON.parse(res);
			}

			reqs.push(params);
			this.lgServ.setTable('_ona_update_' + type, reqs);
		});
	}

	/**
	 * Cette fonction permet d'insérer les éléments
	 * dans la bd historique
	 * @param type string, le nom du modèle
	 * @param objet JSon, l'objet à insérer
	 *
	 **/
	copiedAddObjet(type, objet) {
		this.lgServ.isTable('_ona_' + type).then((res) => {
			let reqs = [],
				trouve = true;
			if (res) reqs = JSON.parse(res);

			if (reqs.length == 0) reqs.push(objet);
			else {
				for (let i = 0; i < reqs.length; i++) {
					if (reqs[i].id == objet.id) {
						trouve = false;
						break;
					}
				}

				if (trouve) reqs.push(objet);
			}

			this.lgServ.setTable('_ona_' + type, reqs);
		});
	}

	/**
	 * Cette fonction permet d'ajouter un élément
	 * dans la bd interne
	 * @param type string, le nom du modèle
	 * @param objet JSon, l'objet à insérer
	 *
	 **/
	copiedAddSync(type, objet) {
		this.lgServ.isTable('_ona_' + type).then((res) => {
			let reqs = [];
			if (res) {
				reqs = JSON.parse(res);
			}

			reqs.unshift(objet);
			this.lgServ.setTableTo('_ona_' + type, reqs).then((_resp) => {
				if (_resp) {
					if (type == 'place') {
						this.events.publish('annonce:added', objet);
						this.addTotalCount();
					}
				}
			});
		});
	}

	/**
	 * 
	 * @param type type of idx
	 * @param idx idx of the elemnt to delete 
	 */
	idxToDel(type, idx) {
		this.lgServ.isTable('_ona_' + type).then((res) => {
			let reqs = [];
			if (res) {
				reqs = JSON.parse(res);
			}

			reqs.push(idx);
			this.lgServ.setTableTo('_ona_' + type, reqs);
		});
	}

	/**
	 * Cette fonction permet de retirer un élément
	 * dans la bd interne
	 * @param type string, le nom du modèle
	 * @param objet JSon, l'objet à supprimer
	 *
	 **/
	removeObjetSync(type, objet) {
		this.lgServ.isTable('_ona_' + type).then((res) => {
			let reqs = [];

			if (res) {
				reqs = JSON.parse(res);
				for (let j = 0; j < reqs.length; j++) {
					if (reqs[j].id == objet.id) {
						reqs.splice(j, 1);
						break;
					}
				}

				this.lgServ.setTable('_ona_' + type, reqs);
			}
		});
	}

	/**
	 * @author mr_madcoder_fil
	 * Fucntion to check the number of times a post have been rated
	 * @param list List of all comments
	 */
	timesRated(list: Array<any>) {
		var times = 0;
		for (let k = 0; k < list.length; k++) {
			if (
				list[k].comment_rating != '' ||
				(list[k].comment_rating != null && list[k].comment_rating != undefined)
			) {
				if (parseInt(list[k].comment_rating) > 0) {
					times++;
				}
			}
		}
		return times;
	}

	/**
 * @author mr_madcoder_fil
 * Function to get gthe comment rated by a user
 * @param list List of comments
 */
	getRatedComment(list: Array<any>) {
		for (let k = 0; k < list.length; k++) {
			if (list[k].comment_rating) {
				if (parseFloat(list[k].comment_rating) > 0) {
					// return true;
					return list[k];
				} else {
				}
			} else {
			}
		}
	}

	resetListFilters(list: Array<any>, item) {
		for (let i = 0; i < list.length; i++) {
			if (list[i].slug == item.slug) {
				list.splice(i, 1);
			}
		}
		// console.log('List Filters ', list);
	}

	/**
 * @author mr_madcoder_fil
 * Function to check if a user has already rated an annonce
 * @param list List of comments
 */
	isUserRated(list: Array<any>, conn_user) {
		let cpt = 0;
		for (let k = 0; k < list.length; k++) {
			if (list[k].comment_rating != '' && conn_user != undefined) {
				if (parseInt(list[k].comment_rating) > 0 && parseInt(list[k].content.user_id) == conn_user.user.ID) {
					// return true;
					cpt++;
				} else {
				}
			} else {
			}
		}
		if (cpt > 0) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Cette méthode permet de créer/Editer
	 * un lieu d'événement ou un organisateur
	 * @param objet any, il s'agit de l'objet à insérer ou modifier (Venue ou Organizer)
	 * @param namespace string, le modèle sur lequel appliquer la requete
	 * @author davart
	 * 
	 * @returns Observable
	 */
	public modelsIdPost(
		objet: any,
		namespace: string,
		pattern: string,
		token: string,
		observe: any = 'body',
		reportProgress: boolean = false
	): Observable<any> {
		if (objet.id === null || objet.id === undefined) {
			throw new Error('Required parameter id was null or undefined when calling venuesIdPost.');
		}

		let basePath = this.urlServ.url + '/wp-json/' + pattern;
		let defaultHeaders = new HttpHeaders({
			// 'Authorization': 'Auth_Token',
			// 'RequestToken': token
			Authorization: token
		});
		let configuration = new Configuration();

		let headers = defaultHeaders;

		// to determine the Accept header
		let httpHeaderAccepts: string[] = [ 'application/json' ];
		let httpHeaderAcceptSelected: string | undefined = configuration.selectHeaderAccept(httpHeaderAccepts);
		if (httpHeaderAcceptSelected != undefined) {
			headers = headers.set('Accept', httpHeaderAcceptSelected);
		}

		configuration.selectHeaderAccept(httpHeaderAccepts);
		// headers.set("Authorization", 'Auth_Token');
		// headers.set("RequestToken", token);

		// to determine the Content-Type header
		let consumes: string[] = [ 'application/x-www-form-urlencoded' ];

		this.canConsumeForm(consumes);

		let formParams: { append(param: string, value: any) };
		let useForm = false;
		let convertFormParamsToString = false;
		if (useForm) {
			formParams = new FormData();
		} else {
			formParams = new HttpParams({ encoder: new CustomHttpUrlEncodingCodec() });
		}

		for (var key in objet) {
			if (objet[key] !== undefined && !Array.isArray(objet[key])) {
				formParams = formParams.append(key, <any>objet[key]) || formParams;
			} else if (objet[key] !== undefined && Array.isArray(objet[key])) {
				objet[key].forEach((element) => {
					formParams = formParams.append(key, <any>element) || formParams;
				});
			}
		}

		if (objet.id == 0) formParams = formParams.append('status', <any>'draft') || formParams;

		let suffix = '';
		if (objet.id != 0) suffix = encodeURIComponent(String(objet.id));

		return this.http.post(
			`${basePath}/${namespace}/${suffix}`,
			convertFormParamsToString ? formParams.toString() : formParams,
			{
				withCredentials: configuration.withCredentials,
				headers: headers,
				observe: observe,
				reportProgress: reportProgress
			}
		);
	}

	/**
     * @param consumes string[] mime-types
     * @return true: consumes contains 'multipart/form-data', false: otherwise
     */
	private canConsumeForm(consumes: string[]): boolean {
		const form = 'multipart/form-data';
		for (let consume of consumes) {
			if (form === consume) {
				return true;
			}
		}
		return false;
	}

	/***
	 * ===================================================================================
	 * 	END OF CREATION UPDATE OF WP OBJECT
	 * ===================================================================================
	 */

	/**=======================================================================
	 * APPEL DU SERVICE PAYCONIQ
	 * 
	 * ======================================================================
	 **/

	/**
	 * Cette méthode permet de faire appel à l'api Payconiq
	 * 
	 * @param objets any, l'objet à envoyer
	 * @param cred string, credentials
	 * @param basePath string, l'url api payconiq
	 * 
	 * @returns Observable
	 */
	callPayConiq(
		objets: any,
		cred: string,
		basePath: string,
		observe: any = 'body',
		reportProgress: boolean = false
	): Observable<any> {
		let defaultHeaders = new HttpHeaders({
			Authorization: cred
		});

		let configuration = new Configuration();
		let headers = defaultHeaders;

		// to determine the Accept header
		let httpHeaderAccepts: string[] = [ 'application/json' ];

		let httpHeaderAcceptSelected: string | undefined = configuration.selectHeaderAccept(httpHeaderAccepts);
		if (httpHeaderAcceptSelected != undefined) {
			headers = headers.set('Accept', httpHeaderAcceptSelected);
		}

		// to determine the Content-Type header
		let consumes: string[] = [ 'application/x-www-form-urlencoded' ];

		this.canConsumeForm(consumes);

		let formParams: { append(param: string, value: any) };
		let useForm = false;
		let convertFormParamsToString = false;
		if (useForm) {
			formParams = new FormData();
		} else {
			formParams = new HttpParams({ encoder: new CustomHttpUrlEncodingCodec() });
		}

		if (objets.price !== undefined) {
			formParams = formParams.append('amount', <any>objets.price) || formParams;
		}
		if (objets.currency !== undefined) {
			formParams = formParams.append('currency', <any>objets.currency) || formParams;
		}
		if (objets.description !== undefined) {
			formParams = formParams.append('description', <any>objets.description) || formParams;
		}

		return this.http.post(basePath, convertFormParamsToString ? formParams.toString() : formParams, {
			withCredentials: configuration.withCredentials,
			headers: headers,
			observe: observe,
			reportProgress: reportProgress
		});
	}

	/**
	 * Cette méthode permet de récupérer une 
	 * le statut d'une transaction
	 * 
	 * @param transactionId string, l'identifiant de la transaction
	 * @param cred string, credentials
	 * @param basePath string, l'url api payconiq
	 * 
	 * @returns Observable
	 */
	getPayConiq(transactionId: string, cred: string, basePath: string): Observable<any> {
		let defaultHeaders = new HttpHeaders({
			Authorization: cred,
			'Cache-Control': 'no-cache'
		});

		let headers = defaultHeaders;

		return this.http.get(basePath + '/' + transactionId, { headers: headers });
	}

	/**
	 * *****************************************************************
	 *           METHOD TO RESERVE OR BOOK AN ANNOUNCEMENT
	 * ****************************************************************
	 * @param annonce Objet de type annonce
	 */
	reserver(annonce, txtPop) {
		this.modelUsers = 'users';

		let user = annonce._embedded.author[0];

		let menu_actionSheet = this.actionCtrl.create({
			title: txtPop.rdv + ' ' + annonce.title.rendered,
			buttons: this.getListButtons(annonce, user)
		});

		if (this.getListButtons(annonce, user).length > 0) {
			menu_actionSheet.present();
		} else {
			this.showMsgWithButton('Info de contact pas disponible', 'top', 'toast-info');
		}
	}

	/**
   * Cette fonction permet de définir la liste
   * des actions sur la vue
   */
	private getListButtons(annonce, user) {
		// console.log('User send ', user);
		let tab = [];
		if (annonce.Place_customFields.et_phone && annonce.Place_customFields.et_phone != '')
			tab.push({
				text: 'Appeler',
				icon: 'ios-call',
				handler: () => {
					if (annonce.Place_customFields.et_phone != '') {
						this.callNumber
							.callNumber(annonce.Place_customFields.et_phone, true)
							.then(() => {
								var rdv = {
									date: new Date(),
									description: 'Appel ' + annonce.title.rendered + ' pour rendez-vous',
									user: user,
									annonce_data: annonce
								};
								this.lgServ.isTable('_ona_rdvs').then((rdvs) => {
									if (rdvs) {
										let rdvsList = [];
										rdvsList = JSON.parse(rdvs);
										rdvsList.push(rdv);
										this.lgServ.setTable('_ona_rdvs', rdvsList);
									} else {
										let rdvsList = [];
										rdvsList.push(rdv);
										this.lgServ.setTable('_ona_rdvs', rdvsList);
									}
								});
							})
							.catch((err) => {
								// console.log('Error ', err);
							});
					} else {
						this.showMsgWithButton(
							"Numero de téléphone de l'annonceur pas disponible",
							'top',
							'toast-error'
						);
					}
				}
			});

		if (annonce.Place_customFields.et_phone && annonce.Place_customFields.et_phone != '')
			tab.push({
				text: 'Whatsapp',
				icon: 'logo-whatsapp',
				handler: () => {
					if (annonce.Place_customFields.et_phone != '') {
						this.inapp.create(
							'https://api.whatsapp.com/send?phone=' + annonce.Place_customFields.et_phone,
							'_system'
						);
					} else {
						this.showMsgWithButton("Numero whatsapp de l'annonceur pas disponible", 'top', 'toast-error');
					}
				}
			});

		if (annonce.Place_customFields.et_phone && annonce.Place_customFields.et_phone != '')
			tab.push({
				text: 'SMS',
				icon: 'ios-chatboxes',
				handler: () => {
					let options: SmsOptions;
					options = {
						replaceLineBreaks: true,
						android: {
							intent: 'INTENT'
						}
					};
					this.sms
						.send(
							annonce.Place_customFields.et_phone,
							'Mr / Mme ' +
								user.name +
								' je suis intéressé par votre annonce ' +
								annonce.title.rendered +
								'\n\n Mon message: ',
							options
						)
						.then(() => {
							var rdv = {
								date: new Date(),
								description: 'Sms envoyer a ' + annonce.title.rendered + ' pour rendez-vous',
								user: user,
								annonce_data: annonce
							};
							this.lgServ.isTable('_ona_rdvs').then((rdvs) => {
								if (rdvs) {
									let rdvsList = [];
									rdvsList = JSON.parse(rdvs);
									rdvsList.push(rdv);
									this.lgServ.setTable('_ona_rdvs', rdvsList);
								} else {
									let rdvsList = [];
									rdvsList.push(rdv);
									this.lgServ.setTable('_ona_rdvs', rdvsList);
								}
							});
						})
						.catch((err) => {
							// console.log('Error ', err);
						});
				}
			});

		if (user.user_email && user.user_email != '')
			tab.push({
				text: 'Envoyer un Mail',
				icon: 'md-mail',
				handler: () => {
					let popover = this.modalCtrl.create('descpopover', { params: annonce, slug: 'rdv' });

					popover.present();

					popover.onDidDismiss((rdv) => {
						if (rdv) {
							this.doEmail(
								user.user_email,
								'Rendez-vous demandez avec success ' + annonce.title.rendered,
								'Demande de rendez-vous',
								this.buildMessage(rdv)
							);
						}
					});
				}
			});

		return tab;
	}

	checkIfOwner(list: Array<any>) {
		this.storage.get('wpIonicToken').then((user) => {
			if (user) {
				var user = JSON.parse(user);
				for (let k = 0; k < list.length; k++) {
					if (
						user.user.ID == list[k].author ||
						user.user.roles.indexOf('administrator') > -1 ||
						user.user.roles.indexOf('editor') > -1
					) {
						list[k].owner = true;
					}
				}
			}
		});
	}

	calcCompletion(list: Array<any>) {
		for (let k = 0; k < list.length; k++) {
			var ObjPts = 0;
			var emptyFields = [];
			list[k].entries = Object.keys(list[k]).length;
			if (list[k].title.rendered != '') {
				ObjPts = ObjPts + 5;
			} else {
				emptyFields.push({ name: 'title' });
			}
			if (list[k].content.rendered != '') {
				ObjPts = ObjPts + 5;
			} else {
				emptyFields.push({ name: 'description' });
			}
			if (list[k].place_category.length > 0) {
				ObjPts = ObjPts + 2;
			} else {
				emptyFields.push({ name: 'Category' });
			}
			if (list[k].location.length > 0) {
				ObjPts = ObjPts + 5;
			} else {
				emptyFields.push({ name: 'Location' });
			}
			if (list[k]._embedded['wp:featuredmedia']) {
				if (list[k]._embedded['wp:featuredmedia'][0]) {
					if (list[k]._embedded['wp:featuredmedia'][0].source_url != '') {
						ObjPts = ObjPts + 5;
					} else {
						emptyFields.push({ name: 'Image' });
					}
				} else {
					emptyFields.push({ name: 'Image' });
				}
			} else {
				emptyFields.push({ name: 'Image' });
			}
			if (list[k].Place_customFields.et_fb_url != '') {
				ObjPts = ObjPts + 1;
			} else {
				emptyFields.push({ name: 'Facebook Addresse' });
			}
			if (list[k].Place_customFields.et_twitter_url != '') {
				ObjPts = ObjPts + 1;
			} else {
				emptyFields.push({ name: 'Twitter Addresse' });
			}
			if (list[k].Place_customFields.et_phone != '') {
				ObjPts = ObjPts + 5;
			} else {
				emptyFields.push({ name: 'Phone' });
			}
			if (
				list[k].Place_customFields.et_emailaddress != '' &&
				list[k].Place_customFields.et_emailaddress != null
			) {
				ObjPts = ObjPts + 3;
			} else {
				emptyFields.push({ name: 'Email Adresse' });
			}
			if (list[k].Place_customFields.et_url != '') {
				ObjPts = ObjPts + 1;
			} else {
				emptyFields.push({ name: 'Site Web' });
			}
			if (list[k].Place_customFields.close_time != '' || list[k].Place_customFields.open_time != '') {
				ObjPts = ObjPts + 5;
			} else {
				emptyFields.push({ name: "Heures D'ouverture" });
			}
			if (list[k].Place_customFields.et_location_lng != '' && list[k].Place_customFields.et_location_lat != '') {
				ObjPts = ObjPts + 2;
			} else {
				emptyFields.push({ name: 'Latitude / Longitude' });
			}
			if (list[k].Place_customFields.et_full_location != '') {
				ObjPts = ObjPts + 5;
			} else {
				emptyFields.push({ name: 'Addresse' });
			}
			if (list[k].Place_customFields.services_lists != '') {
				ObjPts = ObjPts + 3;
			} else {
				emptyFields.push({ name: 'Services' });
			}
			list[k].completion = ObjPts / ServicesConfig.services_points * 100;
			list[k].emptyFields = emptyFields;
		}
	}

	//Construire le message
	private buildMessage(data) {
		let html = '';
		html +=
			'Mr / Mme' +
			data.user.user_display_name +
			' est intéressé(e) par : ' +
			data.annonce_data.title.rendered +
			'<br>';
		html += 'Son message : ' + data.description + '<br><br>';
		html += 'Date de rendez-vous souhaiter : ' + new Date(data.date) + '<br>';

		return html;
	}

	/**
	 * ***********************************************
	 * METHOD TO CHECK GPS ACTIVATE ON DEVICE
	 * ***********************************************
	 * errorMessage
	 */

	checkGps(errorMessage) {
		this.diagnostic
			.isGpsLocationEnabled()
			.then((isAva) => {
				if (isAva) {
					this.geolocation
						.getCurrentPosition()
						.then((position) => {
							//console.log('Actual Position =>', position);
							var coords = {
								latitude: position.coords.latitude,
								longitude: position.coords.longitude
							};
							this.lgServ.setTable('_ona_lastPosition', coords);
						})
						.catch((error) => {});
				} else {
					this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
						() => {
							// alert("");
							this.geolocation
								.getCurrentPosition()
								.then((position) => {
									var coords = {
										latitude: position.coords.latitude,
										longitude: position.coords.longitude
									};
									this.lgServ.setTable('_ona_lastPosition', coords);
								})
								.catch((error) => {
									//console.log('Error', error);
								});
						},
						(err) => {
							this.showMsgWithButton(errorMessage, 'bottom', 'toast-info');
							//console.log('Error Requesting permission=>' + err);
						}
					);
				}
			})
			.catch((err) => {});
	}

	/**
	 * ***************************************************************************
	 * METHOD TO CALCULATE DISTANCE FROM AN OFFER TO THE CURRENT USER LOCATION
	 * ***************************************************************************
	 */
	calcDistance(lat1, lon1, lat2, lon2, unit) {
		var radlat1 = Math.PI * lat1 / 180;
		var radlat2 = Math.PI * lat2 / 180;
		var theta = lon1 - lon2;
		var radtheta = Math.PI * theta / 180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		dist = Math.acos(dist);
		dist = dist * 180 / Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit == 'K') {
			dist = dist * 1.609344;
		}
		if (unit == 'N') {
			dist = dist * 0.8684;
		}
		// console.log('Calculated Distance', dist);
		return dist;
	}

	applyFilterAnnonce(searchs, objet) {
		var searchList = [];

		for (let j = 0; j < searchs.length; j++) {
			if (searchs[j].slug != 'popular' && searchs[j].slug != 'views' && searchs[j].slug != 'comments') {
				searchList.push(searchs[j]);
			}
		}

		let cpt = 0;

		for (let j = 0; j < searchList.length; j++) {
			switch (searchList[j].slug) {
				case 'tags': {
					//tag

					var tags = [];
					tags = objet.place_tag;
					for (let k = 0; k < searchList[j].val.length; k++) {
						if (tags.indexOf(searchList[j].val[k]) > -1) {
							cpt++;
						}
					}

					// cpt++;
					break;
				}
				case 'amount': {
					//Prix
					/* if (
						parseInt(objet.webbupointfinder_item_field_priceforsale) >= searchList[j].val.lower * 10000 &&
						parseInt(objet.webbupointfinder_item_field_priceforsale) <= searchList[j].val.upper * 10000
					) {
						console.log('Annonce=>', objet);
						cpt++;
					} */
					cpt++;
					break;
				}
				case 'me': {
					// Mes Annonces
					if (objet.author == this.currentUser.user.ID) {
						cpt++;
					}
					break;
				}
				case 'create_date': {
					// Mes Annonces
					var date = objet.date.split('T')[0];
					if (date == searchList[j].val) {
						cpt++;
					}
					break;
				}
				case 'today': {
					// Mes Annonces
					var today = moment().format('YYYY-MM-DD');
					var obj_date = objet.date.split('T')[0];
					if (today == obj_date) {
						cpt++;
					}
					break;
				}
				case 'distance': {
					//Distance near you
					// var annonceCoords = objet.webbupointfinder_items_location.split(',');
					var distance = this.calcDistance(
						searchList[j].coords.latitude,
						searchList[j].coords.longitude,
						parseFloat(objet.Place_customFields.et_location_lat),
						parseFloat(objet.Place_customFields.et_location_lng),
						'K'
					);

					if (distance <= searchList[j].val) {
						objet.distFrom = distance.toFixed(2) + 'km';
						cpt++;
					}
					break;
				}
				case 'feat': {
					//Near me
					if (objet.Place_customFields.et_featured == '1') {
						cpt++;
					}
					break;
				}
				case 'verif': {
					//Views
					if (objet.Place_customFields.verify != undefined) {
						if (objet.Place_customFields.verify == '1') cpt++;
					}
					break;
				}
				case 'location': {
					//Location

					var locations = [];
					locations = objet.location;

					if (locations.indexOf(searchList[j].val) > -1) {
						cpt++;
					}
					break;
				}
				case 'category': {
					//Location

					var categories = [];
					categories = objet.place_category;

					if (categories.indexOf(searchList[j].val) > -1) {
						cpt++;
					}
					break;
				}
				case 'dispo': {
					//Available

					if (this.lgServ.isOpen(objet.Place_customFields) == true) {
						cpt++;
					}

					break;
				}
				case 'date': {
					cpt++;
					break;
				}
				case 'all': {
					cpt++;
					break;
				}
			}
		} //Fin tab searchList

		if (cpt == searchList.length) return true;
		else return false;
	}

	// Function that compares if a time is between a time interval
	checkIfOpen(beforeTime, afterTime) {
		var format = 'hh:mm';

		// var time = moment() gives you current time. no format required.
		var hour = moment(this.presentHour, format);
		var before = moment(beforeTime, format);
		var after = moment(afterTime, format);

		if (hour.isBetween(before, after)) {
			// console.log('is between');
			return true;
		} else {
			// console.log('is not between');
			return false;
		}
	}

	showDir(annonce) {
		this.events.publish('showdirection:annonce', annonce);
	}

	sortByFilters(filters, list: Array<any>) {
		var tab = [];
		for (let k = 0; k < filters.length; k++) {
			tab.push(filters[k].slug);
		}
		if (tab.indexOf('popular') > -1 && tab.indexOf('views') == -1 && tab.indexOf('comments') == -1) {
			list.sort(function(a, b) {
				return parseFloat(b.Place_customFields.rating_score) - parseFloat(a.Place_customFields.rating_score);
			});
		}
		if (tab.indexOf('popular') == -1 && tab.indexOf('views') > -1 && tab.indexOf('comments') == -1) {
			// console.log('Sorting by views');
			list.sort(function(a, b) {
				return parseInt(b.Place_customFields.view_count) - parseInt(a.Place_customFields.view_count);
			});
		}
		if (tab.indexOf('popular') == -1 && tab.indexOf('views') == -1 && tab.indexOf('comments') > -1) {
			// console.log('Sorting by comments');
			list.sort(function(a, b) {
				if (a.comments && b.comments) {
					return b.comments.length - a.comments.length;
				}
			});
		}
		if (tab.indexOf('popular') > -1 && tab.indexOf('views') == -1 && tab.indexOf('comments') > -1) {
			list.sort(function(a, b) {
				return parseFloat(b.Place_customFields.rating_score) - parseFloat(a.Place_customFields.rating_score);
			});
			list.sort(function(a, b) {
				if (a.comments && b.comments) {
					return b.comments.length - a.comments.length;
				}
			});
		}
		if (tab.indexOf('popular') > -1 && tab.indexOf('views') > -1 && tab.indexOf('comments') == -1) {
			list.sort(function(a, b) {
				return parseFloat(b.Place_customFields.rating_score) - parseFloat(a.Place_customFields.rating_score);
			});
			list.sort(function(a, b) {
				return parseInt(b.Place_customFields.view_count) - parseInt(a.Place_customFields.view_count);
			});
		}
		if (tab.indexOf('popular') == -1 && tab.indexOf('views') > -1 && tab.indexOf('comments') > -1) {
			list.sort(function(a, b) {
				return parseInt(b.Place_customFields.view_count) - parseInt(a.Place_customFields.view_count);
			});
			list.sort(function(a, b) {
				if (a.comments && b.comments) {
					return b.comments.length - a.comments.length;
				}
			});
		}
		if (tab.indexOf('popular') > -1 && tab.indexOf('views') > -1 && tab.indexOf('comments') > -1) {
			list.sort(function(a, b) {
				return parseInt(b.Place_customFields.view_count) - parseInt(a.Place_customFields.view_count);
			});
			list.sort(function(a, b) {
				if (a.comments && b.comments) {
					return b.comments.length - a.comments.length;
				}
			});
			list.sort(function(a, b) {
				return parseFloat(b.Place_customFields.rating_score) - parseFloat(a.Place_customFields.rating_score);
			});
		}
		return list;
	}

	getAuthorInfo(annonce) {
		return new Promise((resolve) => {
			this.lgServ.isTable('_ona_' + this.modelUsers).then((data) => {
				var users = [];
				var usersIdsArray = [];
				users = JSON.parse(data);

				//console.log('Users =>', users);

				for (let j = 0; j < users.length; j++) {
					usersIdsArray.push(users[j].id);
				}

				if (usersIdsArray.indexOf(annonce.author) > -1) {
					resolve(users[usersIdsArray.indexOf(annonce.author)]);
				}
			});
		});
	}

	retrievePacks() {
		this.afServ.retrieveURL((objUrl) => {
			this.http.get(objUrl.url + '/wp-json/pfplacepacks/v1/placePacks/').subscribe((res: any) => {
				this.lgServ.setTable('_ona_packs', res);
			});
		});
	}
	retrieveReviews() {
		this.afServ.retrieveURL((objUrl) => {
			this.http.get(objUrl.url + '/wp-json/pfplaceReview/ReviewByusers').subscribe((res: any) => {
				this.lgServ.isTable('_ona_reviews').then((data) => {
					if (!data) {
						var comms = [];
						if (res.length > 0) {
							for (let k = 0; k < res.length; k++) {
								comms = comms.concat(res[k].Comments);
							}
							this.lgServ.setTable('_ona_comms', comms);
						}
						this.lgServ.setTable('_ona_reviews', res);
					}
				});
			});
		});
	}

	/**
	 * Function to offline set images to add on server and the post to associate to them
	 * @param idx Id of offline post created
	 * @param imgUrl Url of image to create and associate to POST in base64
	 */
	addImageToSync(idx, imgUrl) {
		this.lgServ.isTable('_ona_images_to_add').then((data) => {
			if (data) {
				var table = [];
				table = JSON.parse(data);

				let obj = {
					post_id: idx,
					imgUrl: imgUrl
				};

				table.push(obj);

				this.lgServ.setTable('_ona_images_to_add', table);
			} else {
				var table = [];
				let obj = {
					post_id: idx,
					imgUrl: imgUrl
				};

				table.push(obj);

				this.lgServ.setTable('_ona_images_to_add', table);
			}
		});
	}

	genColor() {
		return (
			'rgb(' +
			Math.floor(Math.random() * 256) +
			',' +
			Math.floor(Math.random() * 256) +
			',' +
			Math.floor(Math.random() * 256) +
			')'
		);
	}

	/**
	 * Cette fonction permet de modifier un élément
	 * dans la bd interne
	 * @param type string, le nom du modèle
	 * @param objet JSon, l'objet à insérer
	 *
	 **/
	copieModifSync(type, objet) {
		this.lgServ.isTable('_ona_' + type).then((res) => {
			let reqs = [];
			if (res) {
				reqs = JSON.parse(res);
			}

			for (let k = 0; k < reqs.length; k++) {
				if (reqs[k].id == objet.id) {
					reqs[k] = objet;
				}
			}
			this.lgServ.setTableTo('_ona_' + type, reqs).then((_resp) => {
				if (_resp) {
					if (type == 'place') {
						this.events.publish('annonce:modified', objet);
					}
				}
			});
		});
	}

	postDataBill(credentials, type) {
		return new Promise((resolve, reject) => {
			this.afServ.retrieveLocalURL((res) => {
				let headers = new HttpHeaders();
				this.http.post(res.url + type, JSON.stringify(credentials), { headers: headers }).subscribe(
					(res) => {
						// console.log(res);
						resolve(res);
					},
					(err) => {
						reject(err);
					}
				);
			});
		});
	}

	getApi() {
		return new Promise((resolve, reject) => {
			this.presentLoading('Données du serveur en cours...');
			this.afServ.retrieveLocalURL((res) => {
				this.http.get(res.url + 'Masterdata.php').subscribe(
					(cont) => {
						this.data_server = cont;
						resolve(cont);
						this.loginloader.dismiss();
					},
					(err) => {
						if (err) {
							swal('smobilPay indisponible', "Une erreur s'est produite.", 'error').then(() => {
								this.loginloader.dismiss();
							});
						}
						reject(err);
					}
				);
				// }
			});
		});
	}

	getComments(annonce) {
		return new Promise((resolve, reject) => {
			this.lgServ.isTable('allcomments').then((data) => {
				if (data) {
					var allcomments = JSON.parse(data);

					var comms = [];

					for (let k = 0; k < allcomments.length; k++) {
						if (parseInt(allcomments[k].content.comment_post_ID) == annonce.id) {
							comms.unshift(allcomments[k]);
						}
					}

					annonce.comments = comms;
				} else {
					annonce.comments = [];
				}
				resolve(annonce);
			});
		});
	}

	makeorder(data) {
		let url =
			this.urlServ.url +
			ApiConfig.url_orders +
			'?consumer_key=' +
			ApiConfig.consumer_key +
			'&consumer_secret=' +
			ApiConfig.consumer_secret;

		return this.http.post(url, data);
	}

	/**
		 * @description Cette fonction permet de recuperer la liste des services disponible de type CASHIN
		 * @author Foubia
		  * @param merchantResult
	 */

	MTNMOMO() {
		return new Promise((resolve, reject) => {
			this.getApi()
				.then((_res) => {
					this.afServ.retrieveLocalURL((_url) => {
						this.presentLoading('Chargement des données smobilPay...');
						this.http.get('assets/countries.json').map((res: any) => res).subscribe((_data: any) => {
							this.http
								.get(_url.url + 'getServices.php')
								.map((table: any) => table)
								.subscribe((services) => {
									if (this.data_server.error) {
										this.loginloader.dismiss();
										swal(
											'Problème de connexion',
											"Une erreur s'est produite du à une interruption de la connexion.",
											'warning'
										).then(() => {});
									} else {
										var tabServices = services.Liste_services;
										var resultServices = [];
										var moneyTransferArray = [];

										for (var i = 0; i < this.data_server.array.length; i++) {
											var compare1 = this.data_server.array[i].merchant;
											let merchant = this.data_server.array[i];
											for (var h = 0; h < tabServices.length; h++) {
												var compare2 = tabServices[h].merchant;
												var typeService = tabServices[h].type;
												var service = tabServices[h];
												var countryService = tabServices[h].country;
												for (let g = 0; g < _data.length; g++) {
													if (
														service.country == merchant.country &&
														service.serviceid == 20051
													) {
														var logoService =
															'https://core.dev.smobilpay.net/img.php/36da5e48b4c9e03a27cd1a2e26149e4d.jpe';
														var title = service.title;
														var currency = service.local_cur;
														var serviceId = service.serviceid;
														var description = service.description;
													}
													var comparedCountry = _data[g];
													if (
														comparedCountry.alpha3Code == countryService &&
														typeService == 'CASHIN'
													) {
														var resultFlag = comparedCountry.flag;
														var resultName = comparedCountry.name;
													}
												}

												if (compare1 == compare2 && typeService == 'CASHIN') {
													if (resultServices.indexOf(compare1) == -1) {
														resultServices.push(compare1);
														// console.log('The Real Result', resultServices);
														this.data_server.array[i]['services'] = [];
														this.data_server.array[i].services.push(tabServices[h]);
													}
												}
											}
										}
										let object = {
											flag: resultFlag,
											country: resultName,
											logo: logoService,
											currency: currency,
											title: title,
											id: serviceId,
											description: description,
											service: resultServices
										};
										moneyTransferArray.push(object);
										// console.log('Final Results', moneyTransferArray);
										let momoObject = {
											data: moneyTransferArray,
											slug: 'MTNMOMO'
										};
										this.loginloader.dismiss();
										this.afServ.retrieveNumber((numb) => {
											var number = numb.number;
											let popover = this.popover.create(
												'descpopover',
												{ momoObj: moneyTransferArray, slug: 'smobilPay', phoneNumber: number },
												{ cssClass: 'contact-popover' }
											);

											popover.onDidDismiss((data) => {
												if (data) {
													// console.log('data =>', data);
													// this.navCtrl.push('PaymentFormPage', { serviceData: data });
												}
											});
											popover.present();
										});
										resolve(moneyTransferArray);
									}
								}),
								(err) => {
									reject(err);
								};
						}),
							(err) => {
								reject(err);
							};
					});
				})
				.catch((err) => {
					reject(err);
					// console.log('Error', err);
				});
		});
	}

	checkMyPacks(msges?: any) {
		return new Promise((resolve, reject) => {
			this.lgServ.isTable('_ona_myOrders').then((myorders) => {
				if (myorders) {
					var ordersList = [];
					var order;
					var counter = 0;
					ordersList = JSON.parse(myorders);
					for (let k = 0; k < ordersList.length; k++) {
						if (ordersList[k].status == 'processing') {
							order = ordersList[k];
							counter++;
						}
					}
					if (counter > 0) {
						resolve(order);
					} else {
						// reject(false);
						this.showMsgWithButton(
							'Veuillez acheter un pack pour ajouter une annonce',
							'top',
							'toast-info'
						);

						let popover = this.modalCtrl.create(
							'descpopover',
							{ slug: 'pack', pack_cat: 'paid' },
							{ cssClass: 'custom-poppack' }
						);

						popover.present();

						popover.onDidDismiss((selectedpack) => {
							// console.log('sel pack ', selectedpack);

							if (selectedpack) {
								resolve(selectedpack);
							} else {
								this.showMsgWithButton(msges.must_choose_pack, 'top', 'toast-info');
								// this.navCtrl.pop();
								// reject(false);
							}
						});
					}
				} else {
					this.retrievMyOrders(msges);
				}
			});
		});
	}

	checkPacks(msges?: any) {
		return new Promise((resolve, reject) => {
			this.lgServ.isTable('_ona_myOrders').then((orders) => {
				if (orders) {
					var ordersList = [];
					var myOrders = [];
					var connectedUser;
					ordersList = JSON.parse(orders);
					myOrders = JSON.parse(orders);

					myOrders.sort(function(a, b) {
						return (
							parseFloat(moment(b.date_completed).format('x')) -
							parseFloat(moment(a.date_completed).format('x'))
						);
					});

					if (myOrders.length > 0) {
						this.retrieveValidityDate(myOrders[0], msges)
							.then((data: any) => {
								if (data) {
									if (
										moment().format('YYYY-MM-DD') >=
										moment(myOrders[0].date_created)
											.add(parseInt(data.attributes[0].options[0]), 'days')
											.format('YYYY-MM-DD')
									) {
										this.showMsgWithButton(
											'Votre pack ' +
												myOrders[0].line_items[0].name +
												'est expiré. Veuillez passer a un pack payant',
											'top',
											'toast-info'
										);

										let popover = this.modalCtrl.create(
											'descpopover',
											{ slug: 'pack', pack_cat: 'paid' },
											{ cssClass: 'custom-poppack' }
										);

										popover.present();

										popover.onDidDismiss((selectedpack) => {
											if (selectedpack) {
												resolve(true);
											} else {
												this.showMsgWithButton(msges.must_choose_pack, 'top', 'toast-error');
												// this.navCtrl.pop();
												reject(false);
											}
										});
									} else {
										resolve(true);
									}
								}
							})
							.catch(() => {
								reject(false);
							});
					} else {
						this.showMsgWithButton(msges.choose_pack, 'top', 'toast-info');

						let popover = this.modalCtrl.create(
							'descpopover',
							{ slug: 'pack' },
							{ cssClass: 'custom-poppack' }
						);

						popover.present();

						popover.onDidDismiss((selectedpack) => {
							// console.log('Pack selected', selectedpack);
							if (selectedpack) {
								resolve(true);
							} else {
								this.showMsgWithButton(msges.must_choose_pack, 'top', 'toast-error');
								// this.navCtrl.pop();
								reject(false);
							}
						});
					}
				} else {
					this.retrievMyOrders(msges);
				}
			});
		});
	}

	retrievMyOrders(msges?: any) {
		var load = this.loadCtrl.create({ content: msges.ret_cust_order });

		load.present();
		this.lgServ.isTable('wpIonicToken').then((user) => {
			if (user) {
				var currentUser = JSON.parse(user);

				this.getCustomerOrders(currentUser.user.ID).subscribe(
					(res: any) => {
						load.dismiss();
						this.storage.set('_ona_myOrders', JSON.stringify(res)).then(() => {
							this.checkMyPacks(msges);
						});
						/* 	if (res.length > 0) {
								resolve(true);
							} else {
								let popover = this.modalCtrl.create(
									'descpopover',
									{ slug: 'pack' },
									{ cssClass: 'custom-poppack' }
								);

								popover.present();

								popover.onDidDismiss((selectedpack) => {
									// console.log('Pack selected', selectedpack);
									if (selectedpack) {
										resolve(selectedpack);
									} else {
										this.showMsgWithButton(msges.must_choose_pack, 'top', 'toast-error');
										// this.navCtrl.pop();
										// reject(false);
									}
								});
							} */
					},
					(error) => {
						load.dismiss();
						this.showMsgWithButton(
							"Erreur l'ors de la synchro de vos commandes, veuillez réessayer",
							'top',
							'toast-error'
						);
						// this.navCtrl.pop();
					}
				);
			}
		});
	}
	retrieveValidityDate(order, msges?: any) {
		return new Promise((resolve, reject) => {
			this.lgServ.isTable('_ona_products').then((data) => {
				if (data) {
					var prodLists = [];
					prodLists = JSON.parse(data);

					// console.log('Products ', prodLists);

					for (let k = 0; k < prodLists.length; k++) {
						if (prodLists[k].id == order.line_items[0].product_id) {
							resolve(prodLists[k]);
						}
					}
				} else {
					this.showMsgWithButton(msges.txt_sync, 'top', 'toast-error');
					reject(false);
				}
			});
		});
	}

	getPlacePack(place) {
		return new Promise((resolve, reject) => {
			this.lgServ.isTable('_ona_pack').then((data) => {
				if (data) {
					var pack_list = [];
					pack_list = JSON.parse(data);

					for (let k = 0; k < pack_list.length; k++) {
						if (pack_list[k].title.rendered == place.Place_customFields.et_payment_package) {
							resolve(pack_list[k]);
						}
					}
				}
			});
		});
	}

	launchAutoArchive() {
		this.lgServ.isTable('last_archive').then((last) => {
			if (last) {
				var date = JSON.parse(last);
				var last_date = new Date(date);
				if (new Date(last_date.setDate(last_date.getDate() + 7)) <= new Date()) {
					this.checkvalidityAndArchive();
				}
			} else {
				this.checkvalidityAndArchive();
			}
		});
	}

	checkvalidityAndArchive() {
		this.lgServ.isTable('_ona_place').then((data) => {
			if (data) {
				var list = [];
				list = JSON.parse(data);

				for (let i = 0; i < list.length; i++) {
					if (
						list[i].Place_customFields.et_payment_package != '' &&
						list[i].Place_customFields.et_payment_package != null &&
						list[i].Place_customFields.et_payment_package != 'BASIC'
					) {
						var day = new Date(list[i].date);
						this.getPlacePack(list[i]).then((pack: any) => {
							if (
								new Date(day.setDate(day.getDate() + parseInt(pack.Pack_value.et_duration[0]))) >=
								new Date()
							) {
								this.applyDelete('place', list[i]);
							}
						});
					}
				}
				this.lgServ.setTable('last_archive', moment().format('YYYY-MM-DD'));
			}
		});
	}

	loadAnnonceComments(list: Array<any>) {
		this.lgServ.isTable('allcomments').then((data) => {
			if (data) {
				for (let j = 0; j < list.length; j++) {
					var allcomments = JSON.parse(data);

					var comms = [];

					for (let k = 0; k < allcomments.length; k++) {
						if (parseInt(allcomments[k].content.comment_post_ID) == list[j].id) {
							comms.unshift(allcomments[k]);
						}
					}

					list[j].comments = comms;
				}
			}
		});
	}
}
