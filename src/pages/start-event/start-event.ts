import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController, ModalController, AlertController } from 'ionic-angular';
import { LoginProvider } from '../../providers/login/login';
import { WpPersistenceProvider } from '../../providers/wp-persistence/wp-persistence';
import { TranslateService } from '@ngx-translate/core';


@IonicPage()
@Component({
  selector: 'page-start-event',
  templateUrl: 'start-event.html',
})
export class StartEventPage {

  txtLangue: any;
  total: any;
  pagenum: any;
  categories = [];
  objLoader: boolean;
  private model: string;
  public user: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public menuCtrl: MenuController, public modalCtrl: ModalController, private lgServ: LoginProvider, private wpServ: WpPersistenceProvider, public translate: TranslateService, public alertCtrl: AlertController) {
    
    this.objLoader = true;
    this.model = 'categories';
    this.lgServ.isTable('wpIonicToken').then((data) => {
			if (data) {
				this.user = JSON.parse(data);
      }
    });

    this.translate.get("events").subscribe(res=>{
      this.txtLangue = res;
    });

    this.syncOffOnline();
  }

  syncOffOnline() {

		this.lgServ.checkStatus('_ona_' + this.model).then((res) => {
			if (res == 'i') {
				//Première utilisation sans connexion
				this.objLoader =  false;
			}else if (res == 's') {
				// console.log('Reading from Storage catalogue');
				this.lgServ.isTable('_ona_'+this.model).then(_res=>{
          if(_res){
            //console.log(JSON.parse(_res));
            this.categories = JSON.parse(_res);
            this.objLoader = false;
          }
        });

			}
      
      //SYnc de la liste depuis le serveur
			if (res == 'w' || res == 'rw') {
				//console.log('Reading from server place');
				this.getFromServer();
				// this.objLoader =  false;
      }
      
    });
    
  }

  /**
	 * Method to get current models data, save in storage and display in current view
	 */
	getFromServer() {

		// this.objLoader = true;
    this.wpServ.getWpData(this.model, 100, 1).then((res: any) => {
      //console.log('Serve response for categories =>', res);
      this.pagenum = res.total_pages;
      this.total = res.total;
      this.categories = res.categories;
      
      this.objLoader =  false;
      this.lgServ.setTable('_ona_' + this.model, res.categories);
      this.lgServ.setSync('_ona_' + this.model + '_date');
    })
    .catch((err) => {
      //console.log(err);
      this.wpServ.showMsgWithButton(this.txtLangue.category_fail,"top","toast-error");
    });

  }

  ionViewDidLoad() {
    // console.log('ionViewDidLoad StartEventPage');
  }

  openMenu(){
    this.menuCtrl.open();
  }

  /**
   * Cette fonction permet de récupérer
   * la liste des catégories d'un événement
   */
  getListCategories(){

  }

  //Cette fonction permet d'ouvrir la
  //vue calendrier lié à une catégorie
  goToEvents(cat?: any){
    if(cat!==undefined)
      this.navCtrl.push("EventsPage", {'category': cat});
    else
      this.navCtrl.push("EventsPage");
  }

  //Cette fonction permet de créer un événement
  createEvent(){
    if(this.user){
      this.addEvent();
    }else{
      this.logIn();
    }
  }

  /**
	 * Cette fonction permet à l'utilisateur de
   * se connecter avant de créer un événement (si ce dernier n'est pas encore connecté)
	 */
	logIn() {
		const confirm = this.alertCtrl.create({
			title: this.txtLangue.btn_create,
			message: this.txtLangue.txt_login,
			buttons: [
				{
					text: this.txtLangue.btn_no,
					handler: () => {}
				},
				{
					text: this.txtLangue.btn_login,
					handler: () => {
            this.showLoginPage();
					}
				}
			]
    });
    
		confirm.present();
  }
  
  //On affiche le login dans le modal
  showLoginPage(){

    let params = {'provider':'StartEventPage'};
    let addModal = this.modalCtrl.create('LoginPage', params);

    addModal.onDidDismiss((data) => {

      if(data){
        this.addEvent();
      }
      
    });

    addModal.present();
  }

  //Cette fonction permet d'appeler
  //le composant FormEvent 
  addEvent(){

    let params = {'modif':false};
    let addModal = this.modalCtrl.create('FormEventPage', params);

    addModal.onDidDismiss((data) => {

      if(data){
        
        
      }
      
    });

    addModal.present();
  }

}
