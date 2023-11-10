import Fastify from "fastify";
import dotenv from "dotenv";
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";

import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = Fastify();
const prisma = new PrismaClient();

app.register(sensible);
app.register(cors, {
  origin: true,
  credentials: true,
});
app.register(cookie, { secret: process.env.COOKIE_SECRET });

app.addHook("onRequest", (req, res, done) => {
  if (req.cookies.userId !== CURRENT_USER_ID) {
    req.cookies.userId = CURRENT_USER_ID;
    res.clearCookie("userId");
    res.setCookie("userId", CURRENT_USER_ID);
  }
  done();
});

const CURRENT_USER_ID = (
  await prisma.user.findFirst({ where: { name: "Kyle" } })
).id;

app.get("/posts", async (req, res) => {
  return commitDB(
    prisma.post.findMany({
      select: {
        id: true,
        title: true,
      },
    })
  );
});

app.get("/post/:id", async (req, res) => {
  return commitDB(
    prisma.post.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        body: true,
        title: true,
        comments: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            message: true,
            parentId: true,
            createdAt: true,
            _count: {
              select: { likes: true },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })
  ).then(async (post) => {
    const likes = await prisma.like.findMany({
      where: {
        userId: req.cookies.userId,
        commentId: { in: post.comments.map((comment) => comment.id) },
      },
    });

    return {
      ...post,
      comments: post.comments.map((comment) => {
        const { _count, ...commentFields } = comment;
        return {
          ...commentFields,
          likedByMe: likes.find((like) => like.commentId === comment.id),
          likeCount: _count.likes,
        };
      }),
    };
  });
});

app.post("/post/:id/comments", async (req, res) => {
  if (req.body.message === "" || req.body.message === null) {
    return res.send(app.httpErrors.badRequest("Message is required"));
  }

  console.log(req.params.postId);

  return await commitDB(
    prisma.comment.create({
      data: {
        message: req.body.message,
        userId: req.cookies.userId,
        parentId: req.body.parentId,
        postId: req.params.id,
      },
      select: {
        id: true,
        message: true,
        parentId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
  ).then((comment) => {
    return {
      ...comment,
      likeCount: 0,
      likedByMe: false,
    };
  });
});

app.put("/post/:userId/comments/:commentId", async (req, res) => {
  if (req.body.message === "" || req.body.message === null) {
    return res.send(app.httpErrors.badRequest("Message is required"));
  }

  const { userId } = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true },
  });

  if (userId !== req.cookies.userId) {
    return res.send(
      app.httpErrors.unauthorized(
        "You don't have permission to edit this comment"
      )
    );
  }

  return await commitDB(
    prisma.comment.update({
      where: { id: req.params.commentId },
      data: { message: req.body.message },
      select: { message: true },
    })
  );
});

app.delete("/post/:userId/comments/:commentId", async (req, res) => {
  const { userId } = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true },
  });

  if (userId !== req.cookies.userId) {
    return res.send(
      app.httpErrors.unauthorized(
        "You don't have permission to delete this comment"
      )
    );
  }

  return await commitDB(
    prisma.comment.delete({
      where: { id: req.params.commentId },
      select: { id: true },
    })
  );
});

app.post("/post/:postId/comments/:commentId/toggleLike", async (req, res) => {
  const data = {
    commentId: req.params.commentId,
    userId: req.cookies.userId,
  };

  const like = await prisma.like.findUnique({
    where: { userId_commentId: data },
  });

  if (like == null) {
    return await commitDB(prisma.like.create({ data })).then(() => {
      return { addLike: true };
    });
  } else {
    return await commitDB(
      prisma.like.delete({ where: { userId_commentId: data } })
    ).then(() => {
      return { addLike: false };
    });
  }
});

async function commitDB(promise) {
  const [error, data] = await app.to(promise);

  if (error) return app.httpErrors.internalServerError(error.message);
  return data;
}

app.listen({ port: process.env.PORT });
