insert into
    post(
        id,
        post_type,
        important,
        title,
        is_published,
        published_time,
        created_at,
        updated_at,
        author_id,
        school_id,
        contents
    )
values(
    uuid_generate_v1(),
    ${postType},
    ${important},
    '${title}',
    ${isPublished},
    ${publishedTime},
    now(),
    now(),
    '${memberId}',
    '${schoolId}',
    '${contents}'
) 
returning id;