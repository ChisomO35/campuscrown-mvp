import { Button, Card, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { CenteredPage } from '../../components/CenteredPage'
import { sendReset } from '../../services/user'

export function ForgotPasswordPage() {
  const form = useForm({
    initialValues: { email: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Enter a valid email'),
    },
  })

  return (
    <CenteredPage>
    <Stack gap="lg">
      <Title order={1} c="crown.8" size="2rem" ta="center">
        Reset password
      </Title>
      <Text size="lg" c="dimmed" ta="center">We’ll email you a reset link.</Text>

      <Card withBorder radius="lg" padding="xl" bg="white">
        <form
          onSubmit={form.onSubmit(async ({ email }) => {
            try {
              await sendReset(email)
              notifications.show({
                color: 'crown',
                title: 'Check your email',
                message: 'Password reset link sent.',
              })
            } catch (e: any) {
              notifications.show({
                color: 'red',
                title: 'Could not send email',
                message: e?.message ?? 'Please try again.',
              })
            }
          })}
        >
          <Stack>
            <TextInput label="Email" placeholder="you@unc.edu" {...form.getInputProps('email')} />
            <Button type="submit" color="crown" radius="xl" size="md">
              Send reset link
            </Button>
          </Stack>
        </form>
      </Card>
    </Stack>
    </CenteredPage>
  )
}

