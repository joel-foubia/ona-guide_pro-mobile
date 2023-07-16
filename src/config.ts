/** Configuration des patterns API **/
/** Configuration de la sauvegarde locale **/
export class ApiConfig {
	/**
	 * Landry's urls
	 * 
	 */
	static APPID_ONESIGNAL = '4b8daf47-6d1f-493d-85c6-6a37cde887c0';
	static SENDER_ID = '489146933418';
	static consumer_key = 'ck_6be0ff2b4e04f9d845bbeb5570b16764306266f3';
	static consumer_secret = 'cs_90f289f4921f5eefdb5628e0a92b552fe3384164';
	static url_categories = '/wp-json/wc/v3/products/categories';
	static url_customer = '/wp-json/wc/v3/customers';
	static url_orders = '/wp-json/wc/v3/orders';
	static url_product_list = '/wp-json/wc/v3/products';
	static url_gateways = '/wp-json/wc/v3/payment_gateways';
	static url_login = '';

	static url_how_it_works = '/frequently-asked-questions/?json=1';

	static pattern = '/wp-json/wp/v2/';
	static url_about = '/a-propos/?json=1'; //url api A Propos
	static url_articles = '/wp-json/wp/v2/posts'; //url api liste actualités
	static Max_Petition = 100;
	static url_culinaire = '/wp-json/wp/v2/posts';
	static nom_app = '237 Guide Pro';
	static url_pays = '../assets/countries.json';
	static url_comment_ca_marche = '/frequently-asked-questions/?json=1';

	/**
	 * Urls specific ti Vitrine Africaine app
	 */
	static url_places = '/wp-json/wp/v2/place'; // places here represents articles
	static url_media = '/wp-json/wp/v2/media'; // media are images and videos
	static url_pages = '/wp-json/wp/v2/pages'; // this are pages in the website
	static url_pointfinderreviews = '/wp-json/wp/v2/pointfinderreviews';
	static url_pftestimonials = '/wp-json/wp/v2/pftestimonials';
	static url_agents = '/wp-json/wp/v2/agents'; // agents
	static url_types = '/wp-json/wp/v2/types';
	static url_statuses = '/wp-json/wp/v2/statuses';
	static url_taxonomies = '/wp-json/wp/v2/taxonomies';
	static url_category = '/wp-json/wp/v2/categories';
	static url_tags = '/wp-json/wp/v2/tags';
	static url_pointfinderltypes = '/wp-json/wp/v2/pointfinderltypes'; // pointfinderltypes are categories
	static url_pointfinderlocations = '/wp-json/wp/v2/pointfinderlocations'; // pointfinderlocations are locations
	static url_pointfinderfeatures = '/wp-json/wp/v2/pointfinderfeatures';
	static url_pointfinderconditions = '/wp-json/wp/v2/pointfinderconditions';
	static url_users = '/wp-json/wp/v2/users'; // users are all the users in website
	static url_me = '/wp-json/wp/v2/users/me';
	static currency = 'EUR';
	static url_comments = '/wp-json/wp/v2/comments'; // comments are all the comments in website
	static url_taxonomy = '/wp-json/wp/v2/taxonomies';
}

export class ConfigModels {
	static tab_models = [
		'users',
		'tags',
		'place_tag',
		'location',
		'orders',
		'place',
		'place_category',
		'pack',
		'products'
	];
	static sync_tab_models = [ 'place' ];
}

export class Actions {
	static loadActions() {
		let liste = [
			{ id: 0, titre: 'Modifier', img: 'assets/icon/actions/edit.svg', slug: 'update' },
			{ id: 1, titre: 'Archiver', img: 'assets/icon/actions/garbage.svg', slug: 'delete' },
			{ id: 2, titre: 'Voir', img: 'assets/icon/actions/view.svg', slug: 'view' },
			{ id: 3, titre: 'Noté', img: 'assets/icon/actions/rating.svg', slug: 'rate' }
		];

		return liste;
	}
}
export class QuickFilters {
	static loadFilters(pop?: any) {
		let liste = [
			{
				name: pop.me,
				slug: 'me',
				val: false
			},
			{
				name: pop.today,
				slug: 'today',
				val: false
			},
			{
				name: pop.dispo,
				slug: 'dispo',
				val: false
			},
			{
				name: pop.feat,
				slug: 'feat',
				val: false
			},
			{
				name: pop.verif,
				slug: 'verif',
				val: false
			},
			{
				name: pop.pop,
				slug: 'popular',
				val: false
			},
			{
				name: pop.plus,
				slug: 'plus',
				image: 'assets/images/more.png'
			}
		];

		return liste;
	}
}
export class ApiPaypal {
	static currency = 'EUR';
	static eur_val = 650;
	static msgSuccess = 'Merci pour votre Don !';
	static currencyconverterapi = 'b0c736d8f3e198945509';
	static monetbilkey = 'nBMc9iBLeEgueT5N9reITYDdJPu4E7Fm';
	static converterUrl = 'https://free.currencyconverterapi.com/api/v6/convert';

	//Définition des messages erreurs ou de success lorsque
	//le paiement a été effectué ou pas
	static errorInit() {
		let objErr = {
			titre: 'PAYMENT',
			texte:
				'Impossible de procéder au paiement. Veuillez vérifier votre connexion Internet ou bien votre appareil ne supporte pas PayPal'
		};

		return objErr;
	}

	static errorSetting() {
		let objErr = {
			titre: 'PAYMENT',
			texte:
				"Impossible de procéder au paiement car une erreur est survenu durant la procédure. Contactez L'Association"
		};

		return objErr;
	}

	static cancelPayment() {
		let objErr = {
			titre: 'PAYMENT',
			texte: 'Vous avez annulé la procédure de paiement'
		};

		return objErr;
	}
}

export class SyncOptions {
	static syncTimer = 30000;
	static modelSyncTimer = 30000;
	static syncInOutDBTimer = 10000;
}
export class ServicesConfig {
	static services_points = 48;
}
