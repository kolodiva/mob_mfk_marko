var fs = require('fs');

var sendmail = require('sendmail')( {silent: true,
  dkim: {
    privateKey: fs.readFileSync('/etc/opendkim/keys/mail.newfurnitura.ru/dkim.private', 'utf8'),
    keySelector: 'mail.newfurnitura.ru'
  }
} );


const {Pool}    = require('pg');
const postgres  = require("./postgres");

const dbpg = new Pool(postgres.params_conn);

// const view = require('./index');
const view = require('./index-layout-def');

const getAppParams = (req) => { return { appParams:req.app.get('appParams'), paramsUrl:req.params, qtyParamsUrl:Object.keys(req.params).length,  } };

const renderHtml = (req, res, htmlPath, status = 200) => {
  //
  let params = getAppParams(req);

  try {

    res.status(status).marko(view, {
      $global: {
        isProduction: params.appParams.isProduction,
        htmlPath: htmlPath,
      },
    });

  } catch (e) {
    res.status(404).send(e.stack)
  }

};

//
exports.getHome       = (req, res) => {
  renderHtml(req, res, 'home');
};

exports.getCatalog    = (req, res) => {
  //renderHtml(req, res, 'catalog');
  //
  let params = getAppParams(req);

  // console.log('routs params: ', req.params);
  // console.log('routs query: ', req.query);

  const guidParent = req.params && req.params.guidParent || '';

  try {

    res.status(200).marko(view, {
      $global: {
        isProduction: params.appParams.isProduction,
        htmlPath: 'catalog',
        guidParent: guidParent,
      },
    });

  } catch (e) {
    res.status(404).send(e.stack)
  }


};

exports.getContacts   = (req, res) => {

  try {

    res.status(200).marko(view, {
      $global: {
        htmlPath: 'contacts',
      },
    });

  } catch (e) {
    res.status(404).send(e.stack)
  }
};

//
exports.getTest = (req, res) => {
  renderHtml(req, res, 'test');
};

exports.sendEmail = (req, res) => {
//to: 'kolodiva@gmail.com, kolodiva@mail.ru, gl-@list.ru, adv.mfc@newfurnitura.ru' ,
  sendmail({
    from: 'adv@newfurnitura.ru',
    to: 'kolodiva@mail.ru, kolodiva@gmail.com, gl-@list.ru',
    subject: 'Информация о понижении уровня цен.',
    html: '<img class="" style="width: 12vw" src="https://www.newfurnitura.ru/upload/mailing/logo_big_orig.png"/><h4 style="color: blue">Наконец рады сообщить, что уровень цен опустился ниже нуля.<br/>Да здравствует ясновидец Глеб и все его планы... и весь 1 кабинет пусть будет в здравии.<h4><img class="" style="width: 12vw" src="https://newfurnitura.ru/upload/af19f6a1-aaba-4778-a943-ba9a0665.png"/><br/><a href="https://www.newfurnitura.ru/catalog/petli_4hsharnirnie">На базу</a>',
    attachments: [
      {
        filename: 'expo_msk_2019.pdf',
        path: '/home/ftp_user/www/images/mailing/expo_msk_2019.pdf'
      }
    ]
  }, function (err, reply) {

    console.log( err && err.stack )
    console.dir( reply )
  })


      res.status(200).send( 'ok' )


};

exports.get404 = (req, res) => {
  renderHtml(req, res, 404);
};

//
exports.getNum = async (req, res) => {

  let params = req.query;

  // console.log('routs params: ', req.params);
  // console.log('routs params: ', req.query);

  try {

    let result = await postgres.getNmnkl(dbpg, params.guidParent)

    // postgres.getNmnkl(dbpg, params.guidParent).then( res => {
    //
    //   return res.status(200).send('res');
    //
    // }
    //
    // )

    return res.status(200).send(result);

    //console.log('ffffffffff', result);


  } catch (e) {

    return res.status(404).send(e.stack)
  }

};
