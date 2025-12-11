// client/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import VendorDashboard from "./pages/VendorDashboard";
import Browse from "./pages/Browse";          // <-- this must exist
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderDetails from "./pages/OrderDetails";
import OrderHistory from "./pages/OrderHistory";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="signup" element={<Signup />} />
          <Route path="login" element={<Login />} />
          <Route path="browse" element={<Browse />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/orders" element={<OrderHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
