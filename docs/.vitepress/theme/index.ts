// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
// import DefaultTheme from 'vitepress/theme-without-fonts';
import './style.css';
import MyLayout from "./MyLayout.vue";
import ZLink from "../components/ZLink.vue";

export default {
  extends: DefaultTheme,
  // Layout: () => {
  //   return h(DefaultTheme.Layout, null, {
  //     // https://vitepress.dev/guide/extending-default-theme#layout-slots
  //   })
  // },
  Layout: MyLayout,
  enhanceApp({ app, router, siteData }) {
    // register your custom global components
    app.component('ZLink', ZLink);
  }
} satisfies Theme;
