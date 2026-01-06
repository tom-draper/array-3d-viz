/**
 * @fileoverview GUI utility functions for controlling visualization interface elements
 */

import { Vis, setArrayDimensions, graphDistribution } from "./visualization.js";

export class GUI {
    constructor() {
        this.vis = new Vis();
    }

    disableGUI() {
        $("#gui").css("display", "none");
    }

    enableGUI() {
        $("#gui").css("display", "flex");
    }

    disableViz() {
        $("#dataViz").css("display", "none");
        $(".equality-container").css("display", "none");
        $(".inequality-container").css("display", "none");
    }

    enableViz() {
        $("#dataViz").css("display", "block");
        $(".equality-container").css("display", "flex");
        $(".inequality-container").css("display", "flex");
    }

    startGUI(arr) {
        graphDistribution(arr);
        setArrayDimensions(arr);
        this.vis.init(arr);
        this.vis.animate();
    }

    highlightValue(value) {
        this.vis.highlightValue(value);
    }

    highlightInequality(low, high) {
        this.vis.highlightInequality(low, high);
    }

    resetScale() {
        this.vis.resetScale();
    }
}
