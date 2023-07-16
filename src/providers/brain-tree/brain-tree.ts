import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AfProvider } from '../af/af';
import { Braintree, ApplePayOptions, PaymentUIOptions, PaymentUIResult } from '@ionic-native/braintree';
import swal from 'sweetalert'

/*
  Generated class for the BrainTreeProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class BrainTreeProvider {

  constructor(
              public http: HttpClient,
              public af: AfProvider,
              private braintree: Braintree
              ) {
    // console.log('Hello BrainTreeProvider Provider');
  }
  brainTreeRequest(amount, description){
    var currency = 'EUR';
    return new Promise((resolve, reject)=>{
      this.af.getAccessToken('paypal.php', 'getToken').then((_val : any)=>{

        alert('TOKEN FORM SERVER => '+ JSON.stringify(_val));
        if(_val){
          var paypalInfo = _val;
          // console.log('paypal => ', paypalInfo);
          const BRAINTREE_TOKEN = paypalInfo.token;
          const paymentOptions: PaymentUIOptions = {
            amount: amount,
            primaryDescription: description
          };
          this.braintree.initialize(BRAINTREE_TOKEN)
          .then(() => this.braintree.presentDropInPaymentUI(paymentOptions))
          .then((resultPaypal: any) => {
            if (resultPaypal.userCancelled) {
              // console.log("User cancelled payment dialog.");
            } else {
             var payerId = resultPaypal.payerId;
             alert('payerId => '+ JSON.stringify(payerId));
             var nonce = resultPaypal.nonce;
             alert('resultPaypal => '+ JSON.stringify(resultPaypal));
             alert('nonce => '+ JSON.stringify(nonce));
              this.af.getDataPaypal('paypal.php', 'doRequest', nonce, amount, currency, description, payerId).then((payload : any)=>{
                alert('payloadObject => '+ JSON.stringify(payload));
  
                if(payload.id){
                alert('payloadID => '+ JSON.stringify(payload.id));

                  resolve(payload);
                }else{
                  swal(
                    'Echec de Transaction',
                    "un problème est survenu lors de l'opération.",
                    'warning'
                  ).then((err) => {
                    reject(err);
                  })
                }
              }).catch((err)=>{
              });
            }
          })
        }
      });
    });
  }

}
