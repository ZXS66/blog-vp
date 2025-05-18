<!-- extending default doc layout -->
<script setup lang="ts">
import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
const { frontmatter, page } = useData();
</script>
<template>
    <DefaultTheme.Layout>
        <template #doc-top>
            {{ page.relativePath }}
            <h1>{{ frontmatter.title }}</h1>
            <div class="sub-title">{{ frontmatter.date }}</div>
        </template>
    </DefaultTheme.Layout>
</template>
<style>
.sub-title {
    text-align: right;
    color: gray;
}
</style>