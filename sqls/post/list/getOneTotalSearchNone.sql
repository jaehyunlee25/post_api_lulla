select 
    count(p.id)
from post p 
    left join survey s on s.post_id = p.id
where 
    p.post_type = 0 
    and p.school_id = '${schoolId}'
    and p.is_published = ${isPublished};