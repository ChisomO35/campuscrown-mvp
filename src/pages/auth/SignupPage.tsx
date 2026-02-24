import { useState } from 'react'
import { Anchor, Button, Card, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { CenteredPage } from '../../components/CenteredPage'
import { signupWithEmail } from '../../services/user'

type SignupIntent = 'client' | 'stylist'

export function SignupPage() {
  const nav = useNavigate()
  const location = useLocation()
  const intent: SignupIntent = location.pathname.includes('/signup/stylist') ? 'stylist' : 'client'
  const [loading, setLoading] = useState(false)
  const form = useForm({
    initialValues: { displayName: '', email: '', password: '', confirmPassword: '' },
    validate: {
      displayName: (v) => (v.trim().length >= 2 ? null : 'Enter your name'),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Enter a valid email'),
      password: (v) => (v.length >= 6 ? null : 'Password must be at least 6 characters'),
      confirmPassword: (v, values) => (v === values.password ? null : 'Passwords must match'),
    },
  })

  const subtitle = intent === 'stylist'
    ? 'Step 1 of 2 — create your account. You’ll complete your stylist profile next.'
    : 'Create your account to book stylists near UNC.'

  return (
    <CenteredPage>
      <Stack gap="lg">
        <Title order={1} c="crown.8" size="2rem" ta="center">
          Create your account
        </Title>
        <Text size="lg" c="dimmed" ta="center">{subtitle}</Text>

        <Card withBorder radius="lg" padding="xl" bg="white">
          <form
            onSubmit={form.onSubmit(async (values) => {
              try {
                setLoading(true)
                const { displayName, email, password } = values
                await signupWithEmail({ displayName, email, password, stylistIntent: intent === 'stylist' })
                notifications.show({
                  color: 'green',
                  title: 'Account created',
                  message: intent === 'stylist' ? 'Complete your stylist application next.' : 'Taking you to the app…',
                })
                await new Promise((r) => setTimeout(r, 300))
                nav(intent === 'stylist' ? '/stylist/apply' : '/home')
              } catch (e: unknown) {
                notifications.show({
                  color: 'red',
                  title: 'Signup failed',
                  message: e instanceof Error ? e.message : 'Please try again.',
                })
              } finally {
                setLoading(false)
              }
            })}
          >
            <Stack>
              <TextInput label="Name" placeholder="Your name" {...form.getInputProps('displayName')} />
              <TextInput label="Email" placeholder="you@unc.edu" {...form.getInputProps('email')} />
              <PasswordInput label="Password" {...form.getInputProps('password')} />
              <PasswordInput label="Confirm password" {...form.getInputProps('confirmPassword')} />
              <Button type="submit" color="crown" radius="xl" size="md" loading={loading}>
                Sign Up
              </Button>
              <Text size="sm" c="dimmed" ta="center">
                Already have an account? <Anchor component={Link} to="/login">Log In</Anchor>
                {' · '}
                <Anchor component={Link} to="/signup">Change Signup Type</Anchor>
              </Text>
            </Stack>
          </form>
        </Card>
      </Stack>
    </CenteredPage>
  )
}

