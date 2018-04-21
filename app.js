const http    = require('http')
    , fs      = require('fs')
    , url     = require('url')
    , path    = require('path')
    , open    = require('open')
    , _       = require('underscore')
    , docsDir = './docs';

const mimeTypes = {
  '.js':   'text/javascript',
  '.html': 'text/html',
  '.css':  'text/css'
};

const exceptions = [
  'a', 'an', 'the',
  'and', 'or', 'in', 'for', 'from', 'with', 'on', 'about', 'as', 'but', 'by', 'so',
  'at', 'to', 'of', 'if',
  'that', 'this', 'there', 'those', 'these',
  'I', 'i', 'me', 'my',
  'he', 'his',
  'she', 'her',
  'it', 'its',
  'you', 'your',
  'we', 'our', 'us',
  'they', 'them', 'their',
  'be', 'been', 'is', 'was', 'are', 'will', 'not', 'no',
  'all', 'here', 'more', 'just', 'too',
  'have', 'had', 'has', 'let',
  'can', 'could', 'must',
  'should',
  'do', 'did', 'done', 'doing',
  'go', 'went', 'gone', 'going',
  'why', 'what', 'who', 'where', 'when', 'because', 'enough', 'ago',
  "that\'s", "we\'re", "let\'s", "we\'ve", "it\'s", "what\'s", "don\'t", "i\'ve", "didn\'t", "can\'t"
];

let fileCounter  = 0
  , wordsArr     = []
  , filteredArr  = [];

let opts = {
  limit:  0,      // limit on the most frequently used words
  lock:   false,  // lock to prevent the executing of the function 'readDir()' for the second time
  result: false,  // the existence of the result executing of the function 'readDir()'
  opened: false   // whether the browser was opened
};

// Run the node server
function show() {

  http.createServer(function onRequest(request, response) {
  
    let pathname = url.parse(request.url).pathname;
    
    if (pathname == '/' || pathname == '/js/common.js') {
      if (pathname == '/') {
        pathname = '/index.html';
      }

      const mimeType = mimeTypes[path.extname(pathname)];

      pathname = pathname.substring(1, pathname.length);

      fs.readFile(pathname, 'utf8', (error, data) => {
  
        if (error) {
          process.stdout.write(`Could not find or open file ${ pathname } for reading\n`);
        } else {
          response.writeHead(200, {'Content-Type': mimeType});
          response.end(data);
        }
      });

    } else if (pathname == '/data.json') {
      response.end(JSON.stringify(filteredArr));
    } else {
      response.end('Page not found');
    }

  }).listen(8080, () => process.stdout.write(`Server is listening on port 8080...\n`));
}

// The main function
function calc() {

  // uniqWords - an array which contains only unique words
  // arr       - an empty array for the result
  let uniqWords = _.uniq(_.unzip(wordsArr)[0])
    , arr       = [];

  // Loading bar in command line
  const loading = (c, t) => {
    const percent = Math.round(c / t * 100);

    const bar = p => {
      if (p < 10) {
        return '|>---------|';
      } else if (p >= 10 && p < 20) {
        return '|=>--------|'
      } else if (p >= 20 && p < 30) {
        return '|==>-------|'
      } else if (p >= 30 && p < 40) {
        return '|===>------|'
      } else if (p >= 40 && p < 50) {
        return '|====>-----|'
      } else if (p >= 50 && p < 60) {
        return'|=====>----|'
      } else if (p >= 60 && p < 70) {
        return '|======>---|'
      } else if (p >= 70 && p < 80) {
        return '|=======>--|'
      } else if (p >= 80 && p < 90) {
        return '|========>-|'
      } else if (p >= 90 && p < 100) {
        return '|=========>|'
      } else {
        return '|==========|'
      }
    }

    return `${ bar(percent) } ${ percent }%\r`;    
  }

  process.stdout.write(`Total words: ${ wordsArr.length }\n`);
  process.stdout.write(`Unique words: ${ uniqWords.length }\n\n`);

  uniqWords.forEach( (uniqWord, i1) => {

    let wordCounter = 0
      , sentences   = []
      , files       = [];

    wordsArr.forEach( (wordArr, i2) => {

      const word     = wordArr[0]
          , sentence = wordArr[1]
          , file     = wordArr[2];

      // Whether the unique word is equal to the word from 'wordsArr' and not in 'exceptions' list
      if (uniqWord == word && _.indexOf(exceptions, uniqWord) == -1) {
        wordCounter++;
        sentences.push(sentence);
        files.push(file);
      }
    });

    process.stdout.write(`Word Count: ${ loading(i1, uniqWords.length-1) }`)

    // Select only unique file names
    files = _.uniq(files);

    // Select only unique sentences
    sentences = _.uniq(sentences);

    arr.push([wordCounter, uniqWord, files, sentences]);
  });

  // Sort the 'arr' array by the most frequently used words ('wordCounter')
  arr = arr.sort( (a,b) => b[0]-a[0] );

  // Get only words that are limited by 'opts.limit'
  filteredArr = arr.slice(0, opts.limit);

  opts.result = true;

  process.stdout.write(`\n\n${ opts.limit } the most frequently used words: ${ _.unzip(filteredArr)[1].join(', ') }\n\n`);
  process.stdout.write(`\nJust press 'Enter' to see the result\n`);

}

