select
    *
from
    comment
where
    id = (select
                comment_id
            from
                tocomment
            where
                tocomment_id ='${commentId}')
    and is_deleted = true;