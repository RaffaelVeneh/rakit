import React, { useEffect, useRef, useState } from 'react';

/**
 * A photograph that is allowed to fail.
 *
 * Every image in this catalogue is a third-party hotlink — PRODUCT.md records that
 * they are placeholders, not owned photography. A hotlink can be slow, blocked,
 * rate-limited or simply gone, and when a surface is a grid of photographs one
 * failed fetch is not a missing detail: it is a broken icon in the largest element
 * on the page, repeated down the whole sheet.
 *
 * The system already has a device for "there is no photograph here" — the drafting
 * hatch, which was only being used when a row had no URL at all. It is the right
 * answer whenever a photograph is unavailable *for any reason*, so this falls back
 * to it and the sheet goes on saying the true thing: that there is no picture.
 *
 * Two failure paths, because one is not enough:
 *
 * 1. `onError` catches the ordinary case, where the request is made and refused.
 * 2. A check after mount catches the case where the request failed **before React
 *    attached the handler**. `error` does not bubble, so it is delivered directly to
 *    the element — and a blocked or instantly-refused request can fail in the same
 *    tick the element is created, which is exactly what happens when a host is
 *    unreachable. The hero's plate hit this path while the lazy-loaded grid plates
 *    did not, which is how it was found.
 */
export function PlatePhoto({
    src,
    srcSet,
    sizes,
    alt = '',
    width,
    height,
    loading = 'lazy',
    className = '',
    style,
    photoRef = null,
    fallbackClassName = 'absolute inset-0',
    ...rest
}) {
    const [failed, setFailed] = useState(false);
    const inner = useRef(null);

    useEffect(() => {
        const node = inner.current;

        // An image that has finished with no intrinsic width did not load, whatever
        // the reason, and nothing is going to try again.
        if (node && node.complete && node.naturalWidth === 0) {
            setFailed(true);
        }
    });

    if (!src || failed) {
        return <span className={`hatch ${fallbackClassName}`} aria-hidden="true" />;
    }

    return (
        <img
            {...rest}
            ref={(node) => {
                inner.current = node;

                if (photoRef) {
                    photoRef.current = node;
                }
            }}
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            decoding="async"
            onError={() => setFailed(true)}
            className={className}
            style={style}
        />
    );
}

export default PlatePhoto;
