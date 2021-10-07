select 
    count(p.id)
from post p 
    left join survey s on s.post_id = p.id
where 
    p.post_type = 0 
    and p.school_id = '${schoolId}'
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