export function renderBorder() {
    const canvas = document.getElementById('borderCanvas');
    const border = canvas?.parentElement;

    if (!canvas || !border) return;

    const ctx = canvas.getContext('2d');

    const squareSize = 8;
    const gap = 2;
    const effectiveSquareSize = squareSize + gap;

    let lastWidth = null;
    let scheduled = false;
    let noise = [];

    function draw(width) {
        const height = squareSize;

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        const numSquares = Math.floor(width / effectiveSquareSize);

        // Only regenerate randomness when count changes
        if (noise.length !== numSquares) {
            noise = Array.from({ length: numSquares }, () => Math.random());
        }

        for (let i = 0; i < numSquares; i++) {
            ctx.fillStyle = `rgba(0, 255, 0, ${noise[i]})`;
            ctx.fillRect(i * effectiveSquareSize, 0, squareSize, squareSize);
        }
    }

    function scheduleDraw(width) {
        if (scheduled) return;
        scheduled = true;

        requestAnimationFrame(() => {
            scheduled = false;
            draw(width);
        });
    }

    const observer = new ResizeObserver(entries => {
        const width = Math.round(entries[0].contentRect.width);

        if (width === lastWidth || width === 0) return;

        lastWidth = width;
        scheduleDraw(width);
    });

    observer.observe(border);
}
