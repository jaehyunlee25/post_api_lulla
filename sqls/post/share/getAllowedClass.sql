select 
    count(*) count
from 
    allowed_class ac 
where 
    ac.post_id = '${postId}';