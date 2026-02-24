import { ActionIcon, Group, Paper, Text, Indicator } from '@mantine/core'
import { IconCalendarEvent, IconHome, IconMessageCircle, IconUser } from '@tabler/icons-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useEffect, useState } from 'react'
import { listenForConversations } from '../services/bookings'

function useTabParam(): string | null {
  const loc = useLocation()
  const params = new URLSearchParams(loc.search)
  return params.get('tab')
}

export function BottomNav() {
  const nav = useNavigate()
  const loc = useLocation()
  const tab = useTabParam()
  const { appUser } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!appUser?.uid) return

    const unsub = listenForConversations(appUser.uid, (conversations) => {
      const total = conversations.reduce((acc, c) => {
        return acc + (c.unreadCount?.[appUser.uid] || 0)
      }, 0)
      setUnreadCount(total)
    })

    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [appUser?.uid])

  const isStylist = appUser?.role === 'stylist'

  const profilePath = isStylist ? '/stylist/profile' : '/profile'

  const items = isStylist
    ? [
      { label: 'Messages', path: '/stylist/messages', tab: null, icon: IconMessageCircle },
      { label: 'Bookings', path: '/stylist/dashboard', tab: null, icon: IconCalendarEvent },
      { label: 'Profile', path: profilePath, tab: null, icon: IconUser },
    ]
    : [
      { label: 'Home', path: '/home', tab: null, icon: IconHome },
      { label: 'Messages', path: '/bookings?tab=messages', tab: 'messages', icon: IconMessageCircle },
      { label: 'Bookings', path: '/bookings', tab: null, icon: IconCalendarEvent },
      { label: 'Profile', path: profilePath, tab: null, icon: IconUser },
    ]

  const isActive = (item: (typeof items)[0]) => {
    if (item.label === 'Home') return loc.pathname === '/home'
    if (item.label === 'Messages') {
      if (isStylist) return loc.pathname === '/stylist/messages'
      return loc.pathname === '/bookings' && tab === 'messages'
    }
    if (item.label === 'Bookings') {
      if (isStylist) return loc.pathname === '/stylist/dashboard'
      return loc.pathname === '/bookings' && tab !== 'messages'
    }
    if (item.label === 'Profile') {
      if (isStylist) return loc.pathname === '/stylist/profile'
      return loc.pathname === '/profile'
    }
    return false
  }

  return (
    <Paper
      withBorder
      radius={0}
      style={{
        height: 64,
        background: '#f7f2fb',
      }}
    >
      <Group justify="space-around" h="100%" px="sm">
        {items.map((it) => {
          const ActiveIcon = it.icon
          const active = isActive(it)
          return (
            <Group key={it.label} gap={4} style={{ flexDirection: 'column' }}>
              <Indicator
                disabled={it.label !== 'Messages' || unreadCount === 0}
                color="red"
                size={16}
                label={unreadCount > 0 ? unreadCount : undefined}
                withBorder
                offset={2}
              >
                <ActionIcon
                  variant={active ? 'filled' : 'subtle'}
                  color={active ? 'crown' : 'gray'}
                  radius="xl"
                  onClick={() => nav(it.path)}
                  aria-label={it.label}
                >
                  <ActiveIcon size={20} />
                </ActionIcon>
              </Indicator>
              <Text size="xs" c={active ? 'crown.7' : 'dimmed'} fw={active ? 600 : 500}>
                {it.label}
              </Text>
            </Group>
          )
        })}
      </Group>
    </Paper>
  )
}

