import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController, Content, FabButton } from 'ionic-angular';
import { Slides } from 'ionic-angular';
import { QuickFilters } from '../../config';
import { ViewChild } from '@angular/core';
import { LoginProvider } from '../../providers/login/login';
import { WpPersistenceProvider } from '../../providers/wp-persistence/wp-persistence';
import { Storage } from '@ionic/storage';
import { Diagnostic } from '@ionic-native/diagnostic';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Geolocation } from '@ionic-native/geolocation';

@IonicPage()
@Component({
	selector: 'page-taxonomies-list',
	templateUrl: 'taxonomies-list.html'
})
export class TaxonomiesListPage {
	@ViewChild('idSlide') slides: Slides;
	@ViewChild(Content) content: Content;
	@ViewChild(FabButton) fabButton: FabButton;
	@ViewChild('contentRef') contentHandle: Content;
	txtSearch: string = '';
	type;
	taxonomy = [];
	dumpData = [];
	anime = null;
	locationsList = [];
	showQuickFilter: boolean = false;
	img = [];
	dumpTaxonomy = [];
	location_filter_selected: any;
	colorFilterBtn: string = 'gris';
	annoncesList = [];
	quick_filter_selected;
	featured = [];
	txtFiltre = [];
	quick_filters = [];
	display_search: boolean = true;
	dumpFilter = [];
	max = 10;
	objLoader = true;
	currentPosition;
	max_distance;
	radius;
	model;
	showSearch = false;
	searchBtnColor: string = 'light';
	display_search_btn: boolean = false;
	gps: any;
	events;

	constructor(
		public navCtrl: NavController,
		public menuCtrl: MenuController,
		public navParams: NavParams,
		public storage: Storage,
		public lgSer: LoginProvider,
		public diagnostic: Diagnostic,
		public geolocation: Geolocation,
		public locationAccuracy: LocationAccuracy,
		public persistence: WpPersistenceProvider
	) {
		this.slider();
		this.events = {
			onView: function(event: any) {
				storage.get('_ona_place').then((places) => {
					let placesList = [];
					placesList = JSON.parse(places);
					for (let k = 0; k < placesList.length; k++) {
						if (event.pub.id_annonce == placesList[k].id) {
							navCtrl.push('AnnonceDetailPage', { annonce: placesList[k] });
						}
					}
				});
			}
		};
		this.storage.get('gps_ask_activate').then((gps) => {
			if (gps) {
				this.gps = gps;
			}
		});
		this.type = navParams.data;

		if (this.type.type.name == 'location') {
			this.model = 'location';
		} else {
			this.model = 'place_tag';
		}
		setTimeout(() => {
			this.loadData(this.model);
		}, 500);
	}

	syncOffOnline() {
		this.lgSer.checkStatus('_ona_' + this.model).then((res) => {
			if (res == 'i') {
				this.objLoader = false;
			} else if (res == 's') {
				this.loadData(this.model);
			}
			//SYnc de la liste depuis le serveur
			if (res == 'w' || res == 'rw') {
				this.objLoader = false;
			}
		});
	}

	onSetClick() {
		this.showQuickFilter = !this.showQuickFilter;
		if (this.showQuickFilter == true) {
			this.colorFilterBtn = 'primary';
		} else {
			this.colorFilterBtn = 'dark';
		}
		if (this.content != null) {
			setTimeout(() => {
				// this.content.scrollToTop(2000);
			}, 1000);
		}
		this.content.resize();
	}

	ionViewDidLoad() {}

	loadData(model) {
		this.objLoader = true;
		this.lgSer.isTable('_ona_' + model).then((data) => {
			if (data) {
				this.objLoader = false;
				
				var results = JSON.parse(data);
				this.dumpTaxonomy = this.filterTaxonomies(results);
				this.taxonomy = this.filterTaxonomies(results);
				// console.log('Taxonomy list =>', results);
			}
			else{
				this.objLoader = false;
			}
		});
	}

	doInfinite(infiniteScroll) {
		this.max += 10;
		infiniteScroll.complete();
	}

	openLeftMenu() {
		this.menuCtrl.open();
	}

	goToAnounceParent(item) {
		this.navCtrl.push('AnnoncesPage', { location: item, type: this.type.type.name });
	}

	/**
	 * Cette méthode permet de filtrer les éléments (locations ou tags)
	 * @param elements Array<any>, tableau d'élements
	 */
	filterTaxonomies(elements) {
		let results = [];

		for (let i = 0; i < elements.length; i++) {
			const element = elements[i];
			if (element.count > 0) results.push(element);
		}

		return results;
	}
	slider() {
		this.persistence.gettaxonomyPubs().then((_data: any) => {
			//console.log('img => ', _data);
			this.img = _data;
		});
	}
	slideChanged() {
		let currentIndex = this.slides.getActiveIndex();
	}
	displaySearchBar() {
		this.showSearch = true;
	}
	searchCanceled() {
		// console.log('Canceled');
		this.showSearch = false;
	}
	setFilteredItems(ev) {
		// console.log('Event target ', ev);
		if (ev.target.value == undefined || ev.target.value == '') {
			this.taxonomy = this.dumpTaxonomy;
			this.max = 10;

			return;
		} else {
			this.txtSearch = ev.target.value;
			this.taxonomy = this.dumpTaxonomy.filter((item) => {
				return item.name.toLowerCase().indexOf(ev.target.value.toLowerCase()) > -1;
			});

			this.max = 10;
		}
	}
	searchItems() {
		this.display_search_btn = !this.display_search_btn;
		if (this.display_search_btn) {
			this.searchBtnColor = 'primary';
		} else {
			this.searchBtnColor = 'light';
		}
		this.content.resize();
	}
}
