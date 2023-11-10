import { makeRequest } from "./makeRequest";

export function createComment({ postId, message, parentId }) {
  console.log("POST ID", postId);
  return makeRequest(`post/${postId}/comments`, {
    method: "POST",
    data: {
      message,
      parentId,
    },
  });
}

export function updateComment({ postId, message, id }) {
  console.log("COMMENT ID", id);
  return makeRequest(`post/${postId}/comments/${id}`, {
    method: "PUT",
    data: {
      message,
    },
  });
}

export function deleteComment({ postId, id }) {
  console.log("COMMENT ID", id);
  return makeRequest(`post/${postId}/comments/${id}`, {
    method: "DELETE",
  });
}

export function toggleCommentLike({ postId, id }) {
  console.log("COMMENT ID", id);
  return makeRequest(`/post/${postId}/comments/${id}/toggleLike`, {
    method: "POST",
  });
}
