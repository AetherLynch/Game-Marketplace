/* ============================================================
   Game Marketplace (Vanilla JS)
   - Catálogo con filtros, búsqueda, ordenamiento
   - Carrito con persistencia en localStorage
   ============================================================ */

// ----- Datos de ejemplo (puedes reemplazar por fetch a tu API) -----
const PRODUCTS = [
  {
    id: "g1",
    title: "Elden Ring",
    platform: "PC",
    price: 1199,
    studio: "FromSoftware",
    release: "2022-02-25",
    cover: "img/EldenRing.webp"
  },
  {
    id: "g2",
    title: "The Legend of Zelda: Tears of the Kingdom",
    platform: "Nintendo",
    price: 1399,
    studio: "Nintendo",
    release: "2023-05-12",
    cover: "img/TheLegendofZelda.webp"
  },
  {
    id: "g3",
    title: "Forza Horizon 5",
    platform: "Xbox",
    price: 999,
    studio: "Playground Games",
    release: "2021-11-09",
    cover: "img/Forza.jpg"
  },
  {
    id: "g4",
    title: "God of War Ragnarök",
    platform: "PlayStation",
    price: 1299,
    studio: "Santa Monica Studio",
    release: "2022-11-09",
    cover: "img/ragnarok.jpg"
  },
  {
    id: "g5",
    title: "Hades II (Accesso anticipado)",
    platform: "PC",
    price: 549,
    studio: "Supergiant Games",
    release: "2024-05-06",
    cover: "img/hades.jpg"
  },
  {
    id: "g6",
    title: "Mario Kart 8 Deluxe",
    platform: "Nintendo",
    price: 999,
    studio: "Nintendo",
    release: "2017-04-28",
    cover: "img/mario.jpg"
  },
  {
    id: "g7",
    title: "Spider-Man 2",
    platform: "PlayStation",
    price: 1299,
    studio: "Insomniac Games",
    release: "2023-10-20",
    cover: "img/spiderman.jpg"
  },
  {
    id: "g8",
    title: "Starfield",
    platform: "Xbox",
    price: 1199,
    studio: "Bethesda",
    release: "2023-09-06",
    cover: "img/starfiel.jpg"
  }
];

// ----- Estado global -----
const state = {
  query: "",
  platform: "all",
  minPrice: "",
  maxPrice: "",
  sort: "relevance",
  cart: loadCart()
};

// ----- Utilidades -----
function formatCurrency(mx) {
  return mx.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function loadCart() {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(state.cart));
}

function getCartCount() {
  return Object.values(state.cart).reduce((acc, it) => acc + it.qty, 0);
}

function getCartSubtotal() {
  return Object.values(state.cart).reduce((acc, it) => acc + it.qty * it.price, 0);
}

// ----- Render de catálogo -----
const $grid = document.getElementById("catalogGrid");
const $empty = document.getElementById("emptyState");

function applyFilters(products) {
  const { query, platform, minPrice, maxPrice } = state;
  return products.filter(p => {
    const matchesQuery =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.studio.toLowerCase().includes(query);

    const matchesPlatform = platform === "all" || p.platform === platform;

    const priceOKMin = minPrice === "" || p.price >= Number(minPrice);
    const priceOKMax = maxPrice === "" || p.price <= Number(maxPrice);

    return matchesQuery && matchesPlatform && priceOKMin && priceOKMax;
  });
}

function applySort(products) {
  const arr = [...products];
  switch (state.sort) {
    case "price-asc":
      arr.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      arr.sort((a, b) => b.price - a.price);
      break;
    case "title-asc":
      arr.sort((a, b) => a.title.localeCompare(b.title, "es"));
      break;
    case "title-desc":
      arr.sort((a, b) => b.title.localeCompare(a.title, "es"));
      break;
    case "date-desc":
      arr.sort((a, b) => new Date(b.release) - new Date(a.release));
      break;
    default:
      // relevance: sin cambios (podrías implementar ranking)
      break;
  }
  return arr;
}

