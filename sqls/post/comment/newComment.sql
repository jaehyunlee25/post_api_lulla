insert into
    comment(
        id,
        content,
        created_at,
        updated_at,
        member_id,
        post_id
    )
values(
    uuid_generate_v1(),
    '${content}',
    now(),
    now(),
    '${memberId}',
    '${postId}'
) returning id;