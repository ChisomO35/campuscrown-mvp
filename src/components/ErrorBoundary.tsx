import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button, Center, Container, Stack, Text, Title } from '@mantine/core'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Container>
                    <Center h="100vh">
                        <Stack align="center" gap="md">
                            <Title order={2}>Something went wrong</Title>
                            <Text c="dimmed" ta="center">
                                We encountered an unexpected error. Please try reloading the page.
                            </Text>
                            <Button onClick={() => window.location.reload()} variant="light" color="crown">
                                Reload Page
                            </Button>
                            {import.meta.env.DEV && this.state.error && (
                                <Text component="pre" size="xs" c="red" bg="gray.1" p="xs" style={{ overflow: 'auto', maxWidth: '100%' }}>
                                    {this.state.error.toString()}
                                </Text>
                            )}
                        </Stack>
                    </Center>
                </Container>
            )
        }

        return this.props.children
    }
}
