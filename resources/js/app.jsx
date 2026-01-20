import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "../css/app.css";
import Home from "./pages/Home";
import MainLayout from "./layout/MainLayout";
import ProductDetail from "./pages/ProductDetail";
import ProductsPage from "./pages/Products";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="/product/:id" element={<ProductDetail />}/>
                    <Route path="/products" element={<ProductsPage />}/>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

createRoot(document.getElementById("app")).render(<App />);
