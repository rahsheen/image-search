require('dotenv').config();
var express = require('express');
var request = require('request');
var mongodb = require('mongodb').MongoClient;
// var fs = require('fs');
// var mockData = JSON.parse(fs.readFileSync('./test.json', 'utf8'));

var port = process.env.PORT || 3000;
var url = process.env.MONGO_DB_URL;
var imgurID = process.env.IMGUR_CLIENT_ID;
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

	request(options, function callback(error, response, body) {
		if (error) return res.status(response.status).end(error);

		if (response.statusCode == 200) {

			var info = JSON.parse(body).data
				.filter(result => !result.is_album)
				.map(data => {
					return {
						alt: data.title,
						url: data.link,
						page: 'http://imgur.com/gallery/' + data.id
					};
				});

			mongodb.connect(url, (err, db) => {
				if (err) throw err;

				var searchHistory = db.collection('searchHistory');

				var searchInfo = {
					"term": keywords,
					"when": new Date()
				}

				searchHistory.insert(searchInfo, (err, data) => {
					if (err) throw err;
				});

				db.close();
			});

			res.status(200).end(JSON.stringify(info));
		}
	});
};

var latestRoute = function (req, res) {

	mongodb.connect(url, function (err, db) {
		if (err) throw err;

		var searchHistory = db.collection('searchHistory');

		// Pull the last 25 successful searches
		var latestSearches = searchHistory.find({})
			.sort({ $natural: -1 })
			.limit(25)
			.toArray().then(data => res.status(200).end(JSON.stringify(data)));

		db.close();
	});
};

app.get('/api/search/:keywords', searchRoute);
app.get('/api/latest/', latestRoute);

app.use(express.static('public'));

app.listen(port, function (err) {
	console.log('Server running on port ' + port);
});
