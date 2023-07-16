import * as moment from 'moment';

// import { GESTURE_REFRESHER } from "ionic-angular/umd";

export class Order {
	public id;
	public type;
	public parent_id;
	public number;
	public order_key;
	public created_via;
	public version;
	public status;
	public currency;
	public date_created;
	public date_created_gmt;
	public date_modified;
	public date_modified_gmt;
	public discount_total;
	public discount_tax;
	public shipping_total;
	public shipping_tax;
	public cart_tax;
	public total;
	public total_tax;
	public prices_include_tax;
	public customer_id;
	public customer_ip_address;
	public customer_user_agent;
	public customer_note;
	public billing;
	public shipping;
	public payment_method;
	public payment_method_title;
	public transaction_id;
	public date_paid;
	public date_paid_gmt;
	public date_completed;
	public date_completed_gmt;
	public cart_hash;
	public meta_data;
	public line_items;
	public tax_lines;
	public shipping_lines;
	public fee_lines;
	public coupon_lines;
	public refunds;

	constructor(serverJSON: any, type: string) {
		// console.log('Entering in constructor');
		// this.setType(type);
		if (serverJSON != null) this.setOrder(serverJSON);
		else this.createOrder();
	}

	/** Cette fonction permet de définir 
     * les valeurs des champs
     * @param data JSONObject, il s'agit des données JSON du serveur
     *
     ***/
	setOrder(data: any) {
		this.id = data.id;
	}

	/** set up type **/
	setType(type: string) {
		this.type = type;
	}

	getType() {
		return this.type;
	}

	//On créé un objet de type produit
	createOrder() {
		this.id = 0;
		this.parent_id = 0;
		this.number = 0;
		this.order_key = '';
		this.created_via = 'rest-api';
		this.version = '';
		this.status = 'completed';
		this.currency = 'EUR';
		this.date_created = moment().format('YYYY-MM-DDThh:mm:ss');
		this.date_created_gmt = moment().format('YYYY-MM-DDThh:mm:ss');
		this.date_modified = moment().format('YYYY-MM-DDThh:mm:ss');
		this.date_modified_gmt = moment().format('YYYY-MM-DDThh:mm:ss');
		this.discount_total = '0.00';
		this.discount_tax = '0.00';
		this.shipping_total = '0.00';
		this.shipping_tax = '0.00';
		this.cart_tax = '0.00';
		this.total = '0.00';
		this.total_tax = '0.00';
		this.prices_include_tax = false;
		this.customer_id = 3;
		this.customer_ip_address = '';
		this.customer_user_agent = '';
		this.customer_note = '';
		this.billing = {
			first_name: '',
			last_name: '',
			company: '',
			address_1: '',
			address_2: '',
			city: '',
			state: 'CA',
			postcode: '',
			country: '',
			email: '',
			phone: ''
		};
		this.shipping = {
			first_name: '',
			last_name: '',
			company: '',
			address_1: '',
			address_2: '',
			city: '',
			state: 'CA',
			postcode: '',
			country: ''
		};
		this.payment_method = '';
		this.payment_method_title = '';
		this.transaction_id = '';
		this.date_paid = moment().format('YYYY-MM-DDThh:mm:ss');
		this.date_paid_gmt = moment().format('YYYY-MM-DDThh:mm:ss');
		this.date_completed = moment().format('YYYY-MM-DDThh:mm:ss');
		this.date_completed_gmt = moment().format('YYYY-MM-DDThh:mm:ss');
		this.cart_hash = '';
		this.meta_data = [
			{
				id: 0,
				key: '',
				value: ''
			}
		];
		this.line_items = [
			{
				id: 0,
				name: '',
				product_id: 0,
				variation_id: 0,
				quantity: 1,
				tax_class: '',
				subtotal: '0.00',
				subtotal_tax: '0.00',
				total: '0.00',
				total_tax: '0.00',
				taxes: [],
				meta_data: [],
				sku: '',
				price: 1500
			}
		];
		this.tax_lines = [];
		this.shipping_lines = [];
		this.fee_lines = [];
		this.coupon_lines = [];
		this.refunds = [];
	}
}
