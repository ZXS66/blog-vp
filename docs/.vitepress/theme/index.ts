// https://vitepress.dev/guide/custom-theme
// import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
// import DefaultTheme from 'vitepress/theme-without-fonts';

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
/* import specific icons */
// https://fontawesome.com/v6/icons/?ic=free&s=solid
import {
  faBell,
  faLightbulb,
  faMugHot,
  faSearch,
  faUserSecret,
} from '@fortawesome/free-solid-svg-icons'

import './style.css';
import MyLayout from "./MyLayout.vue";
import ZLink from "../components/ZLink.vue";

/* add icons to the library */
library.add(
  faBell,
  faLightbulb,
  faMugHot,
  faSearch,
  faUserSecret
);

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
    app.component('fa-icon', FontAwesomeIcon);
    app.component('ZLink', ZLink);
  }
} satisfies Theme;
