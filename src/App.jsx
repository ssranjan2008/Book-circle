
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const bookConditions = ["Like New", "Very Good", "Good", "Fair", "Acceptable"];

const emptyBookForm = {
  title: "",
  author: "",
  category: "Fiction",
  price: "",
  stock: "1",
  description: "",
  condition: "Good",
  conditionNotes: "",
  photo: "",
};

const starterBooks = [
  { id: 1, title: "Atomic Habits", author: "James Clear", category: "Self Help", price: 399, stock: 5, description: "Build good habits and break bad ones.", emoji: "📘", condition: "Very Good", conditionNotes: "Clean pages with light cover wear." },
  { id: 2, title: "The Alchemist", author: "Paulo Coelho", category: "Fiction", price: 249, stock: 5, description: "A journey of dreams and discovery.", emoji: "📙", condition: "Good", conditionNotes: "Slight crease on the cover, pages intact." },
  { id: 3, title: "Ikigai", author: "Hector Garcia", category: "Self Help", price: 299, stock: 5, description: "Discover your purpose and live well.", emoji: "📗", condition: "Like New", conditionNotes: "Barely used, no markings." },
  { id: 4, title: "Wings of Fire", author: "A. P. J. Abdul Kalam", category: "Biography", price: 220, stock: 5, description: "An inspiring journey of a remarkable life.", emoji: "📕", condition: "Good", conditionNotes: "A few page-corner folds." },
  { id: 5, title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", category: "Finance", price: 349, stock: 5, description: "Learn the basics of financial literacy.", emoji: "📔", condition: "Fair", conditionNotes: "Highlighted in places, still fully readable." },
  { id: 6, title: "The Psychology of Money", author: "Morgan Housel", category: "Finance", price: 320, stock: 5, description: "Understand how people think about money.", emoji: "📚", condition: "Very Good", conditionNotes: "Tight binding, no notes inside." },
  { id: 7, title: "Ponniyin Selvan", author: "Kalki Krishnamurthy", category: "Fiction", price: 450, stock: 5, description: "A classic Tamil historical adventure.", emoji: "📖", condition: "Good", conditionNotes: "Gently used, no missing pages." },
  { id: 8, title: "Think Like a Monk", author: "Jay Shetty", category: "Self Help", price: 310, stock: 5, description: "Practical lessons for a calmer life.", emoji: "📒", condition: "Like New", conditionNotes: "Looks freshly kept." },
];

const readStore = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
};

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function readBookPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please upload a photo of the book."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 720;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.onerror = () => reject(new Error("Could not read that photo."));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.readAsDataURL(file);
  });
}

const emptyAddress = {
  fullName: "",
  phone: "",
  address: "",
  landmark: "",
  city: "",
  state: "Tamil Nadu",
  pincode: "",
};

