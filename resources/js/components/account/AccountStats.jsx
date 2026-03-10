import React from 'react';

export default function AccountStats({ stats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div key={stat.label} className="card p-6 flex items-start gap-4">
                        <div className={`${stat.color} p-3 rounded-lg`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted">{stat.label}</p>
                            <p className="text-3xl font-bold text-title mt-1">{stat.value}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
