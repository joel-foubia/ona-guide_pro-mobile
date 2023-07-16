import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { WpPersistenceProvider } from '../../providers/wp-persistence/wp-persistence';


@IonicPage({
	name: 'users'
})
@Component({
	selector: 'page-users',
	templateUrl: 'users.html'
})
export class UsersPage {
	serachedItems: any;
	display_search: boolean;
	refreshInt: number;
	refreshing: boolean;
	showFailed: boolean;
	allUsers = [];
	n = 0;
	k = 10;
	defaultImage: string;
	users = [];
	userInterval: number;

	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public storage: Storage,
		public persistence: WpPersistenceProvider,
		public ev: Events
	) {
		
	}
	ionViewDidLeave() {
		clearInterval(this.refreshInt);
		clearInterval(this.userInterval);
	}

	launchSearch(searchbar) {
		var query = searchbar.srcElement.value;
		if (!query) {
			// this.show = true;
			// this.onCancel()
			return;
		}
		this.users = this.allUsers.filter((v) => {
			if (v.name && query) {
				if (v.name.toLowerCase().indexOf(query.toLowerCase()) > -1) {
					return true;
				}
				return false;
			}
		});
	}

	searchItems() {
		this.display_search = true;
	}
	onCancel() {
		this.serachedItems = undefined;
		this.display_search = false;
		this.storage.get('all_users').then((users) => {
			if (users) {
				this.allUsers = users;
				for (let i = 0; i < 10; i++) {
					this.users.push(users[i]);
				}
				// this.users = users;
			} else {
				this.showFailed = true;
			}
		});
	}
	onClear() {
		this.display_search = false;
		this.serachedItems = undefined;
		this.storage.get('all_users').then((users) => {
			if (users) {
				this.allUsers = users;
				for (let i = 0; i < 10; i++) {
					this.users.push(users[i]);
				}
				// this.users = users;
			} else {
				this.showFailed = true;
			}
		});
	}

	refresh() {
		// console.log('Refreshing');
		
	}

	loadmore(infiniteScroll) {
		if (this.display_search != true) {
			if (this.k >= this.allUsers.length) {
				infiniteScroll.complete();
				return;
			}
			this.n += 10;
			this.k += 10;

			for (let i = this.n; i < this.k; i++) {
				if (this.allUsers[i]) {
					this.users.push(this.allUsers[i]);
				} else {
					infiniteScroll.complete();
					return;
				}
			}
			infiniteScroll.complete();
		} else {
			infiniteScroll.complete();
		}
	}

	opneProfile(user) {
		// console.log('User to send : ', user);
		this.navCtrl.push('profile', { setAdmin: true, userid: user.id });
	}

	ionViewDidLoad() {}
}
