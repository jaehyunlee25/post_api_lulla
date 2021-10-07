select 
    count(p.id)
from post p 
where 
    p.post_type = 0 
    -- allowed_member_compare
    and 1 = (select count(*) 
            from allowed_member am 
            where 
                am.post_id = p.id 
                and am.member_id = '${memberId}')
    -- allowed_class_compare
    or 1 = (select count(*) 
        from allowed_class ac 
        where 
            ac.post_id = p.id 
            and ac.class_id = '${classId}'
        )
    and p.is_published = ${isPublished}
    -- author 검색
    and p.author_id 
        in (select m.id 
            from member m 
            where m.nickname like '%${search}%') 
    or p.author_id 
        in (select m.id 
            from member m 
                join kid k on k.id = m.kid_id
            where k.name like '%${search}%') 
    or p.author_id 
        in (select m.id 
            from member m 
                join class c on c.id = m.class_id 
            where c.name like '%${search}%');