select
    p.*,
    m.image_id member_image_id 
from
    post p
    left join member m on m.id = p.author_id
where
    p.id = '${postId}';