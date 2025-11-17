<template>
  <div class="background-selector">
    <button class="background-button" @click="showOptions = !showOptions">
      <span
        class="material-icons"
        style="vertical-align: middle; margin-right: 6px"
      >
        image
      </span>
      Alterar background
    </button>

    <div v-if="showOptions" class="background-options">
      <div
        class="bg-option"
        v-for="bg in backgrounds"
        :key="bg.id"
        :style="{ backgroundImage: `url(${bg.url})` }"
        @click="setBackground(bg.url)"
      />
    </div>
  </div>
</template>

<script>
import coffee from '@/assets/coffee.webp'
import flowers from '@/assets/flowers.webp'
import food from '@/assets/food.webp'
import galaxy from '@/assets/galaxy.webp'
import game from '@/assets/game.webp'
import mario from '@/assets/mario-bross.webp'
import starwars from '@/assets/stars-wars.webp'

export default {
  data() {
    return {
      showOptions: false,
      backgrounds: [
        { id: 'coffee', url: coffee },
        { id: 'flowers', url: flowers },
        { id: 'food', url: food },
        { id: 'galaxy', url: galaxy },
        { id: 'game', url: game },
        { id: 'mario', url: mario },
        { id: 'starwars', url: starwars }
      ]
    }
  },
  mounted() {
    const savedBg = localStorage.getItem('kanbanBackground')
    const defaultBg = mario
    this.$emit('background-changed', savedBg || defaultBg)
  },
  methods: {
    setBackground(url) {
      this.showOptions = false
      localStorage.setItem('kanbanBackground', url)
      this.$emit('background-changed', url)
    }
  }
}
</script>

<style scoped>
.background-selector {
  position: relative;
  margin: 87px;
}

.background-button {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 6px 12px;
  color: white;
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition:
    background 0.2s ease,
    transform 0.1s ease;
}

.background-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.background-options {
  position: absolute;
  top: 40px;
  right: 0;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  z-index: 20;
  width: 240px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.bg-option {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.bg-option:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}
</style>
