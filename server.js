require('marko/express'); //enable res.marko
require('marko/node-require').install();

var express     = require('express');
var compression = require('compression'); // Provides gzip compression for the HTTP response

const fileUpload = require('express-fileupload');

//var nodemailer = require('nodemailer');
var app = express();

//var port = process.env.PORT1 || 8080;
var port = process.env.PORT1 || 8081;

var router = express.Router();

var path = require('path');

const fs = require('fs');

var {createWorker} = require('tesseract.js');

const worker = createWorker({
  logger: m => console.log(m)
});

//var isProduction = process.env.NODE_ENV === 'production';
//var isProduction = false;
var isProduction = true;

// Configure lasso to control how JS/CSS/etc. is delivered to the browser
require( 'lasso' ).configure({
    plugins: [
        'lasso-marko' // Allow Marko templates to be compiled and transported to the browser
    ],
    outputDir: __dirname + '/static', // Place all generated JS/CSS/etc. files into the "static" dir
    bundlingEnabled: isProduction, // Only enable bundling in production
    minify: isProduction, // Only minify JS and CSS code in production
    fingerprintsEnabled: isProduction, // Only add fingerprints to URLs in production
});

app.use( require('lasso/middleware').serveStatic() );

app.use( compression() );

app.use( express.static( __dirname + '/public' ) );
app.use( express.static( __dirname + '/public/img' ) );

app.use(function(req, res, next) {
  res.setHeader( 'Set-Cookie', 'HttpOnly; Secure; SameSite=Strict' )
  next();
});

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//
app.set( 'appParams', { 'isProduction': isProduction, } );

//
app.post('/uploadocr', async (req, res) => {

    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded',
            });
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let fileocr = req.files.fileocr;

            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            await fileocr.mv('./public/images/ocr/' + fileocr.name);

            //recognize( './public/images/ocr/' + fileocr.name );

            //send response
            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name:     fileocr.name,
                    mimetype: fileocr.mimetype,
                    size:     fileocr.size,
                }
            });

            //console.log( trnslt );
            //recognize( './public/images/ocr/' + fileocr.name );

            (async function() {
              await worker.load();
              await worker.loadLanguage('rus');
              await worker.initialize('rus');
              const { data: { text } } = await worker.recognize( './public/images/ocr/' + fileocr.name + '.txt' );
              await worker.terminate();

              //worker = undefined;

              console.log(text);

              //console.log( fileName + '.txt' );

              //fs.writeFileSync( fileName + '.txt', text, 'utf8', (data) => { console.log( '11111111111111 ' + data ) } );
              //console.log(text);
              //return text;
            })();


        }
    } catch (err) {
        res.status(500).send(err);
    }
});


//

const routes = require('./src/routes');

//
router.get( '/index',               routes.getHome );
router.get( '/home',                routes.getHome );
router.get( '/',                    routes.getHome );

router.get( '/catalog/:guidParent', routes.getCatalog );
router.get( '/catalog',             routes.getCatalog );

router.get( '/exhibition',          routes.getExhibition );

router.get( '/filial_info/:id',     routes.getContacts );
router.get( '/filial_info',         routes.getContacts );

router.get( '/mailing',             routes.getMailing );
router.get( '/test',                routes.getTest );

router.get( '/getNum',              routes.getNum );
router.get( '/getFoundedNum',       routes.getFoundedNum );

//service route only mobile
router.get( '/sendEmail',           routes.sendEmail );

router.get( '/getActionFile',       routes.getActionFile );



//router.get( '/new',                 res.status(200).send( 'ok' ) );


router.get( '*',                    routes.get404 );

//
app.use('/', router);

app.listen(port, function(err) {
    if (err) {
        throw err;
    }
    console.log('Listening on port %d', port);

    // The browser-refresh module uses this event to know that the
    // process is ready to serve traffic after the restart
    if (process.send) {
        process.send('online');
    }
});
