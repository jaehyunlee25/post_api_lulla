insert into
    likes(
        id,
        created_at,
        updated_at,
        member_id,
        post_id
    )
values(
    uuid_generate_v1(),
    now(),
    now(),
    '${memberId}',
    '${postId}'
) returning id;