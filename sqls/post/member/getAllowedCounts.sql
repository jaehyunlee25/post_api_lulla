select 
    count(ac.post_id) ac_count, 
    count(am.post_id) am_count 
from post p
    left join allowed_class ac on ac.post_id = p.id
    left join allowed_member am on am.post_id = p.id
where 
    p.id = '${postId}';