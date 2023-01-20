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
  Tooltip,
  AspectRatio,
  Popover,
  CloseButton,
  Box,
  SelectItemProps,
  MultiSelectValueProps,
  MultiSelect,
} from '@mantine/core'
import {
  IconHeart,
  IconBookmark,
  IconShare,
  IconVolumeOff,
  IconAlertTriangle,
  IconAlertOctagon,
  IconShieldCheck,
  IconShieldOff,
  IconShield,
  IconTrash,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconEdit,
  IconPlus,
  IconCheck,
} from '@tabler/icons'
import { css } from '@emotion/react'
import {
  ArrayElement,
  PostCategoryNames,
  PostPatchRequest,
  PostResponse,
  PostsGetResponse,
  RequiredKeys,
  Union,
} from 'types'
import { joinWithAnd, truncateIntegerToString } from 'src/utils/string'
import React, { HTMLProps, forwardRef, useEffect, useState, useRef } from 'react'
import { truncate } from 'lodash-es'
import type { Post, PostCategory, Prisma, User } from 'database' // cant use PostCategory exported const
import CategoryBadge, {
  CardBackground,
  PostCategoryKey,
  categoryEmojis,
  uniqueCategoryBackground,
  uniqueCategories,
} from 'src/components/CategoryBadge'
import { emotesTextToHtml } from 'src/services/twitch'
import { usePostsSlice } from 'src/slices/posts'
import ProtectedComponent from 'src/components/ProtectedComponent'
import { usePostDeleteMutation, usePostPatchMutation, usePosts } from 'src/queries/api/posts'
import { showRelativeTimestamp } from 'src/utils/date'
import { InfiniteData, useQueryClient } from '@tanstack/react-query'
import useAuthenticatedUser from 'src/hooks/auth/useAuthenticatedUser'
import { isAuthorized } from 'src/services/authorization'
import { closeAllModals, openConfirmModal, openContextModal, openModal } from '@mantine/modals'
import { useUISlice } from 'src/slices/ui'
import { useOnClickOutside } from 'usehooks-ts'
import { getMatchingKeys } from 'src/utils/object'
import ErrorCallout from 'src/components/ErrorCallout/ErrorCallout'
import { useForm } from '@mantine/form'
import { extractErrorMessages } from 'src/utils/errors'
import { showNotification } from '@mantine/notifications'

const useStyles = createStyles((theme) => {
  const shadowColor = theme.colorScheme === 'dark' ? '0deg 0% 10%' : '0deg 0% 50%'
  const footerBackground = `${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`

  const actionStyle: CSSObject = {
    border: 0,
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    color: theme.colorScheme === 'light' ? theme.colors.dark[6] : theme.colors.gray[0],
    //   button: {
    //   backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    //   color: theme.colorScheme === 'light' ? theme.colors.dark[6] : theme.colors.gray[0],
    // },
    ...theme.fn.hover({
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
    }),

    ':disabled': {
      background: footerBackground,
    },
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

      backgroundColor: theme.colorScheme === 'light' ? '#abaaaa2c' : '#3f3a3a2f',
      borderRadius: '15px',
      ':hover': {},
      boxShadow: 'none',
      animation: 'fade-in-color 1.8s infinite',
      '@keyframes fade-in-color': {
        '0%': {
          opacity: theme.colorScheme === 'light' ? 0.3 : 1,
        },
        '50%': {
          opacity: 0,
        },
        '100%': {
          opacity: theme.colorScheme === 'light' ? 0.3 : 1,
        },
      },
    },

    card: cardStyle,

    title: {
      fontSize: '1.5rem',
      paddingRight: '3rem', // for bg decorations
    },

    footer: {
      padding: `${theme.spacing.xs}px ${theme.spacing.lg}px`,
      marginTop: theme.spacing.md,
      background: footerBackground,
    },

    action: actionStyle,

    categoryAction: {
      ...actionStyle,
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3],
    },

    likedAction: {
      ...actionStyle,
      color: theme.colors.red[6] + ' !important',
      '*': {
        color: theme.colors.red[6] + ' !important',
      },
    },
  }
})

const categoriesData = Object.entries(PostCategoryNames).map(([k, v]) => ({ label: v, value: k }))

