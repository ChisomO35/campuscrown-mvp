import { Box } from '@mantine/core'

/** Centers content in the main area only (below the nav bar). Height = viewport minus header (52px) minus container vertical padding (2 × 16px). */
export function CenteredPage({ children }: { children: React.ReactNode }) {
  return (
    <Box
      style={{
        minHeight: 'calc(100vh - 52px - 2 * 16px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {children}
    </Box>
  )
}
