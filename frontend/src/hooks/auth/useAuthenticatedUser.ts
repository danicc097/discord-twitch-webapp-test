import { QueryClient, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { persister } from 'src/App'
import { useTwitchUser, useTwitchUserFollower, useTwitchUserSubscriber } from 'src/queries/twitch'
import { TWITCH_ACCESS_TOKEN_COOKIE, UI_SLICE_PERSIST_KEY } from 'src/slices/ui'

export default function useAuthenticatedUser() {
  const queryClient = useQueryClient()
  const { data: twitchUser } = useTwitchUser()
  const { data: twitchUserFollower } = useTwitchUserFollower()
  const { data: twitchUserSubscriber } = useTwitchUserSubscriber()

  const isSubscriber = !!twitchUserSubscriber?.data[0].broadcaster_id
  const isFollower = !!twitchUserFollower?.data[0].to_id

  function logout() {
    Cookies.remove(TWITCH_ACCESS_TOKEN_COOKIE, {
      expires: 365,
      sameSite: 'none',
      secure: true,
    })
    localStorage.removeItem(UI_SLICE_PERSIST_KEY)
    persister.removeClient()
    queryClient.invalidateQueries()
    window.location.reload()
  }

  return {
    logout,
    isSubscriber,
    isFollower,
  }
}
