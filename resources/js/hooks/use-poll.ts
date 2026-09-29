import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Re-reads a JSON endpoint on a timer so a page keeps itself current.
 *
 * Polling rather than websockets on purpose. The clinic runs behind a plain
 * PHP host with no long-lived process to hold a socket open, and the thing
 * being watched is a row in a table that changes when a visitor types. A timer
 * and a 30-row query covers that; a socket server would be a great deal more
 * to run and keep running for a demo that shows a chat arriving.
 *
 * Two things it deliberately does:
 *
 * - Pauses while the tab is hidden and fires immediately on return, so a
 *   closed laptop is not quietly reloading a clinic's inbox all afternoon.
 * - Never overlaps requests. If a poll is slow, the next one waits for it
 *   rather than stacking up behind a database that is already struggling.
 */
export function usePoll<T>(
    url: string | null,
    onData: (data: T) => void,
    intervalMs = 10000,
) {
    const [live, setLive] = useState(false);
    const busy = useRef(false);
    const handler = useRef(onData);

    // Kept in a ref so a caller passing an inline arrow does not restart the
    // timer on every render, which would leave the page never actually polling.
    useEffect(() => {
        handler.current = onData;
    }, [onData]);

    const tick = useCallback(async () => {
        if (!url || busy.current) return;

        busy.current = true;

        try {
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });

            if (response.ok) {
                handler.current((await response.json()) as T);
                setLive(true);
            }
        } catch {
            // A failed poll is not worth surfacing. The page still shows the
            // last known good data, and the next tick will pick up whatever
            // changed in the meantime.
        } finally {
            busy.current = false;
        }
    }, [url]);

    useEffect(() => {
        if (!url) return;

        let timer: ReturnType<typeof setInterval> | null = null;

        const start = () => {
            if (timer) return;
            timer = setInterval(tick, intervalMs);
        };

        const stop = () => {
            if (!timer) return;
            clearInterval(timer);
            timer = null;
        };

        const onVisibility = () => {
            if (document.hidden) {
                stop();
            } else {
                // Catch up straight away rather than making the desk wait out
                // the remainder of the interval after switching back.
                void tick();
                start();
            }
        };

        void tick();
        start();
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            stop();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [url, intervalMs, tick]);

    return { live };
}
