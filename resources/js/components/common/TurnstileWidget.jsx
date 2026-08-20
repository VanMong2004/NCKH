import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const TURNSTILE_SCRIPT_ID = 'ctut-turnstile-script';
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstileScript() {
    if (window.turnstile) {
        return Promise.resolve(window.turnstile);
    }

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);

    if (existingScript) {
        return new Promise((resolve, reject) => {
            existingScript.addEventListener('load', () => resolve(window.turnstile), { once: true });
            existingScript.addEventListener('error', reject, { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');

        script.id = TURNSTILE_SCRIPT_ID;
        script.src = TURNSTILE_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.turnstile);
        script.onerror = reject;

        document.head.appendChild(script);
    });
}

const TurnstileWidget = forwardRef(function TurnstileWidget(
    {
        siteKey,
        enabled = true,
        action = 'guest_checkout',
        onTokenChange,
        onError,
        onExpire,
    },
    ref,
) {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const [loading, setLoading] = useState(Boolean(enabled && siteKey));
    const [scriptError, setScriptError] = useState('');

    useImperativeHandle(ref, () => ({
        reset() {
            if (window.turnstile && widgetIdRef.current !== null) {
                window.turnstile.reset(widgetIdRef.current);
            }
        },
    }));

    useEffect(() => {
        if (!enabled || !siteKey || !containerRef.current) {
            setLoading(false);
            return undefined;
        }

        let cancelled = false;

        setLoading(true);
        setScriptError('');

        loadTurnstileScript()
            .then((turnstile) => {
                if (cancelled || !containerRef.current || !turnstile) {
                    return;
                }

                if (widgetIdRef.current !== null) {
                    turnstile.remove(widgetIdRef.current);
                    widgetIdRef.current = null;
                }

                containerRef.current.innerHTML = '';
                widgetIdRef.current = turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    action,
                    callback: (token) => {
                        onTokenChange?.(token || '');
                    },
                    'expired-callback': () => {
                        onTokenChange?.('');
                        onExpire?.();
                    },
                    'error-callback': () => {
                        onTokenChange?.('');
                        onError?.('Không thể tải xác minh chống spam, vui lòng thử lại.');
                    },
                });

                setLoading(false);
            })
            .catch(() => {
                if (cancelled) {
                    return;
                }

                setScriptError('Không thể tải xác minh chống spam, vui lòng tải lại trang.');
                setLoading(false);
                onTokenChange?.('');
                onError?.('Không thể tải xác minh chống spam, vui lòng tải lại trang.');
            });

        return () => {
            cancelled = true;

            if (window.turnstile && widgetIdRef.current !== null) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [action, enabled, onError, onExpire, onTokenChange, siteKey]);

    if (!enabled || !siteKey) {
        return null;
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    <ShieldCheck size={20} />
                </div>

                <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-blue-950 dark:text-white">
                        Xác minh chống spam
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Vui lòng xác minh trước khi tạo đơn chuyển khoản với tư cách khách chưa đăng nhập.
                    </p>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                {loading ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <Loader2 size={16} className="animate-spin" />
                        Đang tải xác minh chống spam...
                    </div>
                ) : null}

                <div ref={containerRef} className={loading ? 'mt-3' : ''} />

                {scriptError ? (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{scriptError}</span>
                    </div>
                ) : null}
            </div>
        </section>
    );
});

export default TurnstileWidget;
