---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "我滴个人站点"
  text: ""
  tagline: "随缘更新，敬请期待。😊"
  actions:
    - theme: brand
      text: App
      link: https://johnzhu.online/ng
    - theme: alt
      text: 关于我
      link: https://johnzhu.online/ng#/resume/2025
sidebar: false
---

<script setup lang="ts">
import { useData } from 'vitepress'
const data=useData();
const site=data.site;
const theme = data.theme;
</script>

<article class="doc-list">
  <template class="doc-list" v-for="item in theme.sidebar" :key="item.text">
      <template v-for="(child,idx) in item.items" :key="child.text">
          <strong v-if="idx===0">{{ item.text }}</strong>
          <div><a :href="site.base+child.link.substring(1)">{{ child.text }}</a></div>
      </template>
  </template>
</article>
