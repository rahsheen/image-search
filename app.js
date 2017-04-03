var express = require('express');
var request = require('request');
var mongodb = require('mongodb').MongoClient;
var fs = require('fs');
var mockData = JSON.parse(fs.readFileSync('./test.json', 'utf8'));

var port = process.env.PORT || 5000;
var url = "mongodb://localhost";
var imgurID = '585e42d5c27ca99';
var imgurSecret = '630eb7f3e0fbf3c7ab143ab28c3250dded1d55c4';
var imgurAuthHeader = 'Client-ID ' + imgurID;
var imgurSearchUrl = 'https://api.imgur.com/3/gallery/search/top';

var app = express();

var searchRoute = function (req, res) {
	var keywords = req.params.keywords;
	var offset = req.query.offset || 0;
	var queryRoute = imgurSearchUrl;

	queryRoute += '/' + offset + '/?q=' + encodeURIComponent(keywords);

	var options = {
		url: queryRoute,
		headers: {
			'Authorization': imgurAuthHeader
		}
	};

	// request(options, function callback(error, response, body) {
	// 	if (error) res.status(401).send(error);

	// 	if (response.status == 200) {
	// 		var info = JSON.parse(body);

	// 		res.status(200).send(response.body);
	// 	}
	// });

	res.status(200).send(mockData.data
		.filter(result => !result.is_album)
		.map(data => {
			return {
				alt: data.title,
				url: data.link,
				page: 'http://imgur.com/gallery/'+data.id
			};
		}));
};

var latestRoute = function (req, res) {
	var keywords = req.params.keywords;

	res.status(200).send("Latest OK");
};

app.get('/api/imagesearch/:keywords', searchRoute);
app.get('/api/latest/', latestRoute);

app.use(express.static('public'));

app.listen(port, function (err) {
	console.log('Server running on port ' + port);
});
