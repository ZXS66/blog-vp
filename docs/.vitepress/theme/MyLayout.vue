<!-- https://vitepress.dev/guide/extending-default-theme#layout-slots -->
<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
const { page, frontmatter: fm } = useData();
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-before>
      <h1>{{ fm.title }}</h1>
      📅<span class="sub-title">{{ new Date(fm.date).toLocaleDateString() }}</span>
    </template>
  </DefaultTheme.Layout>
</template>

<style>
h1 {
  /* same with .vp-doc h1 */
  position: relative;
  font-weight: 600;
  outline: none;
  letter-spacing: -0.02em;
  line-height: 40px;
  font-size: 28px;
}

.sub-title {
  color: gray;
  font-style: italic;
  font-size: smaller;
}
</style>