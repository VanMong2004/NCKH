export const DEMO_LOADING_DELAY = 3000;

export function wait(ms = DEMO_LOADING_DELAY) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function withMinimumDelay(promise, delay = DEMO_LOADING_DELAY) {
    const [result] = await Promise.all([
        promise,
        wait(delay),
    ]);

    return result;
}
