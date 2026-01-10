import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function MainLayout() {
    return (
        <div>
            <Header />
            <div className="min-h-screen bg-gray-50 pt-8">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
}

export default MainLayout;
