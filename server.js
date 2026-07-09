require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' })); // 8mb so uploaded product photos (base64) fit

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_BEFORE_DEPLOY';
const PORT = process.env.PORT || 3000;

const db = new Database(path.join(__dirname, 'data.db'));

/* ============ SCHEMA ============ */
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, email TEXT UNIQUE, phone TEXT, password TEXT
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE, password TEXT
);
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, role TEXT, phone TEXT, email TEXT, password TEXT, salary TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, category TEXT, price REAL, rating REAL,
  popular INTEGER DEFAULT 0, count INTEGER DEFAULT 0, img TEXT
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer TEXT, phone TEXT, address TEXT, payment TEXT,
  items TEXT, subtotal REAL, delivery REAL, total REAL,
  status TEXT DEFAULT 'Pending', created_at TEXT
);
`);

/* ============ SEED DEFAULT ADMIN (change password immediately after deploy!) ============ */
const existingAdmin = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (username, password) VALUES (?,?)').run('admin', hash);
  console.log('Seeded default admin -> username: admin / password: admin123 (BEDDEL TAN MARKA UGU HOREYSA!)');
}

/* ============ SEED STARTER MENU (only if empty) ============ */
const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (productCount === 0) {
  const seed = [
    ['Chicken Biryani', 'Biryani', 7.00, 4.5, 1],
    ['Beef Burger', 'Burger', 5.00, 4.6, 1],
    ['Chicken Pizza', 'Pizza', 8.00, 4.4, 1],
    ['Spaghetti', 'Pasta', 6.00, 4.3, 1],
    ['Mojito Drink', 'Drinks', 2.50, 4.5, 1],
    ['Chocolate Cake', 'Desserts', 3.50, 4.7, 0],
  ];
  const stmt = db.prepare('INSERT INTO products (name,category,price,rating,popular,img) VALUES (?,?,?,?,?,?)');
  seed.forEach(f => stmt.run(f[0], f[1], f[2], f[3], f[4], ''));
}

/* ============ MIDDLEWARE ============ */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Fadlan gal si aad u sii wado (login required)' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token khalad ah ama wuu dhacay' });
  }
}
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Maamulaha kaliya ayaa awood u leh' });
  next();
}

/* ============ CUSTOMER AUTH ============ */
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ error: 'Fadlan buuxi dhammaan xogta' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(400).json({ error: 'Email-kan horey ayaa loo isticmaalay' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name,email,phone,password) VALUES (?,?,?,?)').run(name, email.toLowerCase(), phone, hash);
  const token = jwt.sign({ id: info.lastInsertRowid, role: 'customer', name }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: info.lastInsertRowid, name, email, phone } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password)) return res.status(400).json({ error: 'Email ama password khalad ah' });
  const token = jwt.sign({ id: user.id, role: 'customer', name: user.name }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
});

/* ============ ADMIN AUTH ============ */
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password || '', admin.password)) return res.status(400).json({ error: 'Username ama password khalad ah' });
  const token = jwt.sign({ id: admin.id, role: 'admin', username }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

app.post('/api/admin/change-password', authMiddleware, adminOnly, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password-ku waa in uu ka badan yahay 6 xaraf' });
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password=? WHERE id=?').run(hash, req.user.id);
  res.json({ ok: true });
});

/* ============ PRODUCTS (MENU) ============ */
app.get('/api/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM products').all());
});
app.post('/api/products', authMiddleware, adminOnly, (req, res) => {
  const { name, category, price, rating, popular, img } = req.body;
  const info = db.prepare('INSERT INTO products (name,category,price,rating,popular,img) VALUES (?,?,?,?,?,?)')
    .run(name, category, price, rating || 4.5, popular ? 1 : 0, img || '');
  res.json({ id: info.lastInsertRowid });
});
app.put('/api/products/:id', authMiddleware, adminOnly, (req, res) => {
  const { name, category, price, rating, popular, img } = req.body;
  if (img) {
    db.prepare('UPDATE products SET name=?,category=?,price=?,rating=?,popular=?,img=? WHERE id=?')
      .run(name, category, price, rating, popular ? 1 : 0, img, req.params.id);
  } else {
    db.prepare('UPDATE products SET name=?,category=?,price=?,rating=?,popular=? WHERE id=?')
      .run(name, category, price, rating, popular ? 1 : 0, req.params.id);
  }
  res.json({ ok: true });
});
app.delete('/api/products/:id', authMiddleware, adminOnly, (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ============ STAFF ============ */
app.get('/api/staff', authMiddleware, adminOnly, (req, res) => {
  res.json(db.prepare('SELECT id,name,role,phone,email,salary FROM staff').all());
});
app.post('/api/staff', authMiddleware, adminOnly, (req, res) => {
  const { name, role, phone, email, password, salary } = req.body;
  const hash = bcrypt.hashSync(password || '12345', 10);
  const info = db.prepare('INSERT INTO staff (name,role,phone,email,password,salary) VALUES (?,?,?,?,?,?)')
    .run(name, role, phone, email, hash, salary || '0');
  res.json({ id: info.lastInsertRowid });
});
app.put('/api/staff/:id', authMiddleware, adminOnly, (req, res) => {
  const { name, role, phone, email, password, salary } = req.body;
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE staff SET name=?,role=?,phone=?,email=?,password=?,salary=? WHERE id=?')
      .run(name, role, phone, email, hash, salary, req.params.id);
  } else {
    db.prepare('UPDATE staff SET name=?,role=?,phone=?,email=?,salary=? WHERE id=?')
      .run(name, role, phone, email, salary, req.params.id);
  }
  res.json({ ok: true });
});
app.delete('/api/staff/:id', authMiddleware, adminOnly, (req, res) => {
  db.prepare('DELETE FROM staff WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ============ ORDERS ============ */
app.post('/api/orders', (req, res) => {
  const { customer, phone, address, payment, items, subtotal, delivery, total } = req.body;
  if (!customer || !phone || !address || !items || !items.length) return res.status(400).json({ error: 'Xog dhiman' });
  const id = '#' + Date.now().toString().slice(-6);
  db.prepare(`INSERT INTO orders (id,customer,phone,address,payment,items,subtotal,delivery,total,status,created_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, customer, phone, address, payment, JSON.stringify(items), subtotal, delivery, total, 'Pending', new Date().toISOString());
  res.json({ id });
});
app.get('/api/orders', authMiddleware, adminOnly, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items) })));
});
app.get('/api/orders/track', (req, res) => {
  const phone = (req.query.phone || '').trim();
  if (!phone) return res.status(400).json({ error: 'Fadlan geli lambarka taleefanka' });
  const rows = db.prepare('SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC').all(phone);
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items) })));
});
app.put('/api/orders/:id/status', authMiddleware, adminOnly, (req, res) => {
  const { status } = req.body;
  const allowed = ['Pending', 'Preparing', 'Delivered', 'Cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Status khalad ah' });
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ ok: true });
});

app.get('/', (req, res) => res.json({ status: 'Baar Ha I Dhaafin API is running ✅' }));

app.listen(PORT, () => console.log('Server running on port ' + PORT));
