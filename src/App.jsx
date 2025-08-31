import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Layout from './components/Layout';

import Banner from './components/Banner';
import BestSellerSection from './components/BestSellerSection';
import ProductList from './components/ProductList';
import ProductLanding from './components/ProductLanding';
import ProductsPage from './components/ProductsPage';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import About from './components/About';
import Checkout from './components/Checkout';
import Terms from './components/Terms';
import PrivacyPolicy from './components/PrivacyPolicy';
import ReturnPolicy from './components/ReturnPolicy';
import ReturnCancelPolicy from './components/ReturnCancelPolicy';
import RecipeSection from './components/RecipeSection';
import RecipePage from './components/RecipePage';
import AdminLogin from './components/AdminLogin';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import AdminMain from './components/AdminMain';
import ContactUs from './components/ContactUs.jsx';
import OrdersPage from './components/OrdersPage';
import ShippingPolicy from './components/ShippingPolicy';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import './App.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import espressoImg from './assets/espresso.jpg';
import cappuccinoImg from './assets/cappuccino.jpg';
import latteImg from './assets/latte.jpg';
import VanillaImg from './assets/Vanilla.jpg';
import HazelnutImg from './assets/Hazelnut.jpg';
import PureImg from './assets/100instant.jpg';
import StrongImg from './assets/7030instant.jpg';
import logo from './assets/logo.png';
import DotGrid from './blocks/Backgrounds/DotGrid/DotGrid.jsx';
import { CircularText } from './blocks/TextAnimations/CircularText/CircularText.jsx';
const auth = getAuth();
const db = getFirestore();

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

  if (loading) {
    return <div>Loading...</div>;
  }

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
  window.setAppSearchTerm = setAppSearchTerm;
  const [products, setProducts] = useState([]);
  // Coupon logic
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountedTotal = Math.max(subtotal - discount, 0);

  // Helper to fetch and validate coupon
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
      setDiscount(0);
      return;
    }
    const couponDoc = snap.docs[0].data();
    if (couponDoc.expiry && couponDoc.expiry.toDate() < new Date()) {
      setCouponError("Coupon expired.");
      setDiscount(0);
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

  // Recalculate discount if cart or coupon changes and coupon is set
  useEffect(() => {
    if (coupon) {
      fetchAndApplyCoupon(coupon, subtotal);
    } else {
      setDiscount(0);
      setCouponError("");
    }
    // eslint-disable-next-line
  }, [subtotal]);

  // Live Firestore product sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (querySnap) => {
      const items = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);

      // Sync cart and wishlist with latest stock info
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

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedCart) setCartItems(JSON.parse(savedCart));
    if (savedWishlist) setWishlistItems(JSON.parse(savedWishlist));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 3100);
    return () => clearTimeout(timer);
  }, []);

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

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };


  // Toggle isWishlisted on product and update wishlist
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
        // Remove from wishlist
        return prev.filter(item => item.id !== product.id);
      } else {
        // Add to wishlist
        return [...prev, { ...product, isWishlisted: true }];
      }
    });
  };

  const moveToWishlist = (product) => {
    removeFromCart(product.id);
    addToWishlist(product);
  };

  const removeFromWishlist = (id) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const moveToCart = (product) => {
    removeFromWishlist(product.id);
    addToCart(product);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  console.log('Cart Items:', cartItems);
  console.log('Wishlist Items:', wishlistItems);

  if (loadingUser) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Logo animation before app loads */}
      {!animationDone && (
        <div id="logo-anim-container" style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
          <img id="logo-anim" src={logo} alt="Bold & Brew Logo" />
        </div>
      )}
      {/* Main App Content Layer */}
      <div
        className="app-container"
        style={{
          opacity: animationDone ? 1 : 0,
          transition: 'opacity 1s ease-in',
          position: 'relative',
          zIndex: 1,
        }}
      >
  {/* Background Layer moved to Layout */}
        <Router>
          <Routes>
            {/* Cart Page */}
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
                    onCheckout={() => window.location.hash = '#/checkout'}
                  />
                </Layout>
              }
            />
            <Route
              path="/checkout"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <Checkout cartItems={cartItems} total={cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)} />
                </Layout>
              }
            />
            {/* Login Route */}
            <Route path="/login" element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <Login />
                </Layout>
            } />
            {/* Register Route */}
            <Route path="/register" element={
              <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                <Register />
              </Layout>
            } />
            {/* Forgot Password Route */}
            <Route path="/forgot-password" element={
              <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                <ForgotPassword />
              </Layout>
            } />
            {/* Admin Routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedAdminRoute>
                  <AdminMain />
                </ProtectedAdminRoute>
              }
            />
            {/* Home Page */}
            <Route
              path="/"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <Banner />
                  <BestSellerSection onAdd={addToCart} onWishlist={handleWishlistToggle} products={products} />
                  <ProductList
                    products={products} // always show all products on home
                    onAdd={addToCart}
                    onWishlist={handleWishlistToggle}
                  />
                  <RecipeSection />
                </Layout>
              }
            />
            {/* Other Pages */}
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
            <Route
              path="/wishlist"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <Wishlist
                    items={wishlistItems}
                    onRemove={removeFromWishlist}
                    onMoveToCart={moveToCart}
                  />
                </Layout>
              }
            />
            <Route
              path="/recipe/:type"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <RecipePage />
                </Layout>
              }
            />
            <Route
              path="/about"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <About />
                </Layout>
              }
            />
            <Route
              path="/contact"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <ContactUs />
                </Layout>
              }
            />
            <Route
              path="/terms"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <Terms />
                </Layout>
              }
            />
            <Route
              path="/privacy"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <PrivacyPolicy />
                </Layout>
              }
            />
            <Route
              path="/return-policy"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <ReturnPolicy />
                </Layout>
              }
            />
            <Route
              path="/return-cancel-policy"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <ReturnCancelPolicy />
                </Layout>
              }
            />
            <Route
              path="/shipping-policy"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <ShippingPolicy />
                </Layout>
              }
            />
            <Route
              path="/orders"
              element={
                <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                  <OrdersPage />
                </Layout>
              }
            />
          </Routes>
        </Router>
      </div>
    </>
  );
}

export default App;