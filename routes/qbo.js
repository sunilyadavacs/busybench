var express = require('express');
var url = require('url');
var qboModel = require('../models/qbo_models.js');
const pool=require("../models/connection.js");
var request = require('request');
var router = express.Router();
var QuickBooks = require('node-quickbooks');
var queryString = require('query-string');
var config = require('../config.json');
/*
Create body parsers for application/json and application/x-www-form-urlencoded
 */
var bodyParser = require('body-parser')
router.use(express.json());
router.use(express.urlencoded({ extended: false }));
router.use(bodyParser.urlencoded({ extended: true }));
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('qbo test');
});

router.post('/getAccounts/', function(req,res){
    get_accounts(req, res, req.body.AccountId);
});

// router.get('/check_refresh', function(req,res){
//     refresh_token(req, res,'193514636888144','L011559196804cjoC9zfHtoHpBXDxWKZIdAZLObg1dNKqB5dRG','get_payment_method');
// });

router.post('/getPaymentMethods/', function(req,res){
   get_payment_method(req, res, req.body.AccountId);
});

function get_accounts(req, res, AccountId){
    qboModel.get_qb_login_details(AccountId,function(results){
     results = JSON.parse(JSON.stringify(results));
    if(results.length>0){
        var qbo = new QuickBooks(config.clientId,
            config.clientSecret,
            results[0].AccessToken, /* oAuth access token */
            false, /* no token secret for oAuth 2.0 */
            results[0].RealmID,
            config.useSandbox, /* use a sandbox account */
            true, /* turn debugging on */
            34, /* minor version */
            '2.0', /* oauth version */
            results[0].RefreshToken /* refresh token */);
        qbo.findAccounts({
            fetchAll: true
          }, function(err, accounts) {
            if (err) {
                console.log(err);
                var error_detail = err.fault.error[0].detail;
                var check_token_exp = 'Token expired';
                if(error_detail.indexOf(check_token_exp) !== -1){
                    refresh_token(req, res,AccountId,results[0].RefreshToken,'get_accounts');
                }else{
                    res.send(err.fault.error[0].detail);
                }
                
            }
            else {
                res.send(accounts.QueryResponse);
            }
        });
    }else{
        res.send('User not connected')
    }
      });
}
function get_payment_method(req, res, AccountId){
    qboModel.get_qb_login_details(AccountId,function(results){
    results = JSON.parse(JSON.stringify(results));
    console.log(results);
    if(results.length>0){
        var qbo = new QuickBooks(config.clientId,
            config.clientSecret,
            results[0].AccessToken, /* oAuth access token */
            false, /* no token secret for oAuth 2.0 */
            results[0].RealmID,
            config.useSandbox, /* use a sandbox account */
            true, /* turn debugging on */
            34, /* minor version */
            '2.0', /* oauth version */
            results[0].RefreshToken /* refresh token */);
        qbo.findPaymentMethods({
            fetchAll: true
          }, function(err, accounts) {
            if (err) {
                if(err.fault.error[0].detail){
                    var error_detail = err.fault.error[0].detail;
                    var check_token_exp = 'Token expired';
                    console.log(error_detail.indexOf(check_token_exp) !== -1);
                    if(error_detail.indexOf(check_token_exp) !== -1 || err.fault.error[0].detail==='Token revoked'){
                        refresh_token(req, res,AccountId,results[0].RefreshToken,'get_payment_method');
                    }else{
                        res.send(err.fault.error[0].detail);
                    }
                }
                
                
            }
            else {
                res.send(accounts.QueryResponse);
                
            }
        });
    }else{
            res.render('qb_connect',{
                redirect_uri: config.redirectUri,
                token_json: token_json
            });
        }
    });
}


function refresh_token(req, res,AccountId,oldrefresh_token,callback_function){
    var auth = (new Buffer(config.clientId + ':' + config.clientSecret).toString('base64'));
    var postBody = {
        url: config.token_endpoint,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + auth,
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: oldrefresh_token
        }
    };

    request.post(postBody, function (err, res, data) {
        var accessToken = JSON.parse(res.body);
        if(accessToken.access_token){
            pool.query('UPDATE account_quickbooks_keys SET   AccessToken = ?, RefreshToken = ?, Expires = ? WHERE Account = ?', [accessToken.access_token,accessToken.refresh_token,accessToken.expires_in,AccountId], function (error, results, fields) {
                if (error) throw error;
                // ...
              });
        }
        
    });

    eval(callback_function+"(req, res,AccountId)");
}
module.exports = router;