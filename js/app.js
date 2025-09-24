// app.js - main frontend logic (uses axios to fetch)
const API = 'https://fakestoreapi.com/products';
let products = [];
let cart = JSON.parse(localStorage.getItem('tz_cart')||'[]');
const state = { filters:{term:'', category:'all', sort:'popular'} };

const q = sel => document.querySelector(sel);
const qa = sel => Array.from(document.querySelectorAll(sel));
const formatPrice = n => 'PKR ' + Math.round(n*300).toLocaleString(); // convert $ to PKR approx for demo

// Typed hero
new Typed('#heroTitle', { strings: ["Discover, Shop & Explore — Tanzeel's Store"], typeSpeed:40, backSpeed:20, showCursor:false });

// Fetch products
async function loadProducts(){
  try{
    const res = await axios.get(API);
    products = res.data.map(p => ({
      id: p.id.toString(),
      title: p.title,
      price: Math.round(p.price*300), // convert $ to PKR for demo
      description: p.description,
      category: p.category,
      image: p.image,
      rating: p.rating && p.rating.rate ? p.rating.rate : 4.0
    }));
    populateCategorySelect();
    renderProducts();
    updateCartUI();
  }catch(err){
    console.error('Products fetch failed', err);
    q('#productGrid').innerHTML = '<div class="col-12"><div class="alert alert-danger">Failed to load products from API.</div></div>';
  }
}

function populateCategorySelect(){
  const cats = Array.from(new Set(products.map(p=>p.category)));
  const sel = q('#categorySelect');
  cats.forEach(c=>{
    const opt = document.createElement('option'); opt.value=c; opt.textContent = capitalize(c);
    sel.appendChild(opt);
  });
}

function capitalize(s){ return s.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '); }

function renderProducts(){
  const grid = q('#productGrid');
  const term = state.filters.term.toLowerCase();
  const cat = state.filters.category;
  let list = products.filter(p=>{
    if(cat !== 'all' && p.category !== cat) return false;
    if(term && !(p.title.toLowerCase().includes(term) || p.category.toLowerCase().includes(term))) return false;
    return true;
  });
  // sort
  if(state.filters.sort==='price-asc') list.sort((a,b)=>a.price-b.price);
  else if(state.filters.sort==='price-desc') list.sort((a,b)=>b.price-a.price);
  // render
  grid.innerHTML = '';
  q('#resultCount').textContent = list.length;
  list.forEach(p=>{
    const col = document.createElement('div'); col.className='col-md-4';
    col.innerHTML = `
    <div class="card card-product h-100">
      <img src="${p.image}" class="product-img" alt="${p.title}" loading="lazy">
      <div class="p-3 d-flex flex-column">
        <h6 class="mb-1">${p.title}</h6>
        <div class="small text-muted mb-2">${capitalize(p.category)} • ${p.rating}★</div>
        <div class="mt-auto d-flex justify-content-between align-items-center">
          <div><strong>${formatPrice(p.price)}</strong></div>
          <div>
            <button class="btn btn-sm btn-outline-secondary btn-quick" data-id="${p.id}"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-accent btn-add" data-id="${p.id}">Add</button>
          </div>
        </div>
      </div>
    </div>`;
    grid.appendChild(col);
  });
  // bind
  qa('.btn-add').forEach(b=> b.onclick = ()=> addToCart(b.dataset.id,1));
  qa('.btn-quick').forEach(b=> b.onclick = ()=> openQuickView(b.dataset.id));
}

function openQuickView(id){
  const p = products.find(x=>x.id===id);
  if(!p) return alert('Product not found');
  const modalHtml = `
  <div class="modal fade" id="pvModal" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content">
  <div class="modal-body">
    <div class="row g-3">
      <div class="col-md-6"><img src="${p.image}" class="img-fluid rounded" alt=""></div>
      <div class="col-md-6"><h4>${p.title}</h4><p class="small text-muted">${capitalize(p.category)}</p>
      <p>${p.description}</p>
      <div class="mb-3"><strong>${formatPrice(p.price)}</strong></div>
      <div class="d-flex gap-2"><button id="pvAdd" class="btn btn-accent">Add to Cart</button><button id="pvBuy" class="btn btn-outline-primary">Buy Now</button></div>
      </div>
    </div>
  </div>
  <div class="modal-footer"><button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button></div>
  </div></div></div>`;
  const wrapper = document.createElement('div'); wrapper.innerHTML = modalHtml; document.body.appendChild(wrapper);
  const modalEl = wrapper.querySelector('#pvModal'); const bs = new bootstrap.Modal(modalEl); bs.show();
  modalEl.addEventListener('hidden.bs.modal',()=> wrapper.remove());
  modalEl.querySelector('#pvAdd').onclick = ()=>{ addToCart(p.id,1); bs.hide(); };
  modalEl.querySelector('#pvBuy').onclick = ()=>{ addToCart(p.id,1); bs.hide(); openCheckout(); };
}

// CART
function saveCart(){ localStorage.setItem('tz_cart', JSON.stringify(cart)); updateCartUI(); }
function updateCartUI(){
  q('#cartCount').textContent = cart.reduce((s,i)=>s+i.qty,0);
  // show mini toast? not necessary here
}
function addToCart(id,qty=1){
  const ex = cart.find(i=>i.id===id);
  if(ex) ex.qty += qty; else cart.push({ id, qty });
  saveCart();
  alert('Added to cart');
}
function openCheckout(){ window.location.hash = '#shop'; alert('Proceed to checkout (mock)'); }

// EVENTS
q('#searchInput').addEventListener('input', e=> { state.filters.term = e.target.value; renderProducts(); });
q('#categorySelect').addEventListener('change', e=> { state.filters.category = e.target.value; renderProducts(); });
q('#sortSelect').addEventListener('change', e=> { state.filters.sort = e.target.value; renderProducts(); });

q('#feedbackForm').addEventListener('submit', e=> {
  e.preventDefault();
  const fb = { id: Date.now(), name: q('#fbName').value, email: q('#fbEmail').value, msg: q('#fbMessage').value, date:new Date().toISOString() };
  const arr = JSON.parse(localStorage.getItem('tz_feedback')||'[]'); arr.push(fb); localStorage.setItem('tz_feedback', JSON.stringify(arr));
  alert('Thanks for feedback (saved locally)');
  q('#feedbackForm').reset();
});

// load
loadProducts();
