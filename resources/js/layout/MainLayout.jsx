import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

function MainLayout() {
    return (
        <div>
            <Header />
            <div className="min-h-screen bg-page transition-colors">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
}

export default MainLayout;
