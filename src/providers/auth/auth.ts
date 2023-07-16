// import { Facebook } from "@ionic-native/facebook";
import { Loading, AlertController, LoadingController, Events } from 'ionic-angular';
// import { environment } from "./../../../environment";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AfProvider } from '../af/af';

/*
  Generated class for the AuthProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AuthProvider {
	users: {
		session_key: boolean;
		accessToken: string;
		expiresIn: number;
		sig: string;
		secret: string;
		userID: string;
	};
	isLoggedIn: boolean;
	loading: Loading;
	nonce: any;
	constructor(
		public http: HttpClient,
		public storage: Storage,
		public alertCtrler: AlertController,
		public loadingCtrler: LoadingController,
		// public fb: Facebook,
		public af: AfProvider,
		public ev: Events
	) {}

	genToken(username, password) {
		return new Promise((resolve) => {
			this.storage.get('fireUrl').then((url) => {
				this.http
					.post(url + '/wp-json/jwt-auth/v1/token', {
						username: username,
						password: password
					})
					.subscribe((result) => {
						this.storage.set('tokenInfo', result);
						resolve(result);
					});
			});
		});
	}

	//logOut method which destroys users credential from device
	logOut() {
		this.storage.remove('wpIonicToken');
		this.storage.remove('_ona_userDetails');
		this.storage.remove('_ona_myOrders');
		// this.storage.remove('_ona_selected_pack');
	}

	// login service using json api user
	login(login, pwd) {}

	// Generate cookie for authentication
	genAuthCookie(credits) {}

	// get facebook access token to use in fb connect of json api user
	getFbaccessToken() {}

	// facebook login method using fb_connect of json api user
	fbLogin(token) {}

	// Resgister using register method json api user
	wpRegister(user: any) {}

	// get user info using get_userinfo method of json api user
	wpGetUserInfo(uId) {}

	resetPassword(login) {}

	/**
	 * @author Landry Fongang
	 * @param user_data Data about user to create
	 * @param token token access of the user creating another user (must hava admin access)
	 */
	doRegister(user_data, token) {
		this.af.retrieveURL((url) => {
			let headers = new HttpHeaders();
			headers.set('Content-Type', 'application/x-www-form-urlencoded');
			headers.set('Authorization', 'Bearer ' + token);
			const api_url = url.url + '/wp-json/wp/v2/';
			return this.http.post(
				api_url +
					'users?username=' +
					user_data.username +
					'&email=' +
					user_data.email +
					'&password=' +
					user_data.password,
				null,
				{ headers: headers }
			);
		});
	}

	/**
	 * Method to create a user account on wp site
	 * @author Landry Fongang
	 * @param user_data Data about user to create
	 * @param token token access of the user creating another user (must hava admin access)
	 */
	createAccount(user_data, token) {
		return new Promise((resolve, reject) => {
			this.af.retrieveURL((url) => {
				var data = null;
				var xhr = new XMLHttpRequest();
				const api_url = url.url + '/wp-json/wp/v2/users';

				xhr.addEventListener('readystatechange', function() {
					if (this.readyState === 4) {
						resolve(this.responseText);
					}
				});

				xhr.open(
					'POST',
					api_url +
						'?username=' +
						user_data.username +
						'&email=' +
						user_data.email +
						'&password=' +
						user_data.password
				);
				xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				xhr.setRequestHeader('Authorization', 'Bearer ' + token);
				xhr.send(data);
			});
		});
	}

	/**
	 * @author Landry Fongang (mr_madcoder_fil)
	 * Method to validate that a specific token haven't expired yet. Will
	 * be used when doing CRUD operations
	 * @param token User token to check if its still valide
	 */
	validateAuthToken(token) {
		// console.log('validating Auth token')
		return new Promise((resolve, reject) => {
			this.af.retrieveURL((url) => {
				var data = null;
				var xhr = new XMLHttpRequest();
				const api_url = url.url + '/wp-json/jwt-auth/v1/token/validate';

				xhr.addEventListener('readystatechange', function() {
					if (this.readyState === 4) {
						// console.log('Response text=>' + this.responseText);
						resolve(this.responseText);
					}
				});

				xhr.open('POST', api_url);
				// xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				xhr.setRequestHeader('Authorization', 'Bearer ' + token);
				xhr.send(data);
			});
		});
	}

	/**
	 * Method to login to wordpress site using JWT while sending a POST request
	 * @author Landry Fongang
	 * @param username The username / email
	 * @param password The user password
	 */
	postLogin(username, password, objUrl, prefix?, suffix?, startTime?, endTime?, demo_id?) {
			const api_url = objUrl.url + '/wp-json/jwt-auth/v1/token';
			
			// const url = api_url + prefix + suffix + startTime + endTime + demo_id + '';
			let data = {
				username: username,
				password: password
			};
			
			let headers = new HttpHeaders();
			headers.set('Content-Type', 'application/json');
			return this.http.post(api_url, data, { headers: headers });
	
		}
}
