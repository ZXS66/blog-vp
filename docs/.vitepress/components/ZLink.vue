<template>
  <a :href="link" target="_blank" :rel="rel">
    <slot>🔗</slot>
  </a>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
const props = defineProps({
  link: {
    type: String,
    required: true
  }
});
const rel = computed(() => {
  return props.link.startsWith('https://') || props.link.startsWith('http://') ? 'noopener noreferrer' : '';
});
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
