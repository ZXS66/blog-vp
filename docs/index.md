---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "ZXS's blog"
  text: "Please scroll down to see more"
  tagline: ""
  actions:
    - theme: brand
      text: App
      link: https://johnzhu.online/ng
    - theme: alt
      text: About Me
      link: https://johnzhu.online/ng#/resume/2025

features:
  - icon: ⚡️
    title: Adocs, The DX that can't be beat
    details: Lorem ipsum...
  - icon: 🎉
    title: Power of Vue meets Markdown
    details: Lorem ipsum...
  - icon: 🔥
    title: Simple and minimal, always
    details: Lorem ipsum...
  - icon: 🎀
    title: Stylish and cool
    details: Lorem ipsum...

sidebar: false

---

<script setup lang="ts">
import { useData } from 'vitepress'
const data=useData();
const site=data.site;
const theme = data.theme;

const base = site.base;
</script>

<section class="doc-list" v-for="item in theme.sidebar" :key="item.text">
    <strong>{{ item.text }}</strong>
    <ul>
        <li v-for="child in item.items" :key="child.text">
            <a :href="site.base+child.link.substring(1)">{{ child.text }}</a>
        </li>
    </ul>
</section>
