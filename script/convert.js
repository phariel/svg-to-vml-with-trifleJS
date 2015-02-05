var webPage = require('webpage');
var webserver = require('webserver');
var fs = require('fs');

var outputPath = 'output/';
var jqueryFile = 'lib/jquery.min.js';
var sieFile = 'lib/sie18-ef.1.js';
var vmlTempl = 'script/convert.html';

var svgName = 'rocket.svg';
var svgFile = 'svg-source/' + svgName;

var server = webserver.create();

server.listen(9527, function (req, res) {
	res.statusCode = 200;
	switch (req.url.split('/')[1]) {
		case "jquery":
			res.write(fs.read(jqueryFile));
			break;
		case "sie":
			res.write(fs.read(sieFile));
			break;
		case "svg":
			res.write(fs.read(svgFile));
			break;
		case "vml":
			res.write(fs.read(vmlTempl));
			break;
		default:
			res.write(fs.read(svgFile));
			break;
	}
	res.close();
});

var svgPage = webPage.create();
var svgContent;

svgPage.open('http://localhost:9527/svg/' + Date.now(), function (status) {
	svgPage.includeJs('http://localhost:9527/jquery', function () {
		svgContent = svgPage.evaluate(function () {
			var $ = window.$;
			return $('svg').wrap('<div></div>').parent().html();
		});
		svgPage.close();

		fs.write(outputPath + svgName, svgContent);
		convertToVml(encodeURIComponent(svgContent));
	});
});

function convertToVml(svgContent) {
	var vmlPage = webPage.create();
	vmlPage.open('http://localhost:9527/vml/' + Date.now(), function (status) {
		var vmlContent = vmlPage.evaluate(function (svgContent) {
			var $ = window.$;
			var $result = $('.result');
			$result.html('<script type="image/svg+xml">' + decodeURIComponent(svgContent) + '</script>');
			window.NAIBU._main();
			return $result.find('div').last().html();
		}, svgContent);

		fs.write(outputPath + svgName.replace(".svg", ".vml"), vmlContent);
		phantom.exit();
	});
}