function renderCatalog() {
  const filtered = applyFilters(PRODUCTS);
  const sorted = applySort(filtered);

  $grid.innerHTML = "";
  if (sorted.length === 0) {
    $empty.hidden = false;
    return;
  }
  $empty.hidden = true;

  const frag = document.createDocumentFragment();
  sorted.forEach(p => {
    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <div class="card-media">
        <img src="${p.cover}" alt="Portada de ${p.title}" loading="lazy">
        <span class="chip">${p.platform}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <p class="muted">${p.studio}</p>
        <div class="card-row">
          <span class="price">${formatCurrency(p.price)}</span>
          <button class="btn btn-sm btn-primary" data-add="${p.id}">Agregar</button>
        </div>
        <p class="tiny muted">Lanzamiento: ${new Date(p.release).toLocaleDateString("es-MX")}</p>
      </div>
    `;
    frag.appendChild(card);
  });
  $grid.appendChild(frag);
}

// ----- Carrito -----
const $cartDrawer = document.getElementById("cartDrawer");
const $backdrop = document.getElementById("backdrop");
const $btnCart = document.getElementById("btnCart");
const $btnCloseCart = document.getElementById("btnCloseCart");
const $cartItems = document.getElementById("cartItems");
const $cartSubtotal = document.getElementById("cartSubtotal");
const $cartCount = document.getElementById("cartCount");
const $btnEmptyCart = document.getElementById("btnEmptyCart");
const $btnCheckout = document.getElementById("btnCheckout");

function openCart() {
  $cartDrawer.setAttribute("aria-hidden", "false");
  $btnCart.setAttribute("aria-expanded", "true");
  $backdrop.hidden = false;
  document.body.classList.add("no-scroll");
}

function closeCart() {
  $cartDrawer.setAttribute("aria-hidden", "true");
  $btnCart.setAttribute("aria-expanded", "false");
  $backdrop.hidden = true;
  document.body.classList.remove("no-scroll");
}

function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  if (!state.cart[productId]) {
    state.cart[productId] = { id: product.id, title: product.title, price: product.price, qty: 0 };
  }
  state.cart[productId].qty += 1;
  saveCart();
  renderCart();
  animateCartCount();
}

function removeFromCart(productId) {
  if (!state.cart[productId]) return;
  state.cart[productId].qty -= 1;
  if (state.cart[productId].qty <= 0) delete state.cart[productId];
  saveCart();
  renderCart();
}

function deleteFromCart(productId) {
  delete state.cart[productId];
  saveCart();
  renderCart();
}

function emptyCart() {
  state.cart = {};
  saveCart();
  renderCart();
}

function renderCart() {
  $cartItems.innerHTML = "";

  const entries = Object.values(state.cart);
  if (entries.length === 0) {
    $cartItems.innerHTML = `<p class="muted">Tu carrito está vacío.</p>`;
  } else {
    const frag = document.createDocumentFragment();
    entries.forEach(it => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-info">
          <strong>${it.title}</strong>
          <span class="muted">${formatCurrency(it.price)} c/u</span>
        </div>
        <div class="cart-controls">
          <button class="icon-btn" data-dec="${it.id}" aria-label="Restar">−</button>
          <span aria-live="polite" class="qty">${it.qty}</span>
          <button class="icon-btn" data-inc="${it.id}" aria-label="Sumar">+</button>
          <button class="icon-btn danger" data-del="${it.id}" aria-label="Eliminar">🗑️</button>
        </div>
      `;
      frag.appendChild(row);
    });
    $cartItems.appendChild(frag);
  }

  $cartSubtotal.textContent = formatCurrency(getCartSubtotal());
  $cartCount.textContent = getCartCount();
}

function animateCartCount() {
  $cartCount.classList.add("pulse");
  setTimeout(() => $cartCount.classList.remove("pulse"), 300);
}

// ----- Eventos UI -----
document.addEventListener("click", (e) => {
  const addId = e.target.getAttribute("data-add");
  const incId = e.target.getAttribute("data-inc");
  const decId = e.target.getAttribute("data-dec");
  const delId = e.target.getAttribute("data-del");

  if (addId) addToCart(addId);
  if (incId) addToCart(incId);
  if (decId) removeFromCart(decId);
  if (delId) deleteFromCart(delId);
});

$btnCart.addEventListener("click", openCart);
$btnCloseCart.addEventListener("click", closeCart);
$backdrop.addEventListener("click", closeCart);

$btnEmptyCart.addEventListener("click", emptyCart);
$btnCheckout.addEventListener("click", () => {
  if (getCartCount() === 0) return alert("Tu carrito está vacío.");
  alert("✅ ¡Gracias! (Demo) Tu pedido ha sido registrado.");
  emptyCart();
});

// Filtros
const $search = document.getElementById("searchInput");
const $platform = document.getElementById("platformFilter");
const $minPrice = document.getElementById("minPrice");
const $maxPrice = document.getElementById("maxPrice");
const $sort = document.getElementById("sortSelect");
const $btnClearFilters = document.getElementById("btnClearFilters");

function updateAndRender() {
  renderCatalog();
}

$search.addEventListener("input", () => {
  state.query = $search.value.trim().toLowerCase();
  updateAndRender();
});

$platform.addEventListener("change", () => {
  state.platform = $platform.value;
  updateAndRender();
});

$minPrice.addEventListener("input", () => {
  state.minPrice = $minPrice.value;
  updateAndRender();
});

$maxPrice.addEventListener("input", () => {
  state.maxPrice = $maxPrice.value;
  updateAndRender();
});

$sort.addEventListener("change", () => {
  state.sort = $sort.value;
  updateAndRender();
});

$btnClearFilters.addEventListener("click", () => {
  state.query = "";
  state.platform = "all";
  state.minPrice = "";
  state.maxPrice = "";
  state.sort = "relevance";

  $search.value = "";
  $platform.value = "all";
  $minPrice.value = "";
  $maxPrice.value = "";
  $sort.value = "relevance";

  updateAndRender();
});

// ----- Init -----
renderCatalog();
renderCart();
