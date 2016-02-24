// See http://www.zachstronaut.com/posts/2012/08/17/webgl-fake-crt-html5.html
// for some inspiration in the overall effect.
//
// Some learning for getting the monitor borders: https://css-tricks.com/snippets/css/multiple-borders/

(function app() {
	// Endpoint
	// Query Firebase once and generate random quotes locally.
	// Quotes generated from http://quotes.stormconsultancy.co.uk/random.json
	// and saved to Firebase.
	var db = new Firebase('https://fcc-quote-machine.firebaseio.com/');
	var tweetUrl = 'https://twitter.com/intent/tweet?hashtags=quotes&text=';
	var quotes = {};
	var quote;
	var intervalId;
	var working = false;
	var ratio = 3/4;
	var canvasPadding = 5;
	var canvasBorderFactor = 0.7;
	// Store a couple of frames for easily toggling
	var frames = [];
	var toggle = false;

	var glcanvasWrapper = document.querySelector('.glcanvas-wrapper');
	var width = window.getComputedStyle(glcanvasWrapper).width.split('px')[0];
	width = Math.floor(width * canvasBorderFactor) + canvasPadding * 2;

	// Prep hidden canvas
	var source = document.querySelector('.source');
	source.width = width;
	source.height = width * ratio;

	var sourceCtx = source.getContext('2d');

	// Prep glfx canvas (effects)
	var glcanvas = fx.canvas();
	glcanvas.className = 'glcanvas';
	glcanvas.width = source.width;
	glcanvas.height = source.height;
	var texture = glcanvas.texture(source);

	// Generate and add some border dom elements
	var glcanvasBorder2 = document.createElement('div');
	glcanvasBorder2.className = 'glcanvas-border2';

	var glcanvasBorder1 = document.createElement('div');
	glcanvasBorder1.className = 'glcanvas-border1';

	glcanvasBorder2.appendChild(glcanvasBorder1);
	glcanvasBorder1.appendChild(glcanvas);
	document.querySelector('.glcanvas-container').appendChild(glcanvasBorder2);

	// After styling is applied, get proper height
	glcanvasBorder1.style.height = window.getComputedStyle(glcanvas).height;

	// Load and draw
	db.child('quotes').on('value', function(snapshot) {
		quotes = snapshot.val();
		// Random quote
		quote = _.sample(_.keys(quotes));

		document.querySelector('.quote-body').innerHTML = '&quot;' + quotes[quote].quote + '&quot;';
		document.querySelector('.quote-footer').innerHTML = '- ' + quotes[quote].author;

		rasterizeHTML.drawHTML(document.querySelector('.quote-wrapper').outerHTML)
		.then(function (result) {
			frames.push(result);

			// Blink cursor
			document.querySelector('.cursor').innerHTML = '&gt;';

			return rasterizeHTML.drawHTML(document.querySelector('.quote-wrapper').outerHTML)
		})
		.then(function (result) {
			frames.push(result);

			intervalId = setInterval(draw, 500);

			// Button clicks
			document.querySelector('.btn-quote').addEventListener('click', buttonQuoteClick);
			document.querySelector('.btn-tweet').addEventListener('click', buttonTweetClick);
		});
	});

	function draw() {
		// We'll take advantage of some cavas composition effects here.
		sourceCtx.clearRect(0, 0, source.width, source.height);
		sourceCtx.globalCompositeOperation = '';
		sourceCtx.globalAlpha = 1;
		sourceCtx.drawImage(frames[toggle ? 1 : 0].image, 5, 5, source.width - 5, source.height);
		sourceCtx.globalAlpha = 0.4;
		sourceCtx.globalCompositeOperation = 'lighter';

		// Draw to glfx
		texture.loadContentsOf(source);
		glcanvas.draw(texture)
		.vignette(0, 0.5)
		.brightnessContrast(0.12, 0.27)
		.hueSaturation(0, 0.5)
		.bulgePinch(source.width / 2, source.height / 2, 280, 0.08)
		.noise(0.1)
		.update();

		toggle = !toggle;
	}

	function buttonQuoteClick(evt) {
		evt.preventDefault();

		if (working) {
			return;
		} else {
			working = true;
		}

		clearInterval(intervalId);
		frames = [];

		var oldQuote = quote;
		while (quote === oldQuote) {
			quote = _.sample(_.keys(quotes));
		}

		document.querySelector('.quote-body').innerHTML = '&quot;' + quotes[quote].quote + '&quot;';
		document.querySelector('.quote-footer').innerHTML = '- ' + quotes[quote].author;
		// Blink cursor
		document.querySelector('.cursor').innerHTML = '&gt; _';

		rasterizeHTML.drawHTML(document.querySelector('.quote-wrapper').outerHTML)
		.then(function (result) {
			frames.push(result);

			// Blink cursor
			document.querySelector('.cursor').innerHTML = '&gt;';

			return rasterizeHTML.drawHTML(document.querySelector('.quote-wrapper').outerHTML)
		})
		.then(function (result) {
			frames.push(result);

			draw();
			intervalId = setInterval(draw, 500);

			working = false;
		});
	}

	function buttonTweetClick(evt) {
		var intent = tweetUrl + encodeURIComponent('"' + quotes[quote].quote + '" - ' + quotes[quote].author);
		document.querySelector('.btn-tweet a').herf = intent;
		window.location = intent;
	}
})();
