select
    *
from
    tocomment tc
    left join comment c on tc.tocomment_id = c.id
where
    tc.comment_id = '${commentId}'
    and c.is_deleted = false;