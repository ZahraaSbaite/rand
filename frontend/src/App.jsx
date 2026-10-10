import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { SiteProvider } from "./context/SiteContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Collections from "./pages/Collections.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import OrderTracking from "./pages/OrderTracking.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import CustomOrders from "./pages/CustomOrders.jsx";
import Lookbook from "./pages/Lookbook.jsx";
import OurStory from "./pages/OurStory.jsx";
import TheProcess from "./pages/TheProcess.jsx";
import FAQ from "./pages/FAQ.jsx";
import Contact from "./pages/Contact.jsx";
import Shipping from "./pages/Shipping.jsx";
import Returns from "./pages/Returns.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import Terms from "./pages/Terms.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import Admin from "./pages/Admin.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

export default function App() {
  const isAdmin = useLocation().pathname.startsWith("/admin");

  return (
    <ThemeProvider>
      <SiteProvider>
      <CartProvider>
        <WishlistProvider>
          <ScrollToTop />
          {!isAdmin && <Navbar />}

          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:category" element={<Shop />} />
            <Route path="/collections" element={<Collections />} />

            <Route path="/product/:id" element={<ProductPage />} />

            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
            <Route path="/wishlist" element={<Wishlist />} />

            <Route path="/custom-orders" element={<CustomOrders />} />
            <Route path="/lookbook" element={<Lookbook />} />
            <Route path="/our-story" element={<OurStory />} />
            <Route path="/the-process" element={<TheProcess />} />
            <Route path="/reviews" element={<Navigate to="/#reviews" replace />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Admin login page - public */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin dashboard - protected */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>

          {!isAdmin && <Footer />}
        </WishlistProvider>
      </CartProvider>
      </SiteProvider>
    </ThemeProvider>
  );
}
