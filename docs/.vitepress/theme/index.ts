// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
// import DefaultTheme from 'vitepress/theme-without-fonts';
import './style.css';
// import DocLayoutExt from "./DocLayoutExt.vue";

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  // Layout: DocLayoutExt,
  enhanceApp({ app, router, siteData }) {
    // ...
  }
} satisfies Theme;
