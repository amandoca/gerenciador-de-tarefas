<template>
  <div class="background-selector">
    <button
      class="background-button"
      data-cy="background-open"
      @click="toggleOptions"
    >
      <span
        class="material-icons"
        style="vertical-align: middle; margin-right: 6px"
      >
        image
      </span>
      {{ $t('kanban.background.change') }}
    </button>

    <div
      v-if="showOptions"
      class="background-options"
      data-cy="background-options"
    >
      <div
        v-for="bg in backgrounds"
        :key="bg.id"
        class="bg-option"
        :class="{ selected: bg.id === selectedBgId }"
        :style="{ backgroundImage: `url(${bg.url})` }"
        @click="setBackground(bg)"
        :data-cy="`bg-option-${bg.id}`"
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
import aurora from '@/assets/aurora.webp'
import mountains from '@/assets/mountains.webp'
import forest from '@/assets/forest-mist.webp'
import beach from '@/assets/beach-sunset.webp'
import neon from '@/assets/neon-city.webp'
import desert from '@/assets/desert-dunes.webp'
import autumn from '@/assets/autumn-forest.webp'
import coder from '@/assets/code-desk.webp'
import minimal from '@/assets/minimal-pastel.webp'
import underwater from '@/assets/underwater.webp'
import citynight from '@/assets/city-night.webp'

export default {
  props: {
    currentBackgroundId: { type: String, default: null }
  },
  emits: ['background-changed'],

  data() {
    return {
      showOptions: false,
      selectedBgId: null,
      backgrounds: [
        { id: 'coffee', url: coffee },
        { id: 'flowers', url: flowers },
        { id: 'food', url: food },
        { id: 'galaxy', url: galaxy },
        { id: 'game', url: game },
        { id: 'mario', url: mario },
        { id: 'starwars', url: starwars },
        { id: 'aurora', url: aurora },
        { id: 'mountains', url: mountains },
        { id: 'forest', url: forest },
        { id: 'beach', url: beach },
        { id: 'neon', url: neon },
        { id: 'desert', url: desert },
        { id: 'autumn', url: autumn },
        { id: 'coder', url: coder },
        { id: 'minimal', url: minimal },
        { id: 'underwater', url: underwater },
        { id: 'citynight', url: citynight }
      ]
    }
  },
  watch: {
    currentBackgroundId: {
      immediate: true,
      handler(val) {
        this.selectedBgId = val
      }
    }
  },
  methods: {
    toggleOptions() {
      this.showOptions = !this.showOptions
    },
    setBackground(bg) {
      this.showOptions = false
      this.selectedBgId = bg.id
      this.$emit('background-changed', bg.id) // ✅ emite ID
    }
  }
}
</script>

<style scoped>
.background-selector {
  position: relative;
  margin: 60px;
}

.background-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(186, 225, 252, 0.18);
  padding: 10px 12px;
  color: white;
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(10px);
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
  top: calc(100% + 10px);
  right: 0;

  width: min(320px, 92vw);
  padding: 12px;

  background: rgba(14, 16, 28, 0.78);
  border: 1px solid rgba(186, 225, 252, 0.14);
  border-radius: 14px;

  backdrop-filter: blur(14px);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);

  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  z-index: 20;
  max-height: 320px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.bg-option {
  height: 64px;
  border-radius: 12px;
  cursor: pointer;

  background-size: cover;
  background-position: center;

  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);

  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}
.bg-option.selected {
  border-color: rgba(255, 224, 138, 0.9);
  box-shadow:
    0 0 0 3px rgba(255, 224, 138, 0.28),
    0 10px 18px rgba(0, 0, 0, 0.32),
    0 0 22px rgba(255, 224, 138, 0.28);
  transform: scale(1.02);
  position: relative;
}

.bg-option.selected::after {
  content: '✓';
  position: absolute;
  top: 6px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(14, 16, 28, 0.75);
  color: #ffe08a;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}
.bg-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.32);
  border-color: rgba(186, 225, 252, 0.28);
}

.bg-option:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}
</style>
