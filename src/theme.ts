import { createTheme } from '@mantine/core'
import type { MantineColorsTuple } from '@mantine/core'

// Brand colors (MVP)
// Primary: #391354
// Background tint: #efe9f7
const crownPurple: MantineColorsTuple = [
  '#f6effc',
  '#ead9f7',
  '#d5b0ee',
  '#c083e6',
  '#ad60df',
  '#a14ad9',
  '#9b3ad7',
  '#8930bf',
  '#7a2aac',
  '#6a2398',
]

export const theme = createTheme({
  primaryColor: 'crown',
  colors: {
    crown: crownPurple,
  },
  defaultRadius: 'md',
  fontFamily: '"Poppins", ui-sans-serif, system-ui, sans-serif',
})

