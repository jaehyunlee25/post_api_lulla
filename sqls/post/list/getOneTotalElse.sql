select 
    count(p.id)
from 
    post p
where 
    p.school_id = '${schoolId}' 
    and p.post_type = 0 
    and p.is_published = ${isPublished};