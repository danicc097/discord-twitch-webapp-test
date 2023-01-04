import { formatURLWithQueryParams } from '../utils/url'

export async function validateTwitchToken(token: string | null): Promise<boolean> {
  if (!token) return false

  const res = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: {
      Authorization: `OAuth ${token}`,
    },
  })

  if (res.status !== 200) {
    return false
  }

  return true
}

/**
 * Login with twitch and return bot token.
 * Will use to show twitch info without user login.
 */
export async function twitchAppLogin(): Promise<string> {
  const res = await (
    await fetch(
      formatURLWithQueryParams('https://id.twitch.tv/oauth2/token', {
        client_id: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ?? '',
        client_secret: process.env.TWITCH_CLIENT_SECRET ?? '',
        grant_type: 'client_credentials',
      }),
      {
        method: 'POST',
      },
    )
  ).json()

  return res.access_token
}