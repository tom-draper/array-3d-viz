const MAX_JSON_BYTES = 8192;

export function encodeArray(arr) {
    try {
        const json = JSON.stringify(arr);
        if (json.length > MAX_JSON_BYTES) return null;
        return btoa(json);
    } catch {
        return null;
    }
}

export function decodeArray(encoded) {
    try {
        return JSON.parse(atob(encoded));
    } catch {
        return null;
    }
}

export function saveToURL(arr) {
    const encoded = encodeArray(arr);
    if (encoded) {
        history.replaceState(null, '', `#${encoded}`);
    }
}

export function loadFromURL() {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    return decodeArray(hash);
}

export function clearURL() {
    history.replaceState(null, '', window.location.pathname + window.location.search);
}
