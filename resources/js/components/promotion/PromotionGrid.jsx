import PromotionCard from './PromotionCard';

export default function PromotionGrid({ promotions = [] }) {
    return (
        <section className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {promotions.map((promotion) => (
                <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
        </section>
    );
}
