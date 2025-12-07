import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import CheckoutPage from "./components/CheckoutPage";
import PaymentPage from "./components/PaymentPage";
import OrderConfirmed from "./components/OrderConfirmed";
import OrdersPage from './components/OrdersPage';
import OrderDetails from "./components/OrderDetails";
import MyAccount from "./components/MyAccount";
import ProductLanding from './components/ProductLanding';
import Banner from './components/Banner';
import BestSellerSection from './components/BestSellerSection';
import HowToMake from './components/HowToMake';
import ProductList from './components/ProductList';
import ProductsPage from './components/ProductsPage';
import RecipeSection from './components/RecipeSection';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import About from './components/About';
import Terms from './components/Terms';
import PrivacyPolicy from './components/PrivacyPolicy';
import ReturnPolicy from './components/ReturnPolicy';
import ReturnCancelPolicy from './components/ReturnCancelPolicy';
import RecipePage from './components/RecipePage';
import AdminLogin from './components/AdminLogin';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import AdminMain from './components/AdminMain';
import ContactUs from './components/ContactUs.jsx';
import ShippingPolicy from './components/ShippingPolicy';

import './App.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import logo from './assets/logo.png';

import DotGrid from './blocks/Backgrounds/DotGrid/DotGrid.jsx';
import { CircularText } from './blocks/TextAnimations/CircularText/CircularText.jsx';

// use `auth` and `db` from `src/firebase.js` (single initialized app)

