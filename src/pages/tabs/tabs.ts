import { Component,  ViewChild } from '@angular/core';
import { NavParams, Events, Tabs } from 'ionic-angular';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  @ViewChild(Tabs) tabs: Tabs;
  pageParams;
 
  tab1Root = 'mainmenu';
  tab2Root = 'DonnezAvisPage';
  tab3Root = 'LastPage';
  tab4Root = 'FavoritesPage';
  tab5Root = 'PlusPage';
  // tab6Root = 'PlusPage';

  public myIndex: any;

  constructor(public navParams: NavParams, events: Events) {
  	
    this.myIndex = navParams.data.tabIndex || 0;
    
    // console.log(navParams.get('tabIndex'));
    // if(navParams.data.page!==undefined){

    //   if(this.myIndex==4 && navParams.data.page!='mainmenu'){
    //     console.log(navParams.data);
    //     this.pageParams = navParams.data;
    //     this.tab5Root = navParams.data.page;
    //   }
    // }
  }

  ngAfterContentInit(){       
    
    if(this.navParams.data.page!==undefined){

      if(this.myIndex==4 && this.navParams.data.page!='mainmenu'){
        // console.log(this.navParams.data);
        this.pageParams = this.navParams.data;
        this.tab5Root = this.navParams.data.page;
      }
    }

  }

}
