import TransactionCard from './TransactionCard';

export default function TransactionList({ transactions }) {
    return (
        <section className="space-y-4">
            {transactions.map((item) => (
                <TransactionCard key={item.id} item={item} />
            ))}
        </section>
    );
}
