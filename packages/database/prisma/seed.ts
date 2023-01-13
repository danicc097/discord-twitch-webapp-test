import { User, PrismaClient, Prisma, Post, PostCategory } from '@prisma/client'
import { faker } from '@faker-js/faker'
import _, { uniq } from 'lodash'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function main() {
  // 2000 users -> ~1MB
  const postCreates: Prisma.PostCreateArgs[] = []

  const createUser = () =>
    ({
      id: crypto.randomUUID(),
      displayName: faker.name.fullName(),
      role: 'USER',
      twitchId: faker.finance.amount(),
    } as Prisma.UserCreateArgs['data'])

  const users = Array(10)
    .fill(null)
    .map(() => createUser())

  const dev: Prisma.UserCreateArgs['data'] = {
    id: crypto.randomUUID(),
    displayName: process.env.TWITCH_DEV_USERNAME,
    role: 'ADMIN',
    twitchId: process.env.TWITCH_DEV_ID,
  }
  users.push(dev)
  users.push({
    id: crypto.randomUUID(),
    displayName: 'caliebre',
    role: 'ADMIN',
    twitchId: '52341091',
  })

  await prisma.user.createMany({
    data: users,
  })

  let postId = 1
  const createPost = () =>
    ({
      id: ++postId,
      userId: _.sample(users.slice(8, -1))?.id,
      title:
        _.sample(['calieamor2', 'calie13', 'caliebongo2', 'calietravieso', 'caliesusto1', 'calierana']) +
        ' ' +
        faker.lorem.sentence(),
      content: faker.internet.url(),
      isModerated: _.random(0, 1, true) > 0.5,
      link: faker.internet.url(),
      categories: _.uniq(
        Array(_.random(0, 5))
          .fill(null)
          .map((e) => _.sample(Object.values(PostCategory)) as PostCategory),
      ),
    } as Prisma.PostCreateArgs['data'])

  const posts = Array(50)
    .fill(null)
    .map(() => createPost())

  await prisma.post.createMany({
    data: posts as any,
  })

  let likedPostId = 1
  const createLikedPost = () =>
    ({
      postId: ++likedPostId,
      userId: dev.id,
    } as Prisma.SavedPostCreateArgs['data'])

  const likedPosts = Array(5)
    .fill(null)
    .map(() => createLikedPost())

  await prisma.likedPost.createMany({
    data: likedPosts as any,
  })
}
main()
