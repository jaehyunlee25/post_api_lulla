select 
    count(*) count
from 
    allowed_member am 
where 
    am.post_id = '${postId}';