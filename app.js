const express = require('express');
const morgan = require('morgan');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { getColorFromURL } = require('color-thief-node');
const { ObjectId } = require('mongodb');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(morgan('tiny'));

const uri = "mongodb+srv://sharmarandrey:sharmarandrey@cluster0.zu7okjl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	}
});
let database;
const PORT = process.env.PORT || 3000;




app.set('view engine', 'ejs');
let images = [];

app.get('/', async (req, res) => {
	/* 	images.sort((a, b) => new Date(b.date) - new Date(a.date)); */
	images = await database.collection('images').find({}).sort({ date: -1 }).toArray();
	res.render('home', { images });
});

app.get('/add-image-form', (req, res) => {
	res.render('form', { isImagePosted: undefined, errorMessage: null });
});

// Endpoint para buscar imágenes por palabra clave en el título
app.get('search', async (req, res) => {
	//obtenemos parabla clave desde parametro de consulta "keyword"
	const keyword = req.query.keyword;
	//Cramos un Regex para buscar en mayusculas y menusculas
	const searchRegex = new RegExp(keyword, "i");
	const searchResults = await database.collection('images').find({ title: { $regex: searchRegex } }) //busamos imagenes donde el titulo va como parabla clave
		.sort({ date: -1 }) //Ordenamo el resultato por fecha
		.toArray();
	res.render('home', { images: searchResults })//Renderizamos la vista "home" con los resultados
});


app.post('/add-image-form', async (req, res) => {
	const { title, url, date, tag } = req.body;

	//Regex

	const titleRegex = /^[A-Za-z0-9_]{1,30}$/;
	/* const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg))$/; */
	const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg)\/?)$/;
	const tagRegex = /^[A-Za-z0-9_]{1,30}$/;

	if (!titleRegex.test(title)) {
		return res.render('form', { isImagePosted: false, errorMessage: 'Invalid title. Only letters, numbers, and underscore are allowed, and up to 30 characters.' });
	}
	if (!urlRegex.test(url)) {
		return res.render('form', { isImagePosted: false, errorMessage: 'Invalid URL. Must be a valid image URL (png, jpg, jpeg).' });
	}
	if (!tagRegex.test(tag)) {
		return res.render('form', { isImagePosted: false, errorMessage: 'Invalid label. Only letters, numbers, and underscore are allowed, and up to 30 characters.' });
	}
	const existingImage = images.find(image => image.url === url);
	if (existingImage) {
		return res.render('form', { isImagePosted: false, errorMessage: 'This URL already exists in the database.' });
	}

	const dominantColor = await getColorFromURL(url);
	const colorRGB = `RGB(${dominantColor.join(', ')})`;


	/* images.push({ title, url, date, color: colorRGB, tag }); */

	/** TODO: insertar un nuevo documento en la colección 'images'
	   *  El ID NO hay que insetarlo, dejad lo cree la base de datos.
	   */
	const newImage = { title, url, date, color: colorRGB, tag };
	try {
		await database.collection('images').insertOne(newImage);
		res.render('form', { isImagePosted: true, errorMessage: null });
	} catch (error) {
		res.render('form', { isImagePosted: false, errorMessage: 'Failed to save the image to the database.' });
	}


});

/* app.post('/delete-image', (req, res) => {
	const { url } = req.body;
	const imageIndex = images.findIndex(image => image.url === url);
	if (imageIndex !== -1) {
		images.splice(imageIndex, 1);
		res.redirect('/');

	} else {
		res.status(404).send('Image not found');
	}

}); */
app.post('/delete-image', async (req, res) => {
	const { id } = req.body;

	if (!ObjectId.isValid(id)) {
		return res.status(400).send('Invalid ID format');
	}

	try {
		const result = await database.collection('images').deleteOne({ _id: new ObjectId(id) });
		if (result.deletedCount === 0) {
			return res.status(404).send('Image not found');
		}
		res.redirect('/');
	} catch (error) {
		console.error('Error deleting image:', error);
		res.status(500).send('Error deleting image');
	}
});






app.listen(PORT, () => {
	database = client.db("fototeca");

	console.log("Server is listening on port 3000.");
});
