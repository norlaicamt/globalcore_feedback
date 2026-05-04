export function register(config) {
    if ("serviceWorker" in navigator) {
        const publicUrl = new URL(
            process.env.PUBLIC_URL,
            window.location.href
        );

        if (publicUrl.origin !== window.location.origin) {
            return;
        }

        window.addEventListener("load", () => {
            const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

            navigator.serviceWorker
                .register(swUrl)
                .then((registration) => {
                    console.log("PWA registered:", registration);

                    if (config && config.onSuccess) {
                        config.onSuccess(registration);
                    }
                })
                .catch((error) => {
                    console.error("PWA registration failed:", error);
                });
        });
    }
}

export function unregister() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.unregister();
        });
    }
}