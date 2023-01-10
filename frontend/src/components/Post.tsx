import {
  createStyles,
  Card,
  Image,
  ActionIcon,
  Group,
  Text,
  Avatar,
  Badge,
  DefaultMantineColor,
  MantineGradient,
  Space,
  MantineTheme,
  ColorScheme,
  Button,
  Flex,
  Skeleton,
  CSSObject,
} from '@mantine/core'
import { IconHeart, IconBookmark, IconShare, IconVolumeOff, IconAlertTriangle, IconAlertOctagon } from '@tabler/icons'
import { css } from '@emotion/react'
import type { ArrayElement, PostCategoryNames, RequiredKeys, Union } from 'types'
import { truncateIntegerToString } from 'src/utils/string'
import { HTMLProps, useState } from 'react'
import { truncate } from 'lodash-es'
import type { PostCategory, Prisma } from 'database' // cant use PostCategory exported const
import CategoryBadges, {
  CardBackground,
  PostCategoryKey,
  uniqueCategoryBackground,
} from 'src/components/CategoryBadges'
import { emotesTextToHtml } from 'src/services/twitch'

const useStyles = createStyles((theme) => {
  const shadowColor = theme.colorScheme === 'dark' ? '0deg 0% 10%' : '0deg 0% 50%'

  const actionStyle: CSSObject = {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    color: theme.colorScheme === 'light' ? theme.colors.dark[6] : theme.colors.gray[0],
    //   button: {
    //   backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    //   color: theme.colorScheme === 'light' ? theme.colors.dark[6] : theme.colors.gray[0],
    // },
    ...theme.fn.hover({
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
    }),
  }

  const cardStyle: CSSObject = {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    minWidth: '100%',
    float: 'left',
    overflow: 'hidden',
    // should rework it with gradient shadow instead of border
    // border: `6px solid ${theme.colorScheme === 'dark' ? '#212327' : '#ddd8e4'}`,
    boxShadow: `inset 2px 2px 15px ${theme.colorScheme === 'dark' ? '#524f541d' : '#9993a436'},
    0 2px 10px ${theme.colorScheme === 'dark' ? '#3f3c4025' : '#d5d0df1c'}`,
    transition: 'all .3s ease-in-out',

    [theme.fn.smallerThan('sm')]: {
      width: '90vw',
    },

    ':hover': {
      WebkitTransition: 'all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)',
      transition: 'all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)',
      transform: 'translate3d(0px, -2px, 0)',
      cursor: 'pointer',
      boxShadow: `
          1px 2px 2px hsl(${shadowColor} / 0.333),
          2px 4px 4px hsl(${shadowColor} / 0.333),
          1px 3px 3px hsl(${shadowColor} / 0.333)
        `,
    },
  }

  return {
    skeletonCard: {
      ...cardStyle,
      ':hover': {},
    },

    card: cardStyle,

    title: {
      fontSize: '1.5rem',
    },

    footer: {
      padding: `${theme.spacing.xs}px ${theme.spacing.lg}px`,
      marginTop: theme.spacing.md,
      background: `${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
    },

    action: actionStyle,

    likedAction: {
      ...actionStyle,
      color: theme.colors.red[6] + ' !important',
      '*': {
        color: theme.colors.red[6] + ' !important',
      },
    },
  }
})

interface PostProps extends HTMLProps<HTMLButtonElement> {
  /**
   * Overrides a default image for a category
   */
  image?: string
  categories: Array<PostCategoryKey>
  title: string
  footer: JSX.Element
  likes: number
  author: {
    name: string
    description: string
    image: string
  }
}

/**
 * Interesting possiblities:
 *  - broadcast polls for each post (just for admin or moderator)
 *
 */
export default function Post(props: PostProps) {
  const { image, categories, title, footer, likes, author, ...htmlProps } = props
  const { classes, theme } = useStyles()
  const cardBackground: CardBackground = uniqueCategoryBackground[categories.find((c) => uniqueCategoryBackground[c])]
  const cardBackgroundImage = image ? image : cardBackground ? cardBackground.image : 'auto'
  const cardBackgroundColor = image ? 'auto' : cardBackground ? cardBackground.color(theme.colorScheme) : 'auto'
  const [saveBeacon, setSaveBeacon] = useState(false)
  const [likeBeacon, setLikeBeacon] = useState(false)
  const [hasLiked, setHasLiked] = useState(true)
  const [hasSaved, setHasSaved] = useState(false)

  function renderFooter() {
    return (
      <Card.Section className={classes.footer}>
        <Group position="apart">
          <Text size="xs" color="dimmed">
            {footer}
          </Text>
          <Group spacing={8}>
            <Button
              classNames={{
                root: hasLiked ? classes.likedAction : classes.action,
              }}
              className={hasLiked && likeBeacon ? 'beacon' : ''}
              onClick={(e) => {
                setHasLiked(!hasLiked)
                setLikeBeacon(true)
              }}
              onAnimationEnd={() => setLikeBeacon(false)}
              size="xs"
              leftIcon={
                <IconHeart
                  size={18}
                  color={theme.colors.red[6]}
                  stroke={1.5}
                  {...(hasLiked && { fill: theme.colors.red[6] })}
                />
              }
            >
              <ActionIcon component="div">{truncateIntegerToString(likes)}</ActionIcon>
            </Button>
            <ActionIcon
              className={`${classes.action} ${hasSaved && saveBeacon ? 'beacon' : ''}`}
              onClick={(e) => {
                setHasSaved(!hasSaved)
                setSaveBeacon(true)
              }}
              onAnimationEnd={() => setSaveBeacon(false)}
            >
              <IconBookmark
                size={18}
                color={theme.colors.yellow[6]}
                stroke={1.5}
                {...(hasSaved && { fill: theme.colors.yellow[6] })}
              />
            </ActionIcon>
            <ActionIcon className={classes.action}>
              <IconShare size={16} color={theme.colors.blue[6]} stroke={1.5} />
            </ActionIcon>
          </Group>
        </Group>
      </Card.Section>
    )
  }

  function renderMetadata() {
    return (
      <Group mt="lg">
        {/* TODO twitch GET /users?<...> and replace with profile image */}
        <Avatar src={author.image} radius="sm" />
        <div>
          <Text weight={500}>{author.name}</Text>
          <Text size="xs" color="dimmed">
            {author.description}
          </Text>
        </div>
      </Group>
    )
  }

  function renderTitle() {
    return (
      <Text
        weight={700}
        className={classes.title}
        mt="xs"
        css={css`
          padding-right: 3rem; // leave space for bg decorations
        `}
        dangerouslySetInnerHTML={{ __html: emotesTextToHtml(truncate(title, { length: 100 }), 28) }}
      ></Text>
    )
  }

  // TODO skeleton https://mantine.dev/core/skeleton/
  return (
    <Card
      {...(htmlProps as any)}
      p="lg"
      radius={12}
      className={`${classes.card} ${props.className ?? ''}`}
      /* move to classes */
      css={css`
        background-repeat: no-repeat;
        background-size: 300px;
        background-position: right top;
        background-clip: padding-box;
        background-image: url(${cardBackgroundImage});
        background-color: ${cardBackgroundColor};
        background-clip: padding-box;

        animation: 0.4s ease-out 0s 1 animateIn;

        @keyframes animateIn {
          0% {
            transform: translate3d(0px, 15px, 0) scale(0.8);
            filter: blur(3px);
            opacity: var(0.7);
            transition: opacity 0.3s;
          }
        }
      `}
    >
      {categories.length > 0 && <CategoryBadges categories={categories} />}
      {renderTitle()}
      {renderMetadata()}
      {renderFooter()}
    </Card>
  )
}

export function PostSkeleton(props: Partial<PostProps>) {
  const { classes, theme } = useStyles()
  const { image, categories, title, footer, likes, author, ...htmlProps } = props

  return (
    <Flex
      direction={'column'}
      justify="center"
      p={15}
      css={css`
        background-color: #abaaaa16;
        border-radius: 15px;
      `}
      {...(htmlProps as any)}
      className={`${classes.skeletonCard}  ${props.className ?? ''}`}
    >
      <Skeleton height={8} mt={6} width="90%" radius="xl" mb="xs" />
      <Skeleton height={8} mt={6} width="90%" radius="xl" mb="xs" />
      <Skeleton height={8} mt={6} width="70%" radius="xl" mb="xs" />
      <Space mb={10} />
      <Flex direction={'row'} align={'center'}>
        <Skeleton height={40} circle />
        <Space ml={10} />
        <Skeleton height={8} width="20%" radius="xl" />
      </Flex>
      <Space mb={20} />
      <Skeleton height={8} mt={6} width="70%" radius="xl" mb="xs" />
    </Flex>
  )
}
