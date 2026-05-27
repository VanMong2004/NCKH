import { useMemo, useState } from 'react';
import { ChevronRight, Home } from 'lucide-react';

import MainLayout from '../../layout/MainLayout';
import AccountSidebar from '../../components/account/AccountSidebar';

import TransactionFilters from '../../components/transactions/TransactionFilters';
import TransactionList from '../../components/transactions/TransactionList';
import TransactionPagination from '../../components/transactions/TransactionPagination';

import { transactions } from '../../data/transactionData';

export default function AccountTransactions() {
    const [activeTab, setActiveTab] = useState(0);

    const filteredTransactions = useMemo(() => {
        if (activeTab === 1) {
            return transactions.filter((item) => item.type === 'E-commerce');
        }

        if (activeTab === 2) {
            return transactions.filter((item) => item.type === 'Campaigns');
        }

        return transactions;
    }, [activeTab]);

    return (
        <div>
            <Breadcrumb />

            <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-blue-950">My Transactions</h1>
                <p className="mt-2 text-sm text-slate-500">View and track all your orders and registrations</p>
            </div>

            <TransactionFilters active={activeTab} onChange={setActiveTab} />

            <TransactionList transactions={filteredTransactions} />

            <div className="mt-6 md:hidden">
                <button className="w-full rounded-lg border border-blue-950 py-3 font-bold text-blue-950">
                    Load More
                </button>
            </div>

            <TransactionPagination />
        </div>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6 hidden items-center gap-2 text-xs font-semibold text-slate-500 md:flex">
            <Home size={14} className="text-blue-950" />
            <ChevronRight size={14} />
            <span>Home</span>
            <ChevronRight size={14} />
            <span>My Account</span>
            <ChevronRight size={14} />
            <span className="text-blue-950">My Transactions</span>
        </div>
    );
}
