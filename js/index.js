// Carrito simple: añadir, mostrar, actualizar cantidad, eliminar, persistir en localStorage
document.addEventListener('DOMContentLoaded', async () => {
	// Products container and dynamic load
	const productsContainer = document.getElementById('contenedorProductos');

	// Load products from JSON and render
	await loadProducts();
	const cartToggle = document.getElementById('cart-toggle');
	const cart = document.getElementById('cart');
	const cartClose = document.getElementById('cart-close');
	const cartItemsContainer = document.getElementById('cart-items');
	const cartTotalEl = document.getElementById('cart-total');
	const cartCountEl = document.getElementById('cart-count');
	const cartClearBtn = document.getElementById('cart-clear');
	const checkoutBtn = document.getElementById('checkout');

	let cartData = loadCart();
	renderCart();

	// inicializar reseñas (calculo promedio)
	initReviews();

	// Use event delegation so dynamically added buttons work
	if (productsContainer) {
		productsContainer.addEventListener('click', (e) => {
			const btn = e.target.closest('.add-to-cart');
			if (btn) onAddClick(e);
		});
	}
	cartToggle.addEventListener('click', (e) => { e.preventDefault(); toggleCart(); });
	cartClose.addEventListener('click', () => closeCart());
	cartClearBtn.addEventListener('click', () => { cartData = []; saveCart(); renderCart(); });
	checkoutBtn.addEventListener('click', () => { alert('Gracias por su compra (demo).'); cartData = []; saveCart(); renderCart(); closeCart(); });

	// functions
	function onAddClick(e) {
		e.preventDefault();
		const productEl = e.target.closest('.product');
		const name = productEl.querySelector('h3').textContent.trim();
		const img = productEl.querySelector('img')?.getAttribute('src') || '';
		const priceText = productEl.querySelector('h4').textContent.trim();
		const price = parsePrice(priceText);

		addToCart({ name, img, price });
	}

	function addToCart(item) {
		const existing = cartData.find(i => i.name === item.name);
		if (existing) {
			existing.qty += 1;
		} else {
			cartData.push({ ...item, qty: 1 });
		}
		saveCart();
		renderCart();
		openCartBrief();
	}

	function renderCart() {
		cartItemsContainer.innerHTML = '';
		let total = 0;
		let count = 0;
		if (cartData.length === 0) {
			cartItemsContainer.innerHTML = '<p class="empty">El carrito está vacío</p>';
		} else {
			cartData.forEach((it, idx) => {
				const itemEl = document.createElement('div');
				itemEl.className = 'cart-item';
				itemEl.innerHTML = `
					<img src="${it.img}" alt="${it.name}">
					<div class="item-info">
						<h4>${it.name}</h4>
						<p class="item-price">$${formatNumber(it.price)}</p>
						<div class="qty-controls">
							<button class="qty-decrease" data-idx="${idx}">-</button>
							<span class="qty">${it.qty}</span>
							<button class="qty-increase" data-idx="${idx}">+</button>
							<button class="remove" data-idx="${idx}" title="Eliminar">Eliminar</button>
						</div>
					</div>
				`;
				cartItemsContainer.appendChild(itemEl);

				total += it.price * it.qty;
				count += it.qty;
			});
		}

		cartTotalEl.textContent = `$${formatNumber(total)}`;
		cartCountEl.textContent = count;

		// attach qty/remove listeners
		cartItemsContainer.querySelectorAll('.qty-increase').forEach(b => b.addEventListener('click', onIncrease));
		cartItemsContainer.querySelectorAll('.qty-decrease').forEach(b => b.addEventListener('click', onDecrease));
		cartItemsContainer.querySelectorAll('.remove').forEach(b => b.addEventListener('click', onRemove));
	}

	function onIncrease(e) {
		const idx = +e.target.dataset.idx;
		cartData[idx].qty += 1;
		saveCart(); renderCart();
	}

	function onDecrease(e) {
		const idx = +e.target.dataset.idx;
		if (cartData[idx].qty > 1) {
			cartData[idx].qty -= 1;
		} else {
			cartData.splice(idx, 1);
		}
		saveCart(); renderCart();
	}

	function onRemove(e) {
		const idx = +e.target.dataset.idx;
		cartData.splice(idx, 1);
		saveCart(); renderCart();
	}

	function saveCart() {
		localStorage.setItem('cart', JSON.stringify(cartData));
	}

	function loadCart() {
		try {
			const raw = localStorage.getItem('cart');
			return raw ? JSON.parse(raw) : [];
		} catch (err) {
			return [];
		}
	}

	function parsePrice(text) {
		// example: "$20.000" -> 20000
		const cleaned = text.replace(/[^0-9,\.]/g, '').replace(/\./g, '').replace(/,/g, '.');
		const num = parseFloat(cleaned);
		return isNaN(num) ? 0 : num;
	}

		// --- Load products dynamically from JSON ---
		async function loadProducts() {
			if (!productsContainer) return;
			try {
				const res = await fetch('./data/productos.json');
				if (!res.ok) throw new Error('No se pudo cargar productos');
				const productos = await res.json();
				productsContainer.innerHTML = '';
				productos.forEach(prod => {
					const div = document.createElement('div');
					div.className = 'product';
					div.innerHTML = `
						<img src="${prod.imagen}" alt="${prod.nombre}">
						<h3>${prod.nombre}</h3>
						<h4>$${formatNumber(prod.precio)}</h4>
						<a href="#" class="add-to-cart" data-id="${prod.id}" data-nombre="${escapeHtml(prod.nombre)}" data-precio="${prod.precio}">Agregar carrito</a>
					`;
					productsContainer.appendChild(div);
				});
			} catch (err) {
				productsContainer.innerHTML = '<p class="empty">No se pudieron cargar los productos.</p>';
				console.error(err);
			}
		}

		function escapeHtml(s) {
			return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
		}

		function initReviews() {
			const reviews = Array.from(document.querySelectorAll('.review'));
			if (reviews.length === 0) return;
			const total = reviews.reduce((sum, r) => sum + Number(r.dataset.rating || 0), 0);
			const avg = total / reviews.length;
			const avgNumEl = document.getElementById('reviews-average-num');
			const avgStarsEl = document.getElementById('reviews-average-stars');
			const reviewsCountEl = document.getElementById('reviews-count');
			if (avgNumEl) avgNumEl.textContent = avg.toFixed(1);
			if (reviewsCountEl) reviewsCountEl.textContent = `${reviews.length} reseñas`;

			// render stars rounded to nearest integer
			if (avgStarsEl) {
				avgStarsEl.innerHTML = '';
				const rounded = Math.round(avg);
				for (let i = 1; i <= 5; i++) {
					const iEl = document.createElement('i');
					iEl.className = 'fa-solid fa-star' + (i <= rounded ? ' filled' : '');
					avgStarsEl.appendChild(iEl);
				}
			}
		}

	function formatNumber(n) {
		return n.toLocaleString('es-AR');
	}

	function toggleCart() {
		const open = cart.classList.toggle('open');
		cart.setAttribute('aria-hidden', !open);
	}

	function closeCart() {
		cart.classList.remove('open');
		cart.setAttribute('aria-hidden', 'true');
	}
	// cerrar carrito al click fuera
	document.addEventListener('click', (e) => {
		const isOpen = cart.classList.contains('open');
		if (!isOpen) return;
		const insideCart = e.composedPath().includes(cart);
		const clickedToggle = e.target.closest('#cart-toggle');
		if (!insideCart && !clickedToggle) closeCart();
	});

	// --- Contact form via Formspree (AJAX) ---
	const contactForm = document.getElementById('contact-form');
	if (contactForm) {
		const contactMessage = document.getElementById('contact-message');
		contactForm.addEventListener('submit', async (ev) => {
			ev.preventDefault();
			const submitBtn = contactForm.querySelector('.btn-enviar');
			// Prevent submit if Formspree endpoint placeholder hasn't been replaced
			if (contactForm.action.includes('FORM_ID')) {
				contactMessage.className = 'contact-error';
				contactMessage.textContent = 'Formulario no configurado: reemplaza FORM_ID con tu endpoint de Formspree (ver instrucciones en el HTML).';
				return;
			}

			const fd = new FormData(contactForm);
			try {
				submitBtn.disabled = true;
				submitBtn.textContent = 'Enviando...';
				const resp = await fetch(contactForm.action, {
					method: 'POST',
					body: fd,
					headers: { 'Accept': 'application/json' }
				});
				let data = {};
				try { data = await resp.json(); } catch (e) { /* ignore if no json */ }
				if (resp.ok) {
					contactMessage.className = 'contact-success';
					contactMessage.textContent = 'Gracias! Tu mensaje fue enviado correctamente. Revisa tu correo.';
					contactForm.reset();
				} else {
					contactMessage.className = 'contact-error';
					contactMessage.textContent = data.error || data.message || 'Ocurrió un error al enviar. Intenta nuevamente.';
				}
			} catch (err) {
				contactMessage.className = 'contact-error';
				contactMessage.textContent = 'Ocurrió un error de red. Revisa tu conexión y vuelve a intentar.';
			} finally {
				submitBtn.disabled = false;
				submitBtn.textContent = 'Enviar';
				// clear message after a short delay
				setTimeout(() => { contactMessage.textContent = ''; contactMessage.className = ''; }, 7000);
			}
		});
	}

	function openCartBrief() {
		cart.classList.add('open');
		cart.setAttribute('aria-hidden', 'false');
		setTimeout(() => { cart.classList.remove('open'); cart.setAttribute('aria-hidden', 'true'); }, 1500);
	}
});

