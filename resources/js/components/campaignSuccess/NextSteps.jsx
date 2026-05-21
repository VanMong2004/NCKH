export default function NextSteps({ steps }) {
    return (
        <section className="mt-8 rounded-2xl bg-white p-5">
            <div className="mb-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <h2 className="text-lg font-extrabold uppercase text-blue-950">Hướng dẫn tiếp theo</h2>
                <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid gap-5 md:grid-cols-4">
                {steps.map((step, index) => (
                    <div key={step.id} className="relative text-center">
                        <div className="absolute left-6 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                            {step.id}
                        </div>

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl">
                            {step.icon}
                        </div>

                        <h3 className="mt-4 font-bold text-blue-950">{step.title}</h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">{step.desc}</p>

                        {index < steps.length - 1 && (
                            <span className="absolute right-[-18px] top-9 hidden text-4xl text-slate-200 md:block">
                                ›
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
