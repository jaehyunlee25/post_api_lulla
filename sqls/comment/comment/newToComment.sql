insert into
    toComment(
        created_at,
        updated_at,
        comment_id,
        tocomment_id
    )
values(
    now(),
    now(),
    '${commentId}',
    '${toCommentId}'
) returning id;