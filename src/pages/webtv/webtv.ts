import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController } from 'ionic-angular';
import { LoginProvider } from '../../providers/login/login';
import { YoutubeVideoPlayer } from '@ionic-native/youtube-video-player';
// import { DomSanitizationService } from '@angular/platform-browser';
// import { DomSanitizer } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';


@IonicPage()
@Component({
	selector: 'page-webtv',
	templateUrl: 'webtv.html'
})
export class WebtvPage {
	channelsList = [];
	segment;
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public menuCtrler: MenuController,
		public lgServ: LoginProvider,
		public yt: YoutubeVideoPlayer,
		public sanitizer: DomSanitizer // public sanitizer: DomSanitizer
	) {
		this.getVideosData();
	}

	ionViewDidLoad() {}

	ionViewDidEnter() {
		/* document.querySelector('iframe').addEventListener('load', function() {
			
			console.log('Loaaaaaded');
			
		}); */
	}

	openMenu() {
		this.menuCtrler.open();
	}

	//Change segment
	segmentChanged(obj, event) {
		// console.log('Segment =>', this.segment);
		// console.log('Ev =>', event);
		this.segment = obj.id;

		let segments = event.target.parentNode.children;
		let len = segments.length;

		for (let i = 0; i < len; i++) {
			segments[i].classList.remove('segment-activated');
		}
		event.target.classList.add('segment-activated');

		document.querySelector('iframe').addEventListener('load', function() {
			
			// console.log('Loaaaaaded');

		});
	}

	getVideosData() {
		this.lgServ.isTable('_ona_fireData').then((res) => {
			if (res) {
				//console.log('FireData =>', JSON.parse(res));
				this.channelsList = JSON.parse(res)[2];
				for (let i = 0; i < this.channelsList.length; i++) {
					this.getPlaylists(this.channelsList[i]);
				}
				this.segment = this.channelsList[0].id;
			}
		});
	}
	getPlaylists(playlist) {
		// var plylistData = [];
		// var videosArray = [];
		for (let k = 0; k < playlist.links.length; k++) {
			playlist.links[k] = 'http://www.youtube.com/embed/?listType=playlist&autoplay=1&list=' + playlist.links[k];
		}
	}

	photoURL(pl) {
		// return this.sanitizer.bypassSecurityTrustUrl(pl);
	}

	openPlaylist(id) {
		// console.log('Video ID=>', id);
		if (id != undefined) {
			this.yt.openVideo(id);
		}
	}
}
