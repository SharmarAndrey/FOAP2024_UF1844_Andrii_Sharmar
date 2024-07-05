const express = require('express');
const morgan = require('morgan');

const { getColorFromURL } = require('color-thief-node');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(morgan('tiny'));

const images = [];

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
	images.sort((a, b) => new Date(b.date) - new Date(a.date));
	res.render('home', { images });
});

app.get('/add-image-form', (req, res) => {
	res.render('form', { isImagePosted: undefined, errorMessage: null });
});

app.post('/add-image-form', async (req, res) => {
	const { title, url, date } = req.body;

	const titleRegex = /^[A-Za-z0-9_]{1,30}$/;
	const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg))$/;

	if (!titleRegex.test(title)) {
		return res.render('form', { isImagePosted: false, errorMessage: 'Invalid title. Only letters, numbers, and underscore are allowed, and up to 30 characters.' });
	}
	if (!urlRegex.test(url)) {
		return res.render('form', { isImagePosted: false, errorMessage: 'Invalid URL. Must be a valid image URL (png, jpg, jpeg).' });
	}

	const existingImage = images.find(image => image.url === url);
	if (existingImage) {
		return res.render('form', { isImagePosted: false, errorMessage: 'This URL already exists in the database.' });
	}

	const dominantColor = await getColorFromURL(url);
	const colorRGB = `RGB(${dominantColor.join(', ')})`;

	images.push({ title, url, date, color: colorRGB });

	res.render('form', { isImagePosted: true, errorMessage: null });
});

app.listen(3000, () => {
	console.log("Servidor escuchando correctamente en el puerto 3000.");
});
