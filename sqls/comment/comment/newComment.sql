insert into
    comment(
        id,
        content,
        created_at,
        updated_at,
        member_id,
        target_member_id
    )
values(
    uuid_generate_v1(),
    '${content}',
    now(),
    now(),
    '${memberId}',
    '${targetMemberId}'
) returning id;