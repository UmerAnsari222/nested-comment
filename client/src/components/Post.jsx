import { usePost } from "../context/PostContext";
import { useAsyncFn } from "../hooks/useAsync";
import { createComment } from "../services/comments";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";

export function Post() {
  const { post, rootComments, createLocalComment } = usePost();
  const {
    loading,
    error,
    execute: createCommentFn,
  } = useAsyncFn(createComment);

  function onCommentCreate(message) {
    console.log(post.id);
    return createCommentFn({ postId: post.id, message }).then(
      createLocalComment
    );
  }

  return (
    <>
      <h1>{post.title}</h1>
      <article>{post.body}</article>
      <h3 className="comment-title">Comments</h3>
      <div className="mt-4">
        <CommentForm
          loading={loading}
          error={error}
          onSubmit={onCommentCreate}
        />
      </div>
      {rootComments != null && rootComments.length > 0 && (
        <CommentList comments={rootComments} />
      )}
    </>
  );
}
