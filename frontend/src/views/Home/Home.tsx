import { useEffect, useState } from 'react'
import Posts from '../../components/Post.old'
import Post, { PostSkeleton } from '../../components/Post'
import Cookies from 'js-cookie'
import Header from '../../components/Header'
import {
  Checkbox,
  Code,
  Container,
  Flex,
  Group,
  ScrollArea,
  Skeleton,
  Space,
  Text,
  TextInput,
  createStyles,
  useMantineTheme,
} from '@mantine/core'
import homeBackground from 'src/assets/background-la-clipassa.jpg'
import useAuthenticatedUser from 'src/hooks/auth/useAuthenticatedUser'
import { css } from '@emotion/react'
import { showRelativeTimestamp } from 'src/utils/date'
import dayjs from 'dayjs'
import { useForm } from '@mantine/form'
import type { PostCreateRequest, PostQueryParams } from 'types'
import { capitalize } from 'lodash-es'
import { isURL } from 'src/utils/url'
import HomeSideActions from 'src/views/Home/HomeSideActions'
import { emotesTextToHtml } from 'src/services/twitch'
import { declareComponentKeys } from 'i18nifty'
import { usePostsSlice } from 'src/slices/posts'
import { usePosts } from 'src/queries/api/posts'

const useStyles = createStyles((theme) => ({}))

// TODO padding before footer including image (right now empty background)
export default function Home() {
  const { classes } = useStyles()
  const usePostsQuery = usePosts()
  const { getPostsQueryParams } = usePostsSlice()

  // refetch is used to query with old data, thats why it doesnt accept parameters,
  //  this is not the way to use react-query, add state to query key list
  // useEffect(() => {
  //   if (!usePostsQuery.isFetching) {
  //     usePostsQuery.refetch().then((res) => console.log(res.data))
  //   }
  // }, [getPostsQueryParams])

  console.log(usePostsQuery.data)

  return (
    <>
      <div
        style={{
          background: `url(${homeBackground}) no-repeat center/cover`,
          minHeight: '105vh',
          overflow: 'hidden',
          position: 'absolute',
          msFlex: 'none',
          flex: 'none',
          width: '100%',
          backgroundPosition: '50% 50%',
        }}
      />
      <Flex style={{ padding: 0 }} direction="row" justify={'space-between'}>
        <ScrollArea
          css={css`
            align-self: flex-start;
            height: 100vh;
            margin-top: 1rem;
            & {
              padding-bottom: 0px; // TODO adapt to footer
            }
          `}
          type="never"
        >
          <Container
            css={css`
              .post:not(:first-child) {
                margin-top: 1rem;
              }
              width: 100%;
            `}
          >
            <Post
              author={{
                name: 'some_user',
                description: showRelativeTimestamp(dayjs().subtract(15, 'minutes').toJSON()),
                image: null, //author.profileImage
              }}
              categories={['SIN_SONIDO', 'DIAMANTE', 'NO_SE_YO']}
              title={
                'Text with emote calieAMOR2. A very very very very very very very very very very very very very very very very very very very very very very long post'
              }
              className="post"
              footer={<div>Some extra info</div>}
              likes={100}
            />
            <Post
              author={{
                name: 'some_user',
                description: showRelativeTimestamp(dayjs().subtract(360, 'minutes').toJSON()),
                image: null, //author.profileImage
              }}
              categories={['SIN_SONIDO', 'RANA']}
              title={'Some title for this'}
              className="post"
              footer={<div>Some extra info</div>}
              likes={4324}
            />
            <Post
              author={{
                name: 'some_user',
                description: showRelativeTimestamp(dayjs().subtract(15, 'days').toJSON()),
                image: null, //author.profileImage
              }}
              categories={['ORO']}
              title={'Some title for this'}
              className="post"
              footer={<div>Some extra info</div>}
              likes={14324}
            />
            {Array(2)
              .fill(null)
              .map((e, idx) => (
                <Post
                  key={idx}
                  author={{
                    name: 'some_user',
                    description: showRelativeTimestamp(dayjs().subtract(15, 'months').toJSON()),
                    image: null, //author.profileImage
                  }}
                  categories={[]}
                  title={'Some title for this'}
                  className="post"
                  footer={<div>Some extra info</div>}
                  likes={2}
                />
              ))}
            <PostSkeleton className="post" />
            <PostSkeleton className="post" />
          </Container>
        </ScrollArea>
        <Space p={5} />
        <HomeSideActions
          css={css`
            @media only screen and (max-width: 1200px) {
              display: none;
            }
          `}
        />
      </Flex>
    </>
  )
}
