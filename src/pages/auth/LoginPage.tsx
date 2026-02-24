import { useState } from 'react'
import { Anchor, Button, Card, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { doc, getDoc } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'
import { CenteredPage } from '../../components/CenteredPage'
import { db } from '../../services/firebase'
import { loginWithEmail } from '../../services/user'

export function LoginPage() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Enter a valid email'),
      password: (v) => (v.length >= 6 ? null : 'Password must be at least 6 characters'),
    },
  })

  return (
    <CenteredPage>
      <Stack gap="lg">
        <Title order={1} c="crown.8" ta="center" size="2rem">
          Welcome back
        </Title>
        <Text size="lg" c="dimmed" ta="center">
          Log in to book and manage your appointments.
        </Text>

        <Card withBorder radius="lg" padding="xl" bg="white">
          <form
            onSubmit={form.onSubmit(async (values) => {
              try {
                setLoading(true)
                const user = await loginWithEmail(values.email, values.password)

                let destination: string = '/home'
                try {
                  const snap = await getDoc(doc(db, 'users', user.uid))
                  const data = snap.data() as { role?: string; wantsStylist?: boolean; hasStylistApplication?: boolean } | undefined
                  const role = data?.role
                  const wantsStylist = !!data?.wantsStylist
                  const hasStylistApplication = !!data?.hasStylistApplication

                  if (role === 'stylist') {
                    destination = '/stylist/dashboard'
                  } else if (wantsStylist && !hasStylistApplication) {
                    destination = '/stylist/apply'
                  }
                } catch {
                  // If Firestore read fails, fall back to the default destination.
                }

                nav(destination)
              } catch (e: unknown) {
                notifications.show({
                  color: 'red',
                  title: 'Login failed',
                  message: e instanceof Error ? e.message : 'Please try again.',
                })
              } finally {
                setLoading(false)
              }
            })}
          >
            <Stack>
              <TextInput label="Email" placeholder="you@unc.edu" {...form.getInputProps('email')} />
              <PasswordInput label="Password" {...form.getInputProps('password')} />
              <Button type="submit" color="crown" radius="xl" size="md" loading={loading}>
                Log In
              </Button>
              <Text size="sm" c="dimmed">
                Forgot your password? <Anchor component={Link} to="/forgot">Reset It</Anchor>
              </Text>
              <Text size="sm" c="dimmed">
                New here? <Anchor component={Link} to="/signup">Create An Account</Anchor>
              </Text>
            </Stack>
          </form>
        </Card>
      </Stack>
    </CenteredPage>
  )
}

