insert into
    bookmark(
        id,
        created_at,
        updated_at,
        member_id,
        image_id,
        type
    )
values(
    uuid_generate_v1(),
    now(),
    now(),
    '${memberId}',
    '${imageId}',
    1
) returning id;
