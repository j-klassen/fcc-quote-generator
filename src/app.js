(function app() {
	// Endpoint
	var db = new Firebase('https://fcc-quote-machine.firebaseio.com/');
	var quotes = {};
	var quote;
	var intervalId;
	var working = false;

	var frames = [];
	var toggle = false;

	// Prep canvas
	var source = document.querySelector('.source');
	source.width = 400;
	source.height = 300;

	var sourceCtx = source.getContext('2d');

	// Prep glfx
	var glcanvas = fx.canvas();
	glcanvas.className = 'glcanvas';
	glcanvas.width = 400;
	glcanvas.height = 300;
	var texture = glcanvas.texture(source);

	// Add fx canvas to dom
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

			// Button click
			document.querySelector('.btn-quote').addEventListener('click', function (evt) {
				evt.preventDefault();

				if (working) {
					return;
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
				});
			});
		});
	});

	function draw() {
		sourceCtx.clearRect(0, 0, source.width, source.height);
		sourceCtx.globalCompositeOperation = '';
		sourceCtx.globalAlpha = 1;
		sourceCtx.drawImage(frames[toggle ? 1 : 0].image, 5, 15, source.width, source.height);
		sourceCtx.globalAlpha = 0.4;
		sourceCtx.globalCompositeOperation = 'lighter';
		//sourceCtx.drawImage(lines, 0, 0);

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
})();