const ProtectedAdminRoute = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'owner') {
          setUserRole('owner');
        } else {
          setUserRole('customer');
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return userRole === 'owner' ? children : <Navigate to="/admin-login" />;
};

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [animationDone, setAnimationDone] = useState(false);
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  window.setAppSearchTerm = setAppSearchTerm;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountedTotal = Math.max(subtotal - discount, 0);

  // ✅ Coupon handling
  const fetchAndApplyCoupon = async (code, currentSubtotal) => {
    setCouponError("");
    setDiscount(0);
    if (!code) return;

    const trimmed = code.trim().toUpperCase();
    const q = query(
      collection(db, "coupons"),
      where("code", "==", trimmed),
      where("active", "==", true)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      setCouponError("Invalid or expired coupon.");
      return;
    }

    const couponDoc = snap.docs[0].data();
    if (couponDoc.expiry && couponDoc.expiry.toDate() < new Date()) {
      setCouponError("Coupon expired.");
      return;
    }

    if (couponDoc.discountType === "percent") {
      setDiscount((currentSubtotal * couponDoc.discountValue) / 100);
    } else {
      setDiscount(couponDoc.discountValue);
    }
  };

  const handleApplyCoupon = async () => {
    await fetchAndApplyCoupon(coupon, subtotal);
  };

  useEffect(() => {
    if (coupon) {
      fetchAndApplyCoupon(coupon, subtotal);
    } else {
      setDiscount(0);
      setCouponError("");
    }
  }, [subtotal]);

  // ✅ Sync products and live stock updates
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (querySnap) => {
      const items = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);

      setCartItems(prev => prev.map(item => {
        const live = items.find(p => p.id === item.id);
        return live ? { ...item, stock: live.stock } : item;
      }));
      setWishlistItems(prev => prev.map(item => {
        const live = items.find(p => p.id === item.id);
        return live ? { ...item, stock: live.stock } : item;
      }));
    });
    return () => unsub();
  }, []);

  // ✅ Load cart/wishlist from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedCart) setCartItems(JSON.parse(savedCart));
    if (savedWishlist) setWishlistItems(JSON.parse(savedWishlist));
  }, []);

  // ✅ Save cart/wishlist on update
  useEffect(() => localStorage.setItem('cart', JSON.stringify(cartItems)), [cartItems]);
  useEffect(() => localStorage.setItem('wishlist', JSON.stringify(wishlistItems)), [wishlistItems]);

  // ✅ Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoggedIn(true);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        setUserRole(userDoc.exists() ? userDoc.data().role : null);
      } else {
        setLoggedIn(false);
        setUserRole(null);
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Logo animation delay
  useEffect(() => {
    const timer = setTimeout(() => setAnimationDone(true), 3100);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Cart & Wishlist handlers
  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      return existing
        ? prev.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id, newQty) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
      );
    }
  };

  const removeFromCart = (id) => setCartItems((prev) => prev.filter((item) => item.id !== id));

  const handleWishlistToggle = (product) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === product.id
          ? { ...p, isWishlisted: !p.isWishlisted }
          : p
      )
    );
    setWishlistItems(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      } else {
        return [...prev, { ...product, isWishlisted: true }];
      }
    });
  };

  const moveToWishlist = (product) => {
    removeFromCart(product.id);
    handleWishlistToggle(product);
  };

  const removeFromWishlist = (id) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const moveToCart = (product) => {
    removeFromWishlist(product.id);
    addToCart(product);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loadingUser) return <div>Loading...</div>;

  return (
    <>
      {!animationDone && (
        <div id="logo-anim-container" style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
          <img id="logo-anim" src={logo} alt="Bold & Brew Logo" />
        </div>
      )}
      <div
        className="app-container"
        style={{
          opacity: animationDone ? 1 : 0,
          transition: 'opacity 1s ease-in',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Router>
    <ErrorBoundary>
    <Routes>
            {/* Home Page */}
            <Route
              path="/"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <Banner />
                  <BestSellerSection onAdd={addToCart} onWishlist={handleWishlistToggle} products={products} />
                  <HowToMake />
                  <ProductList products={products} onAdd={addToCart} onWishlist={handleWishlistToggle} />
                  <RecipeSection />
                </Layout>
              }
            />

            {/* Cart & Auth Pages */}
            <Route
              path="/cart"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <Cart
                    cartItems={cartItems}
                    onRemove={removeFromCart}
                    onUpdateQuantity={updateCartQuantity}
                    onMoveToWishlist={moveToWishlist}
                    onApplyCoupon={handleApplyCoupon}
                    coupon={coupon}
                    setCoupon={setCoupon}
                    couponError={couponError}
                    discount={discount}
                    subtotal={subtotal}
                    discountedTotal={discountedTotal}
                  />
                </Layout>
              }
            />
            {/* Wishlist route */}
            <Route
              path="/wishlist"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <Wishlist items={wishlistItems} onRemove={removeFromWishlist} onMoveToCart={moveToCart} />
                </Layout>
              }
            />
            {/* NEW (Uses discountedTotal) - Checkout with final price */}
            <Route
              path="/checkout"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <CheckoutPage cartItems={cartItems} total={discountedTotal} />
                </Layout>
              }
            />

            {/* Products listing page */}
            <Route
              path="/products"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <ProductsPage
                    products={products}
                    onAdd={addToCart}
                    onWishlist={handleWishlistToggle}
                    searchTerm={appSearchTerm}
                    setSearchTerm={setAppSearchTerm}
                  />
                </Layout>
              }
            />

            {/* Individual product detail page */}
            <Route
              path="/product/:id"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <ProductLanding
                    products={products}
                    onAddToCart={addToCart}
                    onAddToWishlist={handleWishlistToggle}
                  />
                </Layout>
              }
            />

            {/* Auth Routes (wrapped with Layout for consistent header/footer) */}
            <Route
              path="/login"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <Login />
                </Layout>
              }
            />
            <Route
              path="/register"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <Register />
                </Layout>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <ForgotPassword />
                </Layout>
              }
            />

            {/* Preserve existing checkout flow pages (server-driven payment flow) */}
            <Route path="/checkout-page" element={<Layout><CheckoutPage /></Layout>} />
            <Route path="/payment" element={<Layout><PaymentPage /></Layout>} />
            <Route path="/order-confirmed" element={<Layout><OrderConfirmed /></Layout>} />

            {/* Orders & Account */}
            <Route path="/orders-list" element={<Layout><OrdersPage /></Layout>} />
            {/* Also support /orders as an alias for /orders-list so either URL shows the same page */}
            <Route path="/orders" element={<Layout><OrdersPage /></Layout>} />
            <Route path="/orders/:id" element={<Layout><OrderDetails /></Layout>} />
            <Route path="/account" element={<Layout><MyAccount /></Layout>} />

            {/* Static / Policy / Info Pages */}
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/terms" element={<Layout><Terms /></Layout>} />
            <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
            <Route path="/return-policy" element={<Layout><ReturnPolicy /></Layout>} />
            <Route path="/return-cancel-policy" element={<Layout><ReturnCancelPolicy /></Layout>} />
            <Route path="/shipping-policy" element={<Layout><ShippingPolicy /></Layout>} />
            <Route path="/contact" element={<Layout><ContactUs /></Layout>} />

            {/* Recipe detail pages (uses :type param e.g. /recipe/espresso) */}
            <Route path="/recipe/:type" element={<Layout><RecipePage /></Layout>} />

            {/* Admin */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<ProtectedAdminRoute><AdminMain /></ProtectedAdminRoute>} />
    </Routes>
    </ErrorBoundary>
        </Router>
      </div>
    </>
  );
}

export default App;
