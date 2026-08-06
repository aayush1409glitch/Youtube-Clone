const https = require('https');
const http = require('http');
const fs = require('fs');

const url = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const file = fs.createWriteStream('test_download.mp4');

http.get(url, function(response) {
  if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    console.log('Redirecting to:', response.headers.location);
    https.get(response.headers.location, function(res2) {
       res2.pipe(file);
       res2.on('end', () => console.log('Downloaded!'));
    });
  } else {
    response.pipe(file);
    response.on('end', () => console.log('Downloaded! Status:', response.statusCode));
  }
}).on('error', function(err) {
  console.error(err);
});
