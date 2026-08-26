import React from "react";
import { createRoot } from "react-dom/client";
import CapitalismCalendar from "./CapitalismCalendar.jsx";

/* ============================================================================
   <capitalism-calendar> — a standard Web Component wrapper.

   This is what makes the calendar "a plugin" rather than "a React file":
   Web Components are a browser-native standard, not a React thing, so this
   one custom element works identically dropped into a React app, a Vue app,
   a plain static HTML page, a WordPress custom-HTML block, a Shopify theme
   section, Webflow/Squarespace embed code — anywhere a <script> tag runs.
   React and ReactDOM are bundled INTO this file, so the host app does not
   need to have React installed itself.

   Usage, from any app/site:
     <script src="capitalism-calendar.js"></script>
     <capitalism-calendar zodiac-boundary="lichun"></capitalism-calendar>

   Attributes (all optional):
     zodiac-boundary   "gregorian" (default) | "lichun"
   ============================================================================ */

class CapitalismCalendarElement extends HTMLElement {
  static get observedAttributes() {
    return ["zodiac-boundary"];
  }

  connectedCallback() {
    if (!this._root) {
      // Shadow DOM keeps the calendar's fonts/CSS from leaking into the host
      // page and vice versa — important for a plugin dropped into an
      // unknown app's stylesheet.
      this._shadow = this.attachShadow({ mode: "open" });
      this._mountPoint = document.createElement("div");
      this._shadow.appendChild(this._mountPoint);
      this._root = createRoot(this._mountPoint);
    }
    this._render();
  }

  attributeChangedCallback() {
    if (this._root) this._render();
  }

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }

  _render() {
    const zodiacBoundary = this.getAttribute("zodiac-boundary") === "lichun" ? "lichun" : "gregorian";
    this._root.render(<CapitalismCalendar zodiacBoundary={zodiacBoundary} />);
  }
}

if (!customElements.get("capitalism-calendar")) {
  customElements.define("capitalism-calendar", CapitalismCalendarElement);
}

export default CapitalismCalendarElement;
