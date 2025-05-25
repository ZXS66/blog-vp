<template>
  <a :href="link" target="_blank" rel="noopener noreferrer">
    {{ text || '🔗' }}
  </a>
</template>

<script setup>
defineProps({
  link: {
    type: String,
    required: true
  },
  text: {
    type: String,
    default: null
  }
});
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
