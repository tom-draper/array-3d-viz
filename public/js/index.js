/**
 * @fileoverview Main entry point for the array visualization application.
 * Handles initial setup, GUI interaction, and orchestrates the visualization.
 */

import { GUI } from './gui.js';
import { validJSONArray, validCSVArray, parseCSVArray, arrayShape } from './array-utils.js';
import { isNumeric } from './types.js'

class App {
    constructor() {
        this.gui = new GUI();
        this.array = undefined;
    }

    init() {
        // Check whether using GUI.
        $.get("/gui", gui => {
            if (gui) {
                this.gui.enableGUI(); // Setup gui and wait for button click to fetch array input.
            } else {
                this.gui.enableViz();
                // Fetch array from saved file from server.
                $.get("/data", data => {
                    $(".result").html(data);
                    this.array = JSON.parse(data);
                    this.gui.startGUI(this.array);
                });
            }
        });

        const canvas = document.getElementById('title-underline-canvas');
        const ctx = canvas.getContext('2d');
        const mainTitle = document.querySelector('.main-title');

        canvas.width = mainTitle.offsetWidth;
        canvas.height = 8;

        const squareSize = 8;
        const gap = 4;
        const numSquares = Math.floor(canvas.width / (squareSize + gap));

        function drawUnderline() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < numSquares; i++) {
                ctx.globalAlpha = Math.random();
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(i * (squareSize + gap), 0, squareSize, squareSize);
            }
            requestAnimationFrame(drawUnderline);
        }

        drawUnderline();
    }

    runInput() {
        const input = $("#arrayInput").val()?.toString().replace(/[ \t]+/g, "");
        if (input) {
            let parsedArray;
            if (validJSONArray(input)) {
                parsedArray = JSON.parse(input);
                if (arrayShape(parsedArray).length > 3) {
                    alert("Maximum of 3 dimensions allowed for JSON array.");
                    return;
                }
            } else if (validCSVArray(input)) {
                parsedArray = parseCSVArray(input);
            } else {
                alert("JSON or CSV format required.");
                return;
            }

            if (parsedArray) {
                console.log(parsedArray);
                this.gui.disableGUI();
                this.gui.enableViz();
                this.array = parsedArray;
                this.gui.startGUI(this.array);
            }
        } else {
            alert("JSON or CSV format required.");
        }
    }

    handleEqualityInput() {
        const equalityInput = document.getElementById("equalityQuery");
        const equalityInputValue = equalityInput?.value;

        if (isNumeric(equalityInputValue)) {
            this.gui.highlightValue(parseFloat(equalityInputValue));
        } else if (equalityInputValue === "") {
            this.gui.resetScale();
        }

        // Erase any inequality input
        const lessThanInput = document.getElementById("lessThanQuery");
        const greaterThanInput = document.getElementById("greaterThanQuery");
        if (lessThanInput) lessThanInput.value = "";
        if (greaterThanInput) greaterThanInput.value = "";
    }

    handleLessThanInput() {
        const lessThanInput = document.getElementById("lessThanQuery");
        const greaterThanInput = document.getElementById("greaterThanQuery");
        const equalityInput = document.getElementById("equalityQuery");

        const lessThanInputValue = lessThanInput?.value;
        const greaterThanInputValue = greaterThanInput?.value;

        if (isNumeric(lessThanInputValue)) {
            let high = Number.POSITIVE_INFINITY;
            if (isNumeric(greaterThanInputValue)) {
                high = parseFloat(greaterThanInputValue);
            }
            this.gui.highlightInequality(parseFloat(lessThanInputValue), high);
        } else if (isNumeric(greaterThanInputValue)) {
            // If just erased less than input, but greater than input available.
            this.gui.highlightInequality(
                Number.NEGATIVE_INFINITY,
                parseFloat(greaterThanInputValue)
            );
        } else if (greaterThanInputValue === "") {
            this.gui.resetScale();
        }

        if (equalityInput) equalityInput.value = ""; // Erase any equality input.
    }

    handleGreaterThanInput() {
        const lessThanInput = document.getElementById("lessThanQuery");
        const greaterThanInput = document.getElementById("greaterThanQuery");
        const equalityInput = document.getElementById("equalityQuery");

        const lessThanInputValue = lessThanInput?.value;
        const greaterThanInputValue = greaterThanInput?.value;

        if (isNumeric(greaterThanInputValue)) {
            let low = Number.NEGATIVE_INFINITY;
            if (isNumeric(lessThanInputValue)) {
                low = parseFloat(lessThanInputValue);
            }
            this.gui.highlightInequality(low, parseFloat(greaterThanInputValue));
        } else if (isNumeric(lessThanInputValue)) {
            // If just erased greater than input, but less than input still available.
            this.gui.highlightInequality(
                parseFloat(lessThanInputValue),
                Number.POSITIVE_INFINITY
            );
        } else if (lessThanInputValue === "") {
            this.gui.resetScale();
        }

        if (equalityInput) equalityInput.value = ""; // Erase any equality input.
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const app = new App();
    app.init();

    window.runInput = () => app.runInput();
    window.handleEqualityInput = () => app.handleEqualityInput();
    window.handleLessThanInput = () => app.handleLessThanInput();
    window.handleGreaterThanInput = () => app.handleGreaterThanInput();

    const cookieBanner = document.getElementById("cookieConsentBanner");
    const acceptButton = document.getElementById("acceptCookies");

    if (!localStorage.getItem("cookiesAccepted")) {
        cookieBanner.style.display = "block";
    }

    acceptButton.addEventListener("click", function () {
        localStorage.setItem("cookiesAccepted", "true");
        cookieBanner.style.display = "none";
    });
});