const EMOJI_SIZE = 16

function Value({ value, label, onRemove, classNames, ...others }: MultiSelectValueProps & { value: string }) {
  const emoji = categoryEmojis[value] ? (
    <Box mr={10}>
      <img src={categoryEmojis[value]} height={EMOJI_SIZE} width={EMOJI_SIZE} />{' '}
    </Box>
  ) : null

  const CB: any = CloseButton // TS2590 workaround

  return (
    <div {...others} onClickCapture={(e) => e.stopPropagation()}>
      <Box
        sx={(theme) => ({
          display: 'flex',
          cursor: 'default',
          alignItems: 'center',
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[4]}`,
          paddingLeft: 10,
          borderRadius: 4,
        })}
      >
        {emoji}
        <Box sx={{ lineHeight: 1, fontSize: 12 }}>{label}</Box>
        <CB onMouseDown={onRemove} variant="transparent" size={22} iconSize={14} tabIndex={-1} />
      </Box>
    </div>
  )
}

const Item = forwardRef<HTMLDivElement, SelectItemProps>(({ label, value, ...others }, ref) => {
  const emoji = (
    <Box mr={10}>
      {categoryEmojis[value] ? (
        <img src={categoryEmojis[value]} height={EMOJI_SIZE} width={EMOJI_SIZE} />
      ) : (
        <Space w={EMOJI_SIZE} />
      )}
    </Box>
  )

  return (
    <div ref={ref} {...others}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {emoji}
        <div>{label}</div>
      </Box>
    </div>
  )
})

interface PostProps extends HTMLProps<HTMLButtonElement> {
  /**
   * Overrides a default image for a category
   */
  post: PostResponse
  backgroundImage?: string
  footer: JSX.Element
}

/**
 * Interesting possiblities:
 *  - broadcast poll creation per each post if role higher than user
 *
 */
function Post(props: PostProps) {
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthenticatedUser()
  const { post, backgroundImage, footer, className, ...htmlProps } = props
  const { classes, theme } = useStyles()
  const cardBackground: CardBackground =
    uniqueCategoryBackground[post.categories.find((c) => uniqueCategoryBackground[c])]
  const cardBackgroundImage = backgroundImage ? backgroundImage : cardBackground ? cardBackground.image : 'auto'
  const cardBackgroundColor = backgroundImage
    ? 'auto'
    : cardBackground
    ? cardBackground.color(theme.colorScheme)
    : 'auto'
  const [moderateButtonLoading, setModerateButtonLoading] = useState(false)
  const [lastSeenBeacon, setLastSeenBeacon] = useState(false)
  const [saveBeacon, setSaveBeacon] = useState(false)
  const [likeBeacon, setLikeBeacon] = useState(false)
  const { addCategoryFilter, removeCategoryFilter, getPostsQueryParams } = usePostsSlice()
  const postPatchMutation = usePostPatchMutation()
  const postDeleteMutation = usePostDeleteMutation()
  const usePostsQuery = usePosts()

  /**
   * TODO background image if lastSeenPostId !== post.id overriding existing one
   */
  const { lastSeenPostId, setLastSeenPostId } = useUISlice()

  const canDeletePost = post.userId === user.data?.id || isAuthorized(user.data, 'MODERATOR')

  const hasLiked = post?.likedPosts?.length > 0
  const hasSaved = post?.savedPosts?.length > 0

  useEffect(() => {
    if (!postPatchMutation.isLoading) {
      setModerateButtonLoading(false)
    }
  }, [postPatchMutation])

  const handleSaveButtonClick = (e) => {
    e.stopPropagation()

    const onSuccess = (data, variables, context) => {
      queryClient.setQueryData<InfiniteData<PostsGetResponse>>([`apiGetPosts`, getPostsQueryParams], (data) => ({
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          data: page.data.map((p) => {
            if (p.id === post.id) {
              console.log('updating react query data')
              if (hasSaved) {
                p.savedPosts = []
              } else {
                p.savedPosts = [{ postId: p.id, userId: p.userId }]
              }
            }
            return p
          }),
        })),
      }))
    }

    // TODO mutation with debounce of 2 seconds
    setSaveBeacon(true)
    postPatchMutation.mutate(
      { postId: String(post.id), body: { saved: !hasSaved } },
      {
        onSuccess,
      },
    )
  }

  const [calloutErrors, setCalloutErrors] = useState([])

  const postPatchForm = useForm<PostPatchRequest>({
    initialValues: {
      categories: post.categories,
    },
    validateInputOnChange: true,
    validate: {
      categories: (categories) => {
        const formUniqueCategories = getMatchingKeys(categories, uniqueCategories)
        if (formUniqueCategories.length > 1) {
          return `Cannot have a post with ${joinWithAnd(formUniqueCategories)} at the same time`
        }
      },
    },
  })

  const onCategoriesEditSuccess = (data, variables, context) => {
    showNotification({
      id: 'post-updated',
      title: 'Post updated',
      message: 'Post updated successfully',
      color: 'green',
      icon: <IconCheck size={18} />,
      autoClose: 5000,
    })

    queryClient.setQueryData<InfiniteData<PostsGetResponse>>([`apiGetPosts`, getPostsQueryParams], (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        data: page.data.map((p) => {
          if (p.id === post.id) {
            console.log('updating react query data')
            p.categories = postPatchForm.values.categories
          }
          return p
        }),
      })),
    }))
  }

  const onCategoriesEditSubmit = postPatchForm.onSubmit((values) => {
    postPatchMutation.mutate(
      {
        postId: String(post.id),
        body: { categories: values.categories },
      },
      {
        onError(error: any, variables, context) {
          setCalloutErrors(extractErrorMessages(error))
        },
        onSuccess: onCategoriesEditSuccess,
      },
    )
  })

  const handleCategoriesEditButtonClick = (e) => {
    e.stopPropagation()

    setCategoriesEditPopoverOpened(!categoriesEditPopoverOpened)
  }

  const handleLastSeenButtonClick = (e) => {
    e.stopPropagation()

    setLastSeenPostId(post.id)
  }

  const handleLikeButtonClick = (e) => {
    e.stopPropagation()

    const onSuccess = (data, variables, context) => {
      queryClient.setQueryData<InfiniteData<PostsGetResponse>>([`apiGetPosts`, getPostsQueryParams], (data) => ({
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          data: page.data.map((p) => {
            if (p.id === post.id) {
              console.log('updating react query data')
              if (hasLiked) {
                p.likedPosts = []
                --post._count.likedPosts
              } else {
                p.likedPosts = [{ postId: p.id, userId: p.userId }]
                ++post._count.likedPosts
              }
            }
            return p
          }),
        })),
      }))
    }

    // TODO mutation with debounce of 2 seconds
    setLikeBeacon(true)
    postPatchMutation.mutate(
      {
        postId: String(post.id),
        body: { liked: !hasLiked },
      },
      {
        onSuccess,
      },
    )
  }

  const openDeleteConfirmModal = () =>
    openConfirmModal({
      title: 'Delete post',
      children: <Text size="sm">This action cannot be reversed.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onCancel: () => console.log('Cancel'),
      onConfirm: () => console.log('Confirmed'),
    })

  const handleDeleteButtonClick = (e) => {
    e.stopPropagation()

    openDeleteConfirmModal()
  }

  const handleEditButtonClick = (e) => {
    e.stopPropagation()
  }

  const handleModerateButtonClick = (e) => {
    e.stopPropagation()

    const onSuccess = (data, variables, context) => {
      queryClient.setQueryData<InfiniteData<PostsGetResponse>>([`apiGetPosts`, getPostsQueryParams], (data) => ({
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          data: page.data.map((p) => {
            if (p.id === post.id) {
              console.log('updating react query data')
              p.isModerated = !p.isModerated
            }
            return p
          }),
        })),
      }))
    }
    setModerateButtonLoading(true)
    postPatchMutation.mutate(
      {
        postId: String(post.id),
        body: { isModerated: !post.isModerated },
      },
      {
        onSuccess,
      },
    )
  }

  function renderFooter() {
    return (
      <Card.Section className={classes.footer}>
        <Group position="apart">
          <Text size="xs" color="dimmed">
            {footer}
          </Text>
          <Group spacing={8}>
            <Tooltip label="Like" arrowPosition="center" withArrow>
              <Button
                classNames={{
                  root: hasLiked ? classes.likedAction : classes.action,
                }}
                disabled={!isAuthenticated}
                className={likeBeacon ? 'beacon' : ''}
                onClick={handleLikeButtonClick}
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
                <ActionIcon component="div">{truncateIntegerToString(post._count.likedPosts)}</ActionIcon>
              </Button>
            </Tooltip>

            {isAuthenticated && (
              <Tooltip label="Bookmark" arrowPosition="center" withArrow>
                <ActionIcon
                  className={`${classes.action} ${saveBeacon ? 'beacon' : ''}`}
                  onClick={handleSaveButtonClick}
                  onAnimationEnd={() => setSaveBeacon(false)}
                >
                  <IconBookmark
                    size={18}
                    color={theme.colors.yellow[6]}
                    stroke={1.5}
                    {...(hasSaved && { fill: theme.colors.yellow[6] })}
                  />
                </ActionIcon>
              </Tooltip>
            )}
            {lastSeenPostId !== post.id ? (
              <Tooltip label={lastSeenPostId === post.id ? '' : 'Mark as last seen'} arrowPosition="center" withArrow>
                <ActionIcon
                  className={`${classes.action} ${lastSeenBeacon ? 'beacon' : ''}`}
                  onClick={handleLastSeenButtonClick}
                  onAnimationEnd={() => setLastSeenBeacon(false)}
                >
                  <IconEye size={16} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            ) : null}
            <Tooltip label="Share" arrowPosition="center" withArrow>
              <ActionIcon
                className={classes.action}
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <IconShare size={16} color={theme.colors.blue[6]} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            <ProtectedComponent requiredRole="MODERATOR">
              <Tooltip label={post.isModerated ? 'Mark as not moderated' : 'Approve'} arrowPosition="center" withArrow>
                <ActionIcon
                  className={classes.action}
                  onClick={handleModerateButtonClick}
                  disabled={moderateButtonLoading}
                  loading={moderateButtonLoading}
                >
                  {post.isModerated ? (
                    <IconShieldOff size={16} color={'red'} stroke={1.5} />
                  ) : (
                    <IconShieldCheck size={16} color={'lime'} stroke={1.5} />
                  )}
                </ActionIcon>
              </Tooltip>
            </ProtectedComponent>
            <ProtectedComponent requiredRole="MODERATOR">
              <Tooltip label={'Edit'} arrowPosition="center" withArrow>
                <ActionIcon className={classes.action} onClick={handleEditButtonClick}>
                  <IconEdit size={16} color={theme.colors.blue[4]} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </ProtectedComponent>
            {canDeletePost && (
              <Tooltip label="Delete" arrowPosition="center" withArrow>
                <ActionIcon onClick={handleDeleteButtonClick} className={classes.action}>
                  <IconTrash size={16} color={theme.colors.red[6]} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Card.Section>
    )
  }

  function renderMetadata() {
    return (
      <Group mt="lg">
        <Avatar src={post.User.profileImage} radius="sm" />
        <div>
          <Text weight={500}>{post.User.displayName}</Text>
          <Text size="xs" color="dimmed">
            {showRelativeTimestamp(post.createdAt.toISOString())}
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
        dangerouslySetInnerHTML={{ __html: emotesTextToHtml(truncate(post.title, { length: 100 }), 28) }}
      ></Text>
    )
  }

  function renderBody() {
    return (
      <Text weight={700} className={classes.title} m={0}>
        <Button
          onClick={(e) => {
            e.stopPropagation()
          }}
          component="a"
          href={post.link}
          target="_blank"
          variant="subtle"
          m={0}
          size="xs"
          leftIcon={<IconExternalLink size={14} />}
        >
          {post.link}
        </Button>
        <Text
          size={'sm'}
          dangerouslySetInnerHTML={{
            __html: emotesTextToHtml(truncate(post.content, { length: 500 }), 20),
          }}
        ></Text>
      </Text>
    )
  }

  const [categoriesEditPopoverOpened, setCategoriesEditPopoverOpened] = useState(false)
  const categoryEditRef = useRef(null)

  const handleClickOutside = (e: MouseEvent) => {
    const dropdown = document.getElementsByClassName('mantine-MultiSelect-dropdown')[0]
    const multiselect = document.getElementsByClassName('mantine-MultiSelect-root')[0]
    if (dropdown && (e.target === dropdown || dropdown.contains(e.target as Node))) {
      console.log('clicked el is part of dropdown')
    }
    if (multiselect && (e.target === multiselect || multiselect.contains(e.target as Node))) {
      console.log('clicked el is part of multiselect')
    }
    setCategoriesEditPopoverOpened(false)
  }

  useEffect(() => {
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  function renderCategories() {
    return (
      <Group position="left">
        {post.categories?.map((category, i) => (
          <CategoryBadge
            className="disable-select"
            key={i}
            category={category}
            css={css`
              pointer-events: none;
              box-shadow: 1px 2px 4px ${theme.colorScheme === 'dark' ? '#8786881d' : '#5a5a5a36'};
              /* :hover {
                  filter: drop-shadow(0 1mm 1mm #00000030);
                  transform: scale(1.05);
                  transition-duration: 0.5s;
                } */
              /* :active {
                  filter: opacity(0.6);
                } */
            `}
          />
        ))}
        <ProtectedComponent requiredRole="MODERATOR">
          <Tooltip
            opened={categoriesEditPopoverOpened} // work around popover positioning shenanigans by using tooltip instead
            closeDelay={99999999}
            width={400}
            withinPortal
            styles={{
              tooltip: {
                backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1],
              },
            }}
            label={
              <>
                <ErrorCallout title="Error updating post" errors={calloutErrors} />
                <form onSubmit={onCategoriesEditSubmit} ref={categoryEditRef}>
                  <Flex
                    direction="column"
                    gap={10}
                    p={5}
                    justify="flex-start"
                    onClickCapture={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    css={css`
                      pointer-events: all;
                    `}
                  >
                    <MultiSelect
                      {...postPatchForm.getInputProps('categories')}
                      searchable
                      data={categoriesData}
                      limit={20}
                      valueComponent={Value}
                      itemComponent={Item}
                      placeholder="Pick categories"
                      label="Select post categories"
                    />

                    <Button
                      loading={postPatchMutation.isLoading}
                      size="xs"
                      type="submit"
                      leftIcon={<IconCheck size={16} stroke={1.5} />}
                    >
                      Save
                    </Button>
                  </Flex>
                </form>
              </>
            }
            arrowPosition="side"
            position="right-start"
            withArrow
          >
            <ActionIcon
              radius={999999}
              size={22}
              className={`${classes.categoryAction} post-categories-${post.id}`}
              onClick={handleCategoriesEditButtonClick}
            >
              <IconPlus
                color={theme.colorScheme === 'light' ? theme.colors.dark[5] : theme.colors.gray[1]}
                size={12}
                stroke={1.5}
              />
            </ActionIcon>
          </Tooltip>
        </ProtectedComponent>
      </Group>
    )
  }

  return (
    <Card
      p="lg"
      radius={12}
      className={`${classes.card} ${className ?? ''}`}
      onClick={(e) => {
        openModal({
          children: (
            <AspectRatio ratio={16 / 9}>
              <iframe
                src="https://www.youtube.com/embed/KY2eBrm5pT4"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </AspectRatio>
          ),
        })
      }}
      /* move to classes */
      css={css`
        background-repeat: no-repeat;
        background-size: auto 100%;
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
      {...(htmlProps as any)}
    >
      {props.children}
      {renderCategories()}
      {renderTitle()}
      {renderBody()}
      {renderMetadata()}
      {renderFooter()}
    </Card>
  )
}

export function PostSkeleton(props: Partial<PostProps>) {
  const { classes, theme } = useStyles()
  const { post, backgroundImage, footer, className, ...htmlProps } = props

  return (
    <Flex
      direction={'column'}
      justify="center"
      p={15}
      className={`${classes.skeletonCard} ${className ?? ''}`}
      {...(htmlProps as any)}
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

export default React.memo(Post)
