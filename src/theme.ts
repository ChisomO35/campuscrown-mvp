import { createTheme } from '@mantine/core'
import type { MantineColorsTuple } from '@mantine/core'

// Brand colors (MVP)
const burgundy: MantineColorsTuple = [
  '#f6eaea',
  '#e9d1d0',
  '#cca09d',
  '#b06c68',
  '#97403a',
  '#8B3A34',
  '#7d322c',
  '#6e2925',
  '#60231f',
  '#481a17',
]

const gold: MantineColorsTuple = [
  '#fdf9f1',
  '#f8ecdd',
  '#edd1b4',
  '#e4b588',
  '#dc9a60',
  '#D4A94F',
  '#b68f41',
  '#997632',
  '#7d5d24',
  '#634515',
]

export const theme = createTheme({
  primaryColor: 'burgundy',
  colors: {
    burgundy,
    gold,
    royalBlue: ['#f0f4fa', '#e1e8f5', '#c3d1ea', '#a5badf', '#87a2d4', '#6a8bc8', '#4c74bd', '#3a61a6', '#2F4A7A', '#1f3152'],
  },
  black: '#1A1A1A',     // Contrast: Soft Black
  white: '#F5F1EC',     // Use Cream as default white
  defaultRadius: 'md',
  fontFamily: '"Inter", sans-serif',
  headings: {
    fontFamily: '"Playfair Display", serif',
  },
  components: {
    Paper: {
      styles: {
        root: {
          backgroundColor: '#E8E1D8', // Card Neutral: Sand
          color: '#4A2F24',           // Primary Text: Deep Brown
        }
      }
    },
    Card: {
      styles: {
        root: {
          backgroundColor: '#E8E1D8',
          color: '#4A2F24',
        }
      }
    },
    Text: {
      styles: {
        root: {
          color: '#4A2F24',
        }
      }
    }
  }
})
