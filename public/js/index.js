/**
 * @fileoverview Main entry point for the array visualization application.
 * Handles initial setup, GUI interaction, and orchestrates the visualization.
 */

import { GUI } from "./gui.js";
import {
    arrayShape,
    parseCSVArray,
    validCSVArray,
    validJSONArray,
} from "./array-utils.js";
import { isNumeric } from "./types.js";
import { renderBorder } from "./border.js";

class App {
    constructor() {
        this.gui = new GUI();
        this.array = undefined;
    }

    init() {
        fetch("/gui")
            .then(r => r.json())
            .then(gui => {
                if (gui) {
                    this.gui.enableGUI();
                } else {
                    this.gui.disableGUI();
                    this.gui.enableViz();
                    return fetch("/data")
                        .then(r => r.text())
                        .then(data => {
                            this.array = JSON.parse(data);
                            this.gui.startGUI(this.array);
                        });
                }
            });
    }

    showError(message) {
        const el = document.getElementById("inputError");
        if (el) {
            el.textContent = message;
            el.hidden = false;
        }
    }

    clearError() {
        const el = document.getElementById("inputError");
        if (el) el.hidden = true;
    }

    runInput() {
        const input = document.getElementById("arrayInput")
            ?.value
            ?.replace(/[ \t]+/g, "");
        if (input) {
            let parsedArray;
            if (validJSONArray(input)) {
                parsedArray = JSON.parse(input);
                if (arrayShape(parsedArray).length > 3) {
                    this.showError("Maximum of 3 dimensions allowed for JSON array.");
                    return;
                }
            } else if (validCSVArray(input)) {
                parsedArray = parseCSVArray(input);
            } else {
                this.showError("JSON or CSV format required.");
                return;
            }

            if (parsedArray) {
                this.clearError();
                this.gui.disableGUI();
                this.gui.enableViz();
                this.array = parsedArray;
                this.gui.startGUI(this.array);
            }
        } else {
            this.showError("JSON or CSV format required.");
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
                parseFloat(greaterThanInputValue),
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
            this.gui.highlightInequality(
                low,
                parseFloat(greaterThanInputValue),
            );
        } else if (isNumeric(lessThanInputValue)) {
            // If just erased greater than input, but less than input still available.
            this.gui.highlightInequality(
                parseFloat(lessThanInputValue),
                Number.POSITIVE_INFINITY,
            );
        } else if (lessThanInputValue === "") {
            this.gui.resetScale();
        }

        if (equalityInput) equalityInput.value = ""; // Erase any equality input.
    }

    /**
     * Handle X-axis slice input
     */
    handleXSliceInput() {
        const input = document.getElementById("xSliceQuery");
        const value = input.value.trim();

        // Parse the input - null if empty, otherwise convert to number
        const xSlice = value === "" ? null : parseInt(value, 10);

        // Get current Y and Z slice values
        const yInput = document.getElementById("ySliceQuery").value.trim();
        const zInput = document.getElementById("zSliceQuery").value.trim();
        const ySlice = yInput === "" ? null : parseInt(yInput, 10);
        const zSlice = zInput === "" ? null : parseInt(zInput, 10);

        // Validate the input
        if (value !== "" && (isNaN(xSlice) || xSlice < 0)) {
            console.warn("Invalid X slice value");
            return;
        }

        // Apply the slice to the visualization
        this.gui.highlightSlice(xSlice, ySlice, zSlice);
    }

    /**
     * Handle Y-axis slice input
     */
    handleYSliceInput() {
        const input = document.getElementById("ySliceQuery");
        const value = input.value.trim();

        const ySlice = value === "" ? null : parseInt(value, 10);

        const xInput = document.getElementById("xSliceQuery").value.trim();
        const zInput = document.getElementById("zSliceQuery").value.trim();
        const xSlice = xInput === "" ? null : parseInt(xInput, 10);
        const zSlice = zInput === "" ? null : parseInt(zInput, 10);

        if (value !== "" && (isNaN(ySlice) || ySlice < 0)) {
            console.warn("Invalid Y slice value");
            return;
        }

        // Apply the slice to the visualization
        this.gui.highlightSlice(xSlice, ySlice, zSlice);
    }

    /**
     * Handle Z-axis slice input
     */
    handleZSliceInput() {
        const input = document.getElementById("zSliceQuery");
        const value = input.value.trim();

        const zSlice = value === "" ? null : parseInt(value, 10);

        const xInput = document.getElementById("xSliceQuery").value.trim();
        const yInput = document.getElementById("ySliceQuery").value.trim();
        const xSlice = xInput === "" ? null : parseInt(xInput, 10);
        const ySlice = yInput === "" ? null : parseInt(yInput, 10);

        if (value !== "" && (isNaN(zSlice) || zSlice < 0)) {
            console.warn("Invalid Z slice value");
            return;
        }

        // Apply the slice to the visualization
        this.gui.highlightSlice(xSlice, ySlice, zSlice);
    }

    clearAllSlices() {
        this.gui.clearAllSlices();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const app = new App();
    app.init();

    window.runInput = () => app.runInput();
    window.handleEqualityInput = () => app.handleEqualityInput();
    window.handleLessThanInput = () => app.handleLessThanInput();
    window.handleGreaterThanInput = () => app.handleGreaterThanInput();
    window.handleXSliceInput = () => app.handleXSliceInput();
    window.handleYSliceInput = () => app.handleYSliceInput();
    window.handleZSliceInput = () => app.handleZSliceInput();
    window.clearAllSlices = () => app.clearAllSlices();

    // const cookieBanner = document.getElementById("cookieConsentBanner");
    // const acceptButton = document.getElementById("acceptCookies");

    // if (!localStorage.getItem("cookiesAccepted")) {
    //     cookieBanner.style.display = "block";
    // }

    // acceptButton.addEventListener("click", function () {
    //     localStorage.setItem("cookiesAccepted", "true");
    //     cookieBanner.style.display = "none";
    // });

    requestAnimationFrame(renderBorder);
});
