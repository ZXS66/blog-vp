<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme';

const { frontmatter: fm, page } = useData()
</script>

<template>
    <DefaultTheme.Layout>
        <template #doc-top>
            {{ page.relativePath }}
            <h1>{{ fm.title }}</h1>
            <div class="sub-title">{{ fm.date }}</div>
        </template>
    </DefaultTheme.Layout>
</template>

<style>
.sub-title {
    text-align: right;
    color: gray;
}
</style>