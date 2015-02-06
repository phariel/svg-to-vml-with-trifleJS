var webPage = require('webpage');
var webserver = require('webserver');
var fs = require('fs');
var args = require('system').args;

var outputPath = 'output/';
var jqueryFile = 'lib/jquery.min.js';
var sieFile = 'lib/sie18-ef.1.js';
var vmlTempl = 'script/convert.html';


var fileIndex = 0;
var path = args[1];
var list = fs.list(path);


if (args.length === 1) {
	console.log("Please pass a path");
} else {
	main();
}


function main() {
	var server = webserver.create();
	server.listen(9527, function (req, res) {
		res.statusCode = 200;
		var url = req.url;
		var query = url.split('/');
		switch (query[1]) {
			case "jquery":
				res.write(fs.read(jqueryFile));
				break;
			case "sie":
				res.write(fs.read(sieFile));
				break;
			case "svg":
				var urlSvg = url.replace('/svg/', '/');
				res.write(fs.read(urlSvg.substring(urlSvg.indexOf('/') + 1)));
				break;
			case "vml":
				res.write(fs.read(vmlTempl));
				break;
			default:
				res.write(fs.read(vmlTempl));
				break;
		}
		res.close();
	});

	parseSvg(list[fileIndex]);
}

function parseSvg(fileNameAndPath) {
	var svgPage = webPage.create();
	var svgContent;

	svgPage.open('http://localhost:9527/svg/' + fileNameAndPath, function (status) {
		svgPage.includeJs('http://localhost:9527/jquery', function () {
			svgContent = svgPage.evaluate(function () {
				var $ = window.$;
				return $('svg').wrap('<div></div>').parent().html();
			});

			svgPage.close();

			var fileName = fileNameAndPath.substring(fileNameAndPath.lastIndexOf('/') + 1);

			fs.write(outputPath + fileName, svgContent);
			convertToVml(encodeURIComponent(svgContent), fileName);
		});
	});
}


function convertToVml(svgContent, fileName) {
	var vmlPage = webPage.create();
	vmlPage.open('http://localhost:9527/vml', function (status) {
		var vmlContent = vmlPage.evaluate(function (svgContent) {
			var $ = window.$;
			var $result = $('.result');
			$result.html('<script type="image/svg+xml">' + decodeURIComponent(svgContent) + '</script>');
			window.NAIBU._main();
			return $result.html();
		}, svgContent);

		vmlPage.close();

		fs.write(outputPath + fileName.replace(".svg", ".vml"), vmlContent);

		fileIndex++;
		if (fileIndex === list.length) {
			console.log("Convert SVG complete");
			phantom.exit();
		} else {
			parseSvg(list[fileIndex]);
		}
	});
}



