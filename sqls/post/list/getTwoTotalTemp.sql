select 
    count(p.id)
from 
    post p
where 
    p.author_id = '${memberId}' 
    and p.post_type = 0 
    and p.is_published = ${isPublished};