function readDir(files) {

  // Read each file of 'files'
  files.forEach( (file, i) => {

    // Path to the 'file'
    const filePath = `${ docsDir }/${ file }`;
    
    // Read 'file' using 'filePath'
    fs.readFile(filePath, (error, data) => {

      if (error) {
        process.stdout.write(`${ error }\n`);

      } else {
        // text - the whole text of the 'file' without '\n', '\t' and '\r' signs
        // sentences - 'text' splited in sentences
        let text      = data.toString().replace(/[\n\t\r]/g, '').replace(/U.S./g, 'US')
          , sentences = text.replace(/\. /g,'.').replace(/ +(?= )/g, '').split('.');

        // Revome the last always empty sentence
        sentences.splice(-1);
        process.stdout.write(`Reading a file ${ file }...\n`);
        process.stdout.write(`${ sentences.length } sentences found\n\n`);

        sentences.forEach( sentence => {
          
          // Get words of the selected sentence
          _.compact(sentence.replace(/[.,?!“”":;/]|- |--|''/g, ' ')
            .replace(/ +(?= )/g, '')
            .split(' ')
            .map( w => (w.toUpperCase() != w) ? w.toLowerCase() : w ))
            // Make an 'wordsArr' array of every word with 'word', 'sentence' where this word is used and 'file' where the word is used
            .forEach( word => wordsArr.push([word, sentence, file]));
        });

        // Counter which prevents premature exit from the 'forEach' loop
        fileCounter++;

        // Exit from the loop with calling function 'calc()' after reading the last file
        if (fileCounter == files.length) {
          calc();
        }
      }
    });
  });
}

// Read files in 'docsDir' (./docs)
fs.readdir(docsDir, (err, files) => {

  // Check whether files exist
  if (files) {

    process.stdout.write(`Enter the number of the most frequently used words to display:\n`);

    // Start listening command line
    process.stdin.on('readable', () => {

      // Get 'data' for command line
      const data = process.stdin.read();
      
      if (data !== null) {

        // Whether a  function 'readDir()' has been run and whether we have the result of it
        if (!opts.lock && !opts.result) {
          const n = parseInt(data);

          // Whether 'n' is a number
          if (!isNaN(n)) {

            // Prevent to run a function 'readDir()' twice in a future
            opts.lock  = true;

            // Assing 'n' to the global 'limit'
            opts.limit = n;
            process.stdout.write(`\n`);

            // Run a function 'readDir()'
            readDir(files);

          } else {
            process.stdout.write(`Wrong number. Try again.\n`)
          }

        } else {

          // Whether we already have the result of calculations and pressed 'Enter' and the browser wasn't open before
          if (opts.result && data.length == 1 && !opts.opened) {

            opts.opened = true;

            // Run the node server
            show();

            // Open the browser with link
            open('http://localhost:8080');
          } else {
            process.stdout.write(`Bye\n`);
            process.exit();
          }
        }
      }
    });

  } else {
    process.stdout.write(`Can not be found ${ docsDir } directory or files in it\n`);
    process.exit();
  }
});