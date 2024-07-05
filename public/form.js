const message = document.querySelector('#message');

if (message) {
	message.addEventListener('click', (event) => {
		event.target.style.display = 'none';
	});
}
