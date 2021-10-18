insert into
    bookmark(
        id,
        created_at,
        updated_at,
        member_id,
        post_id,
        type
    )
values(
    uuid_generate_v1(),
    now(),
    now(),
    '${memberId}',
    '${postId}',
    1
) returning id;