export default function App() {
  const [books, setBooks] = useState(() => {
    const saved = readStore("bc_books", null);
    if (!Array.isArray(saved) || !saved.length) return starterBooks;
    return saved.map((book) => {
      const starter = starterBooks.find((item) => item.id === book.id);
      return {
        ...book,
        condition: book.condition || starter?.condition,
        conditionNotes: book.conditionNotes || starter?.conditionNotes,
      };
    });
  });

  const [users, setUsers] = useState(() => readStore("bc_users", []));
  const [currentUser, setCurrentUser] = useState(() =>
    readStore("bc_current", null)
  );
  const [orders, setOrders] = useState(() => readStore("bc_orders", []));
  const [cart, setCart] = useState(() => readStore("bc_cart", []));
  const [page, setPage] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [role, setRole] = useState("customer");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [address, setAddress] = useState(() => ({
    ...emptyAddress,
    ...readStore("bc_address", {}),
  }));
  const [delivery, setDelivery] = useState("Standard");
  const [payment, setPayment] = useState("Cash on Delivery");
  const [newBook, setNewBook] = useState(emptyBookForm);

  useEffect(() => localStorage.setItem("bc_books", JSON.stringify(books)), [books]);
  useEffect(() => localStorage.setItem("bc_users", JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem("bc_current", JSON.stringify(currentUser)), [currentUser]);
  useEffect(() => localStorage.setItem("bc_orders", JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem("bc_cart", JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem("bc_address", JSON.stringify(address)), [address]);

  const categories = useMemo(
    () => ["All", ...new Set(books.map((book) => book.category))],
    [books]
  );

  const filteredBooks = books.filter((book) => {
    const term = search.toLowerCase();
    const matchesSearch =
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      book.category.toLowerCase().includes(term);
    return matchesSearch && (category === "All" || book.category === category);
  });

  const cartItems = cart
    .map((item) => {
      const book = books.find((b) => b.id === item.bookId);
      return book ? { ...item, book } : null;
    })
    .filter(Boolean);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.book.price * item.quantity,
    0
  );

  const deliveryFee =
    delivery === "Express" ? 99 : subtotal >= 499 ? 0 : 49;

  const total = subtotal + deliveryFee;

  const myOrders = orders.filter(
    (order) => order.customerEmail === currentUser?.email
  );

  
const sellerOrders = orders.filter((order) =>
  Array.isArray(order.items) &&
  order.items.some(
    (item) => item.ownerEmail === currentUser?.email
  )
);


  function notify(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  }

  function openAuth(nextRole, mode = "login") {
    setRole(nextRole);
    setAuthMode(mode);
    setAuthForm({ name: "", email: "", password: "" });
    setPage("auth");
    setMessage("");
  }

  function submitAuth(event) {
    event.preventDefault();

    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password;

    if (!email || !password) {
      notify("Enter your email and password.");
      return;
    }

    if (authMode === "signup") {
      if (!authForm.name.trim()) {
        notify("Please enter your name.");
        return;
      }

      if (password.length < 6) {
        notify("Password must be at least 6 characters.");
        return;
      }

      if (users.some((user) => user.email === email && user.role === role)) {
        notify("Account already exists. Please log in.");
        return;
      }

      const user = {
        id: Date.now(),
        name: authForm.name.trim(),
        email,
        password,
        role,
      };

      setUsers((prev) => [...prev, user]);
      setCurrentUser({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
      setPage(role === "seller" ? "seller" : "home");
      notify("Account created successfully!");
      return;
    }

    const found = users.find(
      (user) =>
        user.email === email &&
        user.password === password &&
        user.role === role
    );

    if (!found) {
      notify("Account not found or details are incorrect. Please sign up first.");
      return;
    }

    setCurrentUser({
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
    });
    setPage(role === "seller" ? "seller" : "home");
    notify("Welcome back!");
  }

  function logout() {
    setCurrentUser(null);
    setPage("home");
    notify("Logged out successfully.");
  }

  function addToCart(book) {
    if (!currentUser || currentUser.role !== "customer") {
      openAuth("customer");
      notify("Please log in as a customer to add books.");
      return;
    }

    if (book.ownerEmail === currentUser.email) {
      notify("You cannot buy your own listing.");
      return;
    }

    const existing = cart.find((item) => item.bookId === book.id);
    if (existing && existing.quantity >= book.stock) {
      notify("No more stock available.");
      return;
    }

    setCart((prev) => {
      const found = prev.find((item) => item.bookId === book.id);
      return found
        ? prev.map((item) =>
            item.bookId === book.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prev, { bookId: book.id, quantity: 1 }];
    });
    notify("Book added to cart.");
  }

  function changeQuantity(bookId, amount) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.bookId === bookId
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function checkout(event) {
    event.preventDefault();

    if (!currentUser || currentUser.role !== "customer") {
      openAuth("customer");
      return;
    }

    if (!cartItems.length) {
      notify("Your cart is empty.");
      setPage("cart");
      return;
    }

    if (
      !address.fullName.trim() ||
      !/^[6-9]\d{9}$/.test(address.phone) ||
      !address.address.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !/^\d{6}$/.test(address.pincode)
    ) {
      notify("Please enter valid delivery details.");
      return;
    }

    for (const item of cartItems) {
      if (item.quantity > item.book.stock) {
        notify(`${item.book.title} does not have enough stock.`);
        return;
      }
    }

    const order = {
      id: "BC" + Date.now().toString().slice(-8),
      customerEmail: currentUser.email,
      customerName: currentUser.name,
      items: cartItems.map((item) => ({
        bookId: item.book.id,
        title: item.book.title,
        price: item.book.price,
        quantity: item.quantity,
        ownerEmail: item.book.ownerEmail || "",
      })),
      address: { ...address },
      delivery,
      deliveryFee,
      payment,
      total,
      status: "Order Placed",
      date: new Date().toLocaleString("en-IN"),
    };

    setOrders((prev) => [order, ...prev]);
    setBooks((prev) =>
      prev.map((book) => {
        const ordered = cartItems.find((item) => item.book.id === book.id);
        return ordered
          ? { ...book, stock: book.stock - ordered.quantity }
          : book;
      })
    );
    setCart([]);
    setPage("orders");
    notify("Order placed successfully!");
  }

  function addBook(event) {
    event.preventDefault();

    const price = Number(newBook.price);
    const stock = Number(newBook.stock);

    if (
      !newBook.title.trim() ||
      !newBook.author.trim() ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 1
    ) {
      notify("Enter valid book details, price and stock.");
      return;
    }

    if (!newBook.photo) {
      notify("Upload a photo that shows the book’s condition.");
      return;
    }

    if (!newBook.conditionNotes.trim()) {
      notify("Mention the condition of the book, such as wear or markings.");
      return;
    }

    const book = {
      ...newBook,
      id: Date.now(),
      price,
      stock,
      conditionNotes: newBook.conditionNotes.trim(),
      ownerEmail: currentUser.email,
      emoji: "📚",
    };

    setBooks((prev) => [book, ...prev]);
    setNewBook(emptyBookForm);
    notify("Book listed successfully!");
  }

  async function handleBookPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const photo = await readBookPhoto(file);
      setNewBook((prev) => ({ ...prev, photo }));
      notify("Book photo added.");
    } catch (error) {
      notify(error.message || "Could not upload that photo.");
    }
  }

  function deleteBook(bookId) {
    setBooks((prev) =>
      prev.filter(
        (book) =>
          book.id !== bookId || book.ownerEmail !== currentUser?.email
      )
    );
    notify("Your book listing was removed.");
  }

  function updateOrderStatus(orderId, status) {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const hasSellerItem = order.items.some(
          (item) => item.ownerEmail === currentUser?.email
        );
        return hasSellerItem ? { ...order, status } : order;
      })
    );
    notify("Order status updated.");
  }

  function navigate(nextPage) {
    setMessage("");

    if (nextPage === "seller" && currentUser?.role !== "seller") {
      openAuth("seller");
      return;
    }

    if (
      ["cart", "checkout", "orders"].includes(nextPage) &&
      currentUser?.role !== "customer"
    ) {
      openAuth("customer");
      return;
    }

    setPage(nextPage);
  }

  function bookCard(book) {
    return (
      <article className="book-card" key={book.id}>
        <div className={`book-cover${book.photo ? " has-photo" : ""}`}>
          {book.photo ? (
            <img src={book.photo} alt={`${book.title} condition photo`} />
          ) : (
            <span>{book.emoji || "📚"}</span>
          )}
          <small>{book.category}</small>
          {book.condition && (
            <em className="condition-badge">{book.condition}</em>
          )}
        </div>
        <div className="book-info">
          <h3>{book.title}</h3>
          <p className="book-author">by {book.author}</p>
          <p className="book-description">
            {book.description || "A great book waiting for a new reader."}
          </p>
          {book.conditionNotes && (
            <p className="condition-notes">{book.conditionNotes}</p>
          )}
          <div className="book-bottom">
            <div>
              <strong>{money(book.price)}</strong>
              <small>{book.stock} available</small>
            </div>
            <button
              className="btn btn-primary btn-small"
              disabled={book.stock <= 0}
              onClick={() => addToCart(book)}
            >
              {book.stock <= 0 ? "Sold out" : "Add to cart"}
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <button className="brand" onClick={() => navigate("home")}>
          <span className="brand-icon">B</span>
          <span>
            <strong>Book Circle</strong>
            <small>Share · Read · Repeat</small>
          </span>
        </button>

        <nav className="nav-links">
          <button onClick={() => navigate("home")}>Home</button>
          <button onClick={() => navigate("home")}>Explore Books</button>
          {currentUser?.role === "customer" && (
            <>
              <button onClick={() => navigate("cart")}>
                Cart ({cart.reduce((n, i) => n + i.quantity, 0)})
              </button>
              <button onClick={() => navigate("orders")}>My Orders</button>
            </>
          )}
          {currentUser?.role === "seller" && (
            <button onClick={() => navigate("seller")}>Seller Dashboard</button>
          )}
        </nav>

        <div className="nav-account">
          {currentUser ? (
            <>
              <span className="welcome-user">
                Hi, {currentUser.name.split(" ")[0]}
              </span>
              <button className="btn btn-outline btn-small" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-outline btn-small"
                onClick={() => openAuth("customer")}
              >
                Log in
              </button>
              <button
                className="btn btn-primary btn-small"
                onClick={() => openAuth("seller", "signup")}
              >
                Become a Seller
              </button>
            </>
          )}
        </div>
      </header>

      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}

      <main>
        {page === "home" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <span className="eyebrow">A COMMUNITY OF READERS</span>
                <h1>Every book has a story. Find your next one.</h1>
                <p>
                  Discover books, share your favourites and give great stories
                  another chapter.
                </p>
                <div className="hero-actions">
                  <button
                    className="btn btn-light"
                    onClick={() =>
                      document
                        .getElementById("catalogue")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Explore Books <span>→</span>
                  </button>
                  <button
                    className="btn btn-hero-outline"
                    onClick={() => openAuth("seller", "signup")}
                  >
                    Sell Your Books
                  </button>
                </div>
                <div className="hero-note">
                  <span>✓</span> Discover · Read · Reuse
                </div>
              </div>
              <div className="hero-art" aria-label="Illustration of books">
                <div className="sun-shape" />
                <div className="floating-book book-one">Read more</div>
                <div className="floating-book book-two">Stay curious</div>
                <div className="plant">🌿</div>
                <div className="hero-stack">
                  <div className="stack-book stack-top">THE NEXT CHAPTER</div>
                  <div className="stack-book stack-middle">STORIES THAT STAY</div>
                  <div className="stack-book stack-bottom">BOOK CIRCLE</div>
                </div>
              </div>
            </section>

            <section className="benefits">
              <div><span>📚</span><div><strong>Books for everyone</strong><small>Explore different genres</small></div></div>
              <div><span>♻️</span><div><strong>Read sustainably</strong><small>Give books a second life</small></div></div>
              <div><span>🤝</span><div><strong>Reader community</strong><small>Share stories together</small></div></div>
            </section>

            <section className="catalogue section-wrap" id="catalogue">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR NEXT READ AWAITS</span>
                  <h2>Explore our collection</h2>
                  <p>Find a story that speaks to you.</p>
                </div>
                <span className="book-count">{filteredBooks.length} books</span>
              </div>

              <div className="search-row">
                <label className="search-box">
                  <span>⌕</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, author or genre..."
                  />
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Filter by category"
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="book-grid">
                {filteredBooks.map((book) => bookCard(book))}
              </div>
              {filteredBooks.length === 0 && (
                <div className="empty-state">
                  <span>🔎</span>
                  <h3>No books found</h3>
                  <p>Try another title, author or category.</p>
                </div>
              )}
            </section>

            <section className="seller-banner">
              <div>
                <span className="eyebrow">HAVE BOOKS TO SHARE?</span>
                <h2>Let your books find a new home.</h2>
                <p>List your books and connect with fellow readers.</p>
              </div>
              <button
                className="btn btn-light"
                onClick={() => openAuth("seller", "signup")}
              >
                Start selling →
              </button>
            </section>
          </>
        )}

        {page === "auth" && (
          <section className="auth-layout">
            <div className="auth-side">
              <span className="brand-icon large">B</span>
              <span className="eyebrow">WELCOME TO BOOK CIRCLE</span>
              <h1>Good books bring people together.</h1>
              <p>Sign in to continue your reading journey.</p>
            </div>
            <form className="auth-card" onSubmit={submitAuth}>
              <button
                type="button"
                className="back-link"
                onClick={() => setPage("home")}
              >
                ← Back to home
              </button>
              <h2>{authMode === "signup" ? "Create your account" : "Welcome back"}</h2>
              <p className="muted">
                {authMode === "signup"
                  ? "Join the Book Circle community."
                  : "Log in to your Book Circle account."}
              </p>

              <div className="role-switch">
                <button
                  type="button"
                  className={role === "customer" ? "active" : ""}
                  onClick={() => setRole("customer")}
                >
                  🛍️ Customer
                </button>
                <button
                  type="button"
                  className={role === "seller" ? "active" : ""}
                  onClick={() => setRole("seller")}
                >
                  📦 Seller
                </button>
              </div>

              {authMode === "signup" && (
                <label className="field">
                  Full name
                  <input
                    required
                    value={authForm.name}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, name: e.target.value })
                    }
                    placeholder="Enter your name"
                  />
                </label>
              )}
              <label className="field">
                Email address
                <input
                  required
                  type="email"
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, email: e.target.value })
                  }
                  placeholder="you@example.com"
                />
              </label>
              <label className="field">
                Password
                <input
                  required
                  type="password"
                  minLength={6}
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, password: e.target.value })
                  }
                  placeholder="At least 6 characters"
                />
              </label>
              <button className="btn btn-primary full-width" type="submit">
                {authMode === "signup" ? "Create account" : "Log in"} →
              </button>
              <p className="auth-switch">
                {authMode === "signup"
                  ? "Already have an account?"
                  : "New to Book Circle?"}{" "}
                <button
                  type="button"
                  onClick={() =>
                    setAuthMode(authMode === "signup" ? "login" : "signup")
                  }
                >
                  {authMode === "signup" ? "Log in" : "Sign up"}
                </button>
              </p>
              <p className="demo-note">
                Demo only: account details are saved in this browser. Do not
                reuse your email account password.
              </p>
            </form>
          </section>
        )}

        {page === "cart" && (
          <section className="section-wrap page-section">
            <button className="back-link" onClick={() => setPage("home")}>
              ← Continue shopping
            </button>
            <div className="section-heading">
              <div><span className="eyebrow">YOUR SELECTION</span><h2>Shopping cart</h2></div>
            </div>

            {cartItems.length === 0 ? (
              <div className="empty-state">
                <span>🛒</span><h3>Your cart is empty</h3>
                <p>Find a book you love and add it to your cart.</p>
                <button className="btn btn-primary" onClick={() => setPage("home")}>Explore books</button>
              </div>
            ) : (
              <div className="cart-layout">
                <div className="cart-list">
                  {cartItems.map((item) => (
                    <article className="cart-item" key={item.book.id}>
                      <div className={`cart-cover${item.book.photo ? " has-photo" : ""}`}>
                        {item.book.photo ? (
                          <img src={item.book.photo} alt={`${item.book.title} condition photo`} />
                        ) : (
                          item.book.emoji || "📚"
                        )}
                      </div>
                      <div className="cart-item-info">
                        <h3>{item.book.title}</h3>
                        <p>
                          {item.book.author}
                          {item.book.condition ? ` · ${item.book.condition}` : ""}
                        </p>
                        <strong>{money(item.book.price)}</strong>
                        <div className="quantity">
                          <button
                            onClick={() => changeQuantity(item.book.id, -1)}
                            aria-label="Decrease quantity"
                          >−</button>
                          <span>{item.quantity}</span>
                          <button
                            disabled={item.quantity >= item.book.stock}
                            onClick={() => changeQuantity(item.book.id, 1)}
                            aria-label="Increase quantity"
                          >+</button>
                        </div>
                      </div>
                      <button
                        className="remove-link"
                        onClick={() =>
                          setCart((prev) =>
                            prev.filter((i) => i.bookId !== item.book.id)
                          )
                        }
                      >Remove</button>
                    </article>
                  ))}
                </div>
                <aside className="summary-card">
                  <h3>Order summary</h3>
                  <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                  <div><span>Delivery</span><strong>Calculated at checkout</strong></div>
                  <div className="summary-total"><span>Total</span><strong>{money(subtotal)}</strong></div>
                  <button
                    className="btn btn-primary full-width"
                    onClick={() => navigate("checkout")}
                  >Proceed to checkout →</button>
                </aside>
              </div>
            )}
          </section>
        )}

        {page === "checkout" && (
          <section className="section-wrap page-section">
            <button className="back-link" onClick={() => setPage("cart")}>← Back to cart</button>
            <div className="section-heading">
              <div><span className="eyebrow">ALMOST THERE</span><h2>Checkout</h2><p>Enter your delivery details to place your order.</p></div>
            </div>

            {cartItems.length === 0 ? (
              <div className="empty-state">
                <span>🛒</span><h3>Your cart is empty</h3>
                <button className="btn btn-primary" onClick={() => setPage("home")}>Explore books</button>
              </div>
            ) : (
              <form className="checkout-layout" onSubmit={checkout}>
                <div className="checkout-main">
                  <section className="form-card">
                    <div className="form-card-heading"><span>1</span><div><h3>Delivery address</h3><p>Where should we deliver your books?</p></div></div>
                    <div className="form-grid">
                      <label className="field full-span">Full name *
                        <input required value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} placeholder="Recipient name" />
                      </label>
                      <label className="field">Phone number *
                        <input required type="tel" inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="10-digit mobile number" />
                      </label>
                      <label className="field full-span">House no., street and area *
                        <textarea required rows={3} value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} placeholder="Door number, street, area" />
                      </label>
                      <label className="field full-span">Landmark (optional)
                        <input value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} placeholder="Nearby landmark" />
                      </label>
                      <label className="field">City *
                        <input required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="Your city" />
                      </label>
                      <label className="field">State *
                        <select required value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}>
                          {["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana", "Maharashtra", "Delhi", "Other"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </label>
                      <label className="field">PIN code *
                        <input required inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="6-digit PIN code" />
                      </label>
                    </div>
                  </section>

                  <section className="form-card">
                    <div className="form-card-heading"><span>2</span><div><h3>Delivery method</h3><p>Choose how you want to receive your order.</p></div></div>
                    <div className="choice-list">
                      <label className={`choice-card ${delivery === "Standard" ? "selected" : ""}`}>
                        <input type="radio" name="delivery" checked={delivery === "Standard"} onChange={() => setDelivery("Standard")} />
                        <span className="choice-icon">🚚</span>
                        <span className="choice-text"><strong>Standard delivery</strong><small>Estimated 4–7 business days</small></span>
                        <strong>{subtotal >= 499 ? "FREE" : "₹49"}</strong>
                      </label>
                      <label className={`choice-card ${delivery === "Express" ? "selected" : ""}`}>
                        <input type="radio" name="delivery" checked={delivery === "Express"} onChange={() => setDelivery("Express")} />
                        <span className="choice-icon">⚡</span>
                        <span className="choice-text"><strong>Express delivery</strong><small>Estimated 1–3 business days</small></span>
                        <strong>₹99</strong>
                      </label>
                    </div>
                    <p className="demo-note">Delivery dates and fees are illustrative demo values, not a real shipping service.</p>
                  </section>

                  <section className="form-card">
                    <div className="form-card-heading"><span>3</span><div><h3>Payment method</h3><p>Choose your preferred payment option.</p></div></div>
                    <div className="choice-list">
                      <label className={`choice-card ${payment === "Cash on Delivery" ? "selected" : ""}`}>
                        <input type="radio" name="payment" checked={payment === "Cash on Delivery"} onChange={() => setPayment("Cash on Delivery")} />
                        <span className="choice-icon">💵</span>
                        <span className="choice-text"><strong>Cash on Delivery</strong><small>Pay when the order arrives (demo)</small></span>
                      </label>
                      <label className={`choice-card ${payment === "Online Payment (Demo)" ? "selected" : ""}`}>
                        <input type="radio" name="payment" checked={payment === "Online Payment (Demo)"} onChange={() => setPayment("Online Payment (Demo)")} />
                        <span className="choice-icon">💳</span>
                        <span className="choice-text"><strong>Online payment</strong><small>Demo selection only — no money is charged</small></span>
                      </label>
                    </div>
                  </section>
                </div>

                <aside className="summary-card checkout-summary">
                  <h3>Order summary</h3>
                  {cartItems.map((item) => (
                    <div className="summary-book" key={item.book.id}>
                      <span>{item.book.emoji || "📚"} {item.book.title} × {item.quantity}</span>
                      <strong>{money(item.book.price * item.quantity)}</strong>
                    </div>
                  ))}
                  <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                  <div><span>Delivery fee</span><strong>{deliveryFee === 0 ? "FREE" : money(deliveryFee)}</strong></div>
                  <div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div>
                  <p className="secure-note">🔒 Demo checkout — no real payment is processed.</p>
                  <button className="btn btn-primary full-width" type="submit">Place order · {money(total)}</button>
                  <small className="terms-note">By placing your order, you confirm that the delivery details are correct.</small>
                </aside>
              </form>
            )}
          </section>
        )}

        {page === "orders" && (
          <section className="section-wrap page-section">
            <div className="section-heading">
              <div><span className="eyebrow">YOUR BOOK JOURNEY</span><h2>My orders</h2><p>View your purchases and order status.</p></div>
            </div>
            {myOrders.length === 0 ? (
              <div className="empty-state"><span>📦</span><h3>No orders yet</h3><p>Your placed orders will appear here.</p><button className="btn btn-primary" onClick={() => setPage("home")}>Explore books</button></div>
            ) : (
              <div className="order-list">
                {myOrders.map((order) => (
                  <article className="order-card" key={order.id}>
                    <div className="order-header">
                      <div><small>ORDER ID</small><strong>{order.id}</strong><span className="muted">{order.date}</span></div>
                      <span className="status-pill">{order.status}</span>
                    </div>
                    <div className="order-products">
                      {order.items.map((item, i) => <div key={`${item.bookId}-${i}`}><span>📚 {item.title} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></div>)}
                    </div>
                    <div className="order-address">
                      <strong>📍 Delivery address</strong>
                      <p>{order.address.fullName} · {order.address.phone}</p>
                      <p>{order.address.address}{order.address.landmark ? `, ${order.address.landmark}` : ""}, {order.address.city}, {order.address.state} - {order.address.pincode}</p>
                    </div>
                    <div className="order-footer">
                      <span>{order.delivery} · {order.payment}</span>
                      <strong>Total: {money(order.total)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {page === "seller" && currentUser?.role === "seller" && (
          <section className="section-wrap page-section">
            <div className="section-heading">
              <div><span className="eyebrow">SELLER STUDIO</span><h2>Your seller dashboard</h2><p>Manage your book listings and orders.</p></div>
            </div>

            <div className="stats-grid">
              <div className="stat-card"><span>📚</span><small>Your listings</small><strong>{books.filter((b) => b.ownerEmail === currentUser.email).length}</strong></div>
              <div className="stat-card"><span>📦</span><small>Orders containing your books</small><strong>{sellerOrders.length}</strong></div>
              <div className="stat-card"><span>🚚</span><small>Orders to fulfil</small><strong>{sellerOrders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length}</strong></div>
            </div>

            <div className="seller-layout">
              <form className="form-card" onSubmit={addBook}>
                <div className="form-card-heading"><span>＋</span><div><h3>List a new book</h3><p>Add a book to the marketplace.</p></div></div>
                <div className="form-grid">
                  <label className="field full-span">Book title *
                    <input required value={newBook.title} onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} placeholder="Book title" />
                  </label>
                  <label className="field full-span">Author *
                    <input required value={newBook.author} onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} placeholder="Author name" />
                  </label>
                  <label className="field">Category
                    <select value={newBook.category} onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}>
                      {["Fiction", "Self Help", "Biography", "Finance", "Education", "Technology", "Other"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="field">Price (₹) *
                    <input required type="number" min="1" value={newBook.price} onChange={(e) => setNewBook({ ...newBook, price: e.target.value })} placeholder="Price" />
                  </label>
                  <label className="field">Available quantity *
                    <input required type="number" min="1" step="1" value={newBook.stock} onChange={(e) => setNewBook({ ...newBook, stock: e.target.value })} />
                  </label>
                  <label className="field">Condition *
                    <select
                      required
                      value={newBook.condition}
                      onChange={(e) =>
                        setNewBook({ ...newBook, condition: e.target.value })
                      }
                    >
                      {bookConditions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field full-span">Condition details *
                    <textarea
                      required
                      rows={3}
                      value={newBook.conditionNotes}
                      onChange={(e) =>
                        setNewBook({ ...newBook, conditionNotes: e.target.value })
                      }
                      placeholder="Mention wear, markings, missing pages, or anything a buyer should know"
                    />
                  </label>
                  <label className="field full-span">Book photo *
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBookPhoto}
                    />
                    <small className="field-hint">
                      Upload a clear photo showing the book’s actual condition.
                    </small>
                  </label>
                  {newBook.photo && (
                    <div className="photo-preview">
                      <img src={newBook.photo} alt="Uploaded book condition" />
                      <button
                        type="button"
                        className="remove-link"
                        onClick={() => setNewBook({ ...newBook, photo: "" })}
                      >
                        Remove photo
                      </button>
                    </div>
                  )}
                  <label className="field full-span">Description
                    <textarea rows={3} value={newBook.description} onChange={(e) => setNewBook({ ...newBook, description: e.target.value })} placeholder="Tell readers about this book" />
                  </label>
                </div>
                <button className="btn btn-primary full-width" type="submit">＋ List book</button>
              </form>

              <section className="seller-listings">
                <div className="subheading"><h3>Your book listings</h3><span>{books.filter((b) => b.ownerEmail === currentUser.email).length} books</span></div>
                {books.filter((b) => b.ownerEmail === currentUser.email).length === 0 ? (
                  <div className="empty-state compact"><span>📚</span><h3>No listings yet</h3><p>Add your first book using the form.</p></div>
                ) : (
                  books.filter((b) => b.ownerEmail === currentUser.email).map((book) => (
                    <article className="listing-row" key={book.id}>
                      {book.photo ? (
                        <img
                          className="listing-icon listing-photo"
                          src={book.photo}
                          alt={`${book.title} condition photo`}
                        />
                      ) : (
                        <span className="listing-icon">{book.emoji || "📚"}</span>
                      )}
                      <div>
                        <strong>{book.title}</strong>
                        <small>
                          {book.author} · {book.stock} in stock
                          {book.condition ? ` · ${book.condition}` : ""}
                        </small>
                        {book.conditionNotes && (
                          <small>{book.conditionNotes}</small>
                        )}
                        <b>{money(book.price)}</b>
                      </div>
                      <button className="remove-link" onClick={() => deleteBook(book.id)}>Remove</button>
                    </article>
                  ))
                )}
              </section>
            </div>

            <section className="seller-orders">
              <div className="subheading"><h3>Customer orders</h3><span>{sellerOrders.length} orders</span></div>
              {sellerOrders.length === 0 ? (
                <div className="empty-state compact"><span>📦</span><h3>No customer orders yet</h3><p>Orders containing your listed books will appear here.</p></div>
              ) : (
                sellerOrders.map((order) => (
                  <article className="seller-order-card" key={order.id}>
                    <div className="order-header">
                      <div><small>ORDER ID</small><strong>{order.id}</strong><span className="muted">{order.date}</span></div>
                      <span className="status-pill">{order.status}</span>
                    </div>
                    <div className="seller-order-detail">
                      <div>
                        <strong>Customer: {order.customerName}</strong>
                        <p>{order.address.fullName} · {order.address.phone}</p>
                        <p>{order.address.address}, {order.address.city}, {order.address.state} - {order.address.pincode}</p>
                      </div>
                      <div>
                        {order.items.filter((item) => item.ownerEmail === currentUser.email).map((item, i) => <p key={`${item.bookId}-${i}`}>{item.title} × {item.quantity} · {money(item.price * item.quantity)}</p>)}
                      </div>
                    </div>
                    <div className="seller-order-actions">
                      <label className="field">Update status
                        <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}>
                          {["Order Placed", "Confirmed", "Shipped", "Delivered", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </label>
                      <span>Payment: {order.payment}</span>
                    </div>
                  </article>
                ))
              )}
            </section>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="footer-brand"><span className="brand-icon">B</span><div><strong>Book Circle</strong><small>Share · Read · Repeat</small></div></div>
        <p>Every book deserves another chapter.</p>
        <small>© {new Date().getFullYear()} Book Circle · Student demo project</small>
      </footer>
    </div>
  );
}
