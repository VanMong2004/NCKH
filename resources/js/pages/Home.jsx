import MainLayout from '../layout/MainLayout';

import HeroSection from '../components/home/HeroSection';
import HomeSearchSection from '../components/home/HomeSearchSection';
import CampaignGrid from '../components/home/CampaignGrid';
import ProductGrid from '../components/product/ProductGrid';
import CategoryList from '../components/home/CategoryList';
import NewsList from '../components/home/NewsList';

import { campaigns, categories, news, products } from '../data/homeData';

export default function Home() {
    return (
        <MainLayout>
            <main className="mx-auto max-w-7xl px-4 py-5">
                <HeroSection />

                <HomeSearchSection />

                <CampaignGrid campaigns={campaigns} />

                <section className="mt-8 grid gap-8 md:grid-cols-[220px_1fr_320px]">
                    <CategoryList categories={categories} />
                    <ProductGrid products={products} />
                    <NewsList news={news} />
                </section>
            </main>
        </MainLayout>
    );
}